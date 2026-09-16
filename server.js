require('dotenv').config();

const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MONGO_URI is required.');
  process.exit(1);
}

const client = new MongoClient(mongoUri);
let db;

app.use(express.json({ limit: '10mb' }));
app.use(cookieSession({
  name: 'travel_session',
  keys: [process.env.SESSION_SECRET || 'change-me-in-production'],
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 7,
}));

function requireAuth(req, res, next) {
  if (!req.session || !req.session.username) {
    return res.status(401).json({ status: 'Unauthorized' });
  }
  next();
}

function usernameFromSession(req) {
  return req.session.username;
}

async function initUserData(username) {
  await Promise.all([
    db.collection('Countries').updateOne({ Username: username }, { $setOnInsert: { Countries: [] } }, { upsert: true }),
    db.collection('TravelStats').updateOne({ Username: username }, { $setOnInsert: { Continents: 0, Countries: 0, States: 0, Megacities: 0 } }, { upsert: true }),
    db.collection('WhereImGoing').updateOne({ Username: username }, { $setOnInsert: { Trips: [] } }, { upsert: true }),
    db.collection('TravelTools').updateOne({ Username: username }, { $setOnInsert: { UpcomingFlights: [], PackingList: [{ name: 'General Packing', list: [] }] } }, { upsert: true }),
  ]);
}

app.post('/api/signup', async (req, res) => {
  const { username, password, firstName, email, profileimage } = req.body;
  if (!username || !password || !firstName || !email) return res.status(400).json({ status: 'Missing required fields' });
  const existing = await db.collection('Users').findOne({ $or: [{ Username: username }, { Email: email }] });
  if (existing) return res.status(409).json({ status: 'User already exists' });
  const passwordHash = await bcrypt.hash(password, 12);
  await db.collection('Users').insertOne({ Username: username, PasswordHash: passwordHash, FirstName: firstName, Email: email, ProfileImage: profileimage || '' });
  await initUserData(username);
  res.status(201).json({ status: 'Success' });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.collection('Users').findOne({ Username: username });
  if (!user) return res.status(401).json({ firstName: '', username: '', email: '', profileimage: '', status: 'Incorrect Username or Password' });
  let valid = false;
  if (user.PasswordHash) valid = await bcrypt.compare(password, user.PasswordHash);
  else if (user.Password && user.Password === password) {
    valid = true;
    await db.collection('Users').updateOne({ _id: user._id }, { $set: { PasswordHash: await bcrypt.hash(password, 12) }, $unset: { Password: '' } });
  }
  if (!valid) return res.status(401).json({ firstName: '', username: '', email: '', profileimage: '', status: 'Incorrect Username or Password' });
  req.session.username = user.Username;
  res.json({ firstName: user.FirstName, username: user.Username, email: user.Email, profileimage: user.ProfileImage || '', status: 'Success' });
});

app.post('/api/logout', (req, res) => { req.session = null; res.json({ status: 'Success' }); });
app.get('/api/session', requireAuth, async (req, res) => {
  const user = await db.collection('Users').findOne({ Username: usernameFromSession(req) });
  res.json({ firstName: user.FirstName, username: user.Username, email: user.Email, profileimage: user.ProfileImage || '', status: 'Success' });
});

app.delete('/api/deleteuser/:username', requireAuth, async (req, res) => {
  const username = usernameFromSession(req);
  await Promise.all(['Users','Countries','TravelStats','WhereImGoing','TravelTools'].map(c => db.collection(c).deleteMany({ Username: username })));
  req.session = null;
  res.json({ status: 'Success' });
});

app.get('/api/getcountries/:username', requireAuth, async (req,res) => {
  const doc = await db.collection('Countries').findOne({ Username: usernameFromSession(req) });
  res.json({ countries: doc?.Countries || [], status: 'Success' });
});
app.put('/api/addcountry/:username', requireAuth, async (req,res) => { await db.collection('Countries').updateOne({Username:usernameFromSession(req)},{$addToSet:{Countries:req.body.country}},{upsert:true}); res.json({status:'Success'}); });
app.put('/api/deletecountry/:username', requireAuth, async (req,res) => { await db.collection('Countries').updateOne({Username:usernameFromSession(req)},{$pull:{Countries:req.body.country}}); res.json({status:'Success'}); });
app.post('/api/addusertocountries', requireAuth, async (req,res) => { await initUserData(usernameFromSession(req)); res.json({status:'Success'}); });

app.get('/api/gettravelstats/:username', requireAuth, async (req,res) => {
  const d = await db.collection('TravelStats').findOne({Username:usernameFromSession(req)}) || {};
  res.json({continents:d.Continents||0,countries:d.Countries||0,states:d.States||0,megacities:d.Megacities||0,status:'Success'});
});
app.post('/api/addemptytravelstats', requireAuth, async (req,res) => { await initUserData(usernameFromSession(req)); res.json({status:'Success'}); });
app.put('/api/addtravelstat/:username', requireAuth, async (req,res) => { const allowed=['Continents','Countries','States','Megacities']; if(!allowed.includes(req.body.statname)) return res.status(400).json({status:'Invalid stat'}); await db.collection('TravelStats').updateOne({Username:usernameFromSession(req)},{$inc:{[req.body.statname]:Number(req.body.amount)||0}},{upsert:true}); res.json({status:'Success'}); });

app.put('/api/updateprofileimage/:username', requireAuth, async (req,res) => {
  const profileimage = req.body.profileimage;
  if (typeof profileimage !== 'string' || !profileimage.startsWith('data:image/')) {
    return res.status(400).json({ status: 'Invalid image format' });
  }
  // Keep profile images small enough for reliable MongoDB storage and fast page loads.
  if (profileimage.length > 2_500_000) {
    return res.status(413).json({ status: 'Profile image is too large' });
  }
  const result = await db.collection('Users').updateOne(
    { Username: usernameFromSession(req) },
    { $set: { ProfileImage: profileimage } }
  );
  if (!result.matchedCount) {
    return res.status(404).json({ status: 'User not found' });
  }
  res.json({ status: 'Success', profileimage });
});
app.post('/api/upload', requireAuth, (req,res) => { const image=req.body.image; if(typeof image!=='string'||!image.startsWith('data:image/')) return res.status(400).json({filename:'',status:'Invalid image format'}); if(image.length>8_000_000) return res.status(413).json({filename:'',status:'Image too large'}); res.json({filename:image,status:'Success'}); });

app.post('/api/createemptygoing', requireAuth, async (req,res)=>{ await initUserData(usernameFromSession(req)); res.json({status:'Success'}); });
app.delete('/api/deletetrip/:username', requireAuth, async (req,res)=>{ const {destination,date}=req.body; await db.collection('WhereImGoing').updateOne({Username:usernameFromSession(req)},{$pull:{Trips:{Destination:destination,Date:date}}}); res.json({status:'Success'}); });
app.put('/api/addtrip/:username', requireAuth, async (req,res)=>{ const {destination,date,plans,image}=req.body; if(!destination || !date || !plans) return res.status(400).json({status:'Failed to add trip',message:'Destination, date, and plans are required'}); await db.collection('WhereImGoing').updateOne({Username:usernameFromSession(req)},{$push:{Trips:{Destination:destination,Date:date,Plans:plans,Image:image||''}}},{upsert:true}); res.json({status:'Success'}); });
app.put('/api/edittrip/:username', requireAuth, async (req,res)=>{ const {destination,date,newdate,newplans,newimage}=req.body; await db.collection('WhereImGoing').updateOne({Username:usernameFromSession(req)},{$pull:{Trips:{Destination:destination,Date:date}}}); await db.collection('WhereImGoing').updateOne({Username:usernameFromSession(req)},{$push:{Trips:{Destination:destination,Date:newdate,Plans:newplans,Image:newimage}}}); res.json({status:'Success'}); });
app.get('/api/gettrips/:username', requireAuth, async (req,res)=>{ const d=await db.collection('WhereImGoing').findOne({Username:usernameFromSession(req)}); res.json({trips:d?.Trips||[],status:'Success'}); });

app.post('/api/createtraveltools', requireAuth, async (req,res)=>{ await initUserData(usernameFromSession(req)); res.json({status:'Success'}); });
app.put('/api/addpackinglist/:username', requireAuth, async (req,res)=>{ const username=usernameFromSession(req); const name=String(req.body.name||'').trim(); if(!name) return res.status(400).json({status:'Packing list name is required'}); const existing=await db.collection('TravelTools').findOne({Username:username,'PackingList.name':name}); if(existing) return res.status(409).json({status:'Packing list already exists'}); const result=await db.collection('TravelTools').updateOne({Username:username},{$push:{PackingList:{name,list:[]}}},{upsert:true}); if(!result.acknowledged) return res.status(500).json({status:'Failed to add list'}); res.json({status:'Success'}); });
app.put('/api/addtopacking/:username', requireAuth, async (req,res)=>{ const list=Array.isArray(req.body.packinglist)?req.body.packinglist:[]; const result=await db.collection('TravelTools').updateOne({Username:usernameFromSession(req),'PackingList.name':req.body.name},{$set:{'PackingList.$.list':list}}); if(!result.matchedCount) return res.status(404).json({status:'Packing list not found'}); res.json({status:'Success'}); });
app.put('/api/getlist/:username', requireAuth, async (req,res)=>{ const d=await db.collection('TravelTools').findOne({Username:usernameFromSession(req)}); const lists=d?.PackingList||[]; const list=req.body.name ? (lists.find(p=>p.name===req.body.name)?.list||[]) : lists; res.json({list,status:'Success'}); });
app.put('/api/addflight/:username', requireAuth, async (req,res)=>{ const {port1,port1code,port1time,port2,port2code,port2time,boardingday,image}=req.body; if(!port1||!port1code||!port1time||!port2||!port2code||!port2time||!boardingday) return res.status(400).json({status:'Missing required flight fields'}); const flight={depart:port1,departcode:port1code,departtime:port1time,arrive:port2,arrivecode:port2code,arrivetime:port2time,boardingday,image:image||'City'}; await db.collection('TravelTools').updateOne({Username:usernameFromSession(req)},{$push:{UpcomingFlights:flight}},{upsert:true}); res.json({status:'Success'}); });
app.get('/api/getflights/:username', requireAuth, async (req,res)=>{ const d=await db.collection('TravelTools').findOne({Username:usernameFromSession(req)}); res.json({flights:d?.UpcomingFlights||[],status:'Success'}); });
app.put('/api/deleteflight/:username', requireAuth, async (req,res)=>{ await db.collection('TravelTools').updateOne({Username:usernameFromSession(req)},{$pull:{UpcomingFlights:{departcode:req.body.port1code,arrivecode:req.body.port2code}}}); res.json({status:'Success'}); });

app.get('/api/health', (req,res)=>res.json({status:'ok'}));

const distPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (req,res,next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

async function start() {
  await client.connect();
  db = client.db();
  await db.collection('Users').createIndex({Username:1},{unique:true});
  await db.collection('Users').createIndex({Email:1},{unique:true});
  app.listen(port, '0.0.0.0', () => console.log(`Server listening on ${port}`));
}
start().catch(err => { console.error(err); process.exit(1); });

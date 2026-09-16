# Travel Management Site

A full-stack travel planning application built with React, TypeScript, Node.js, Express, and MongoDB. Users can create accounts, manage upcoming trips, maintain packing lists and flights, track travel statistics, and personalize their profile.

## Portfolio Version

This repository began as a University of Central Florida team project. Christian Costa contributed primarily to frontend development during the original project and later independently modernized this version for secure cloud deployment.

### Independent modernization

- Replaced the original hard-coded production domain with same-origin API calls
- Added secure password hashing with bcrypt
- Added signed, HTTP-only session cookies
- Scoped protected database operations to the authenticated session instead of trusting browser-supplied usernames
- Added production environment configuration for MongoDB, sessions, and dynamic hosting ports
- Removed the obsolete GitHub webhook / PM2 deployment path
- Changed image handling to store user-selected images as data URLs in MongoDB-backed application data rather than ephemeral container files
- Configured Express to serve the production Vite build
- Added Docker deployment support
- Added health-check and production start behavior

## Tech Stack

- React + TypeScript
- Vite
- Node.js + Express
- MongoDB
- bcrypt
- Cookie-based sessions
- Docker

## Local Development

Create a `.env` file using `.env.example` as a reference, then run:

```bash
npm install
npm install --prefix frontend
npm run build --prefix frontend
npm start
```

The application requires a reachable MongoDB instance through `MONGO_URI`.

## Deployment

The included Dockerfile builds the React frontend and serves it from the Express backend. Configure:

```text
MONGO_URI=your-mongodb-connection-string
SESSION_SECRET=your-long-random-secret
```

The hosting platform may provide `PORT` automatically.

## Security Notes

The original classroom version stored plaintext passwords and trusted usernames supplied by the browser for protected operations. This portfolio version replaces those patterns with password hashing and authenticated session-based authorization.

## Attribution

This repository preserves the original team project history. The later security, deployment, authentication, Docker, and production-hosting modernization work is documented separately so the scope of the original and later contributions remains clear.

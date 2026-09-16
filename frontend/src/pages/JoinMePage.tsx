// src/pages/JoinMePage.tsx
import React from "react";
import "../css/JoinMe.css";

interface Post {
  id: number;
  user: string;
  avatar: string;
  image: string;
  caption: string;
}

const samplePosts: Post[] = [
  {
    id: 1,
    user: "Jane Doe",
    avatar: "/images/avatar-1.png",
    image: "/images/post-1.jpg",
    caption: "Exploring the mountains! Can’t wait for company 🏞️",
  },
  {
    id: 2,
    user: "John Smith",
    avatar: "/images/avatar-2.png",
    image: "/images/post-2.jpg",
    caption: "Beach trip planned for next week — DM me to join! 🌊☀️",
  },
  {
    id: 3,
    user: "TravelGuru",
    avatar: "/images/avatar-3.png",
    image: "/images/post-1.jpg",
    caption: "Road trip vibes 🚗💨 #JoinMe",
  },
];

const JoinMePage: React.FC = () => (
  <div className="joinme-page">
    <section className="joinme-intro">
      <h2 className="feed-title">Join Me — Community Prototype</h2>
      <p className="prototype-description">
        This page demonstrates a concept for a future community feature where
        travelers could share photos and experiences from their trips with other
        users. The posts below are sample content used to illustrate the intended
        design.
      </p>
      <span className="prototype-badge">Prototype Feature</span>
    </section>

    <div className="feed">
      {samplePosts.map((post) => (
        <div key={post.id} className="post-card">
          <div className="post-header">
            <img
              src={post.avatar}
              alt={`${post.user} avatar`}
              className="avatar"
            />
            <span className="username">{post.user}</span>
          </div>

          <img
            src={post.image}
            alt="Sample trip post"
            className="post-image"
          />

          <div className="post-body">
            <p className="caption">
              <strong>{post.user}</strong> {post.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default JoinMePage;

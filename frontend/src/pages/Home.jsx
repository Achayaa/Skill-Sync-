import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Home.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="home">
      <div className="hero">
        <h1 className="hero-title">Learn & Teach Skills</h1>
        <p className="hero-subtitle">
          Exchange skills with peers. Teach what you know, learn what you need.
          No money required - just skill credits!
        </p>
        {!isAuthenticated && (
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-outline btn-large">
              Login
            </Link>
          </div>
        )}
      </div>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>AI-Powered Matching</h3>
          <p>Find the perfect learning partner based on your skills and interests</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💳</div>
          <h3>Skill Credits System</h3>
          <p>Earn credits by teaching, spend them to learn. Start with 5 free credits!</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Progress Tracking</h3>
          <p>Track your learning journey with detailed dashboards and analytics</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <h3>Real-time Chat</h3>
          <p>Communicate with your learning partners instantly</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📅</div>
          <h3>Session Scheduling</h3>
          <p>Schedule and manage your learning sessions seamlessly</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⭐</div>
          <h3>Ratings & Reviews</h3>
          <p>Build your reputation through quality teaching and learning</p>
        </div>
      </div>
    </div>
  );
};

export default Home;


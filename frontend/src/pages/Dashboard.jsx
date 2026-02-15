import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { creditsAPI, sessionsAPI, matchesAPI, usersAPI } from '../services/api';
import { formatDate, formatDateTime } from '../utils/helpers';
import './Dashboard.css';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [balance, setBalance] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, sessionsRes, matchesRes] = await Promise.all([
        usersAPI.getProfile(), // GET /api/user/profile
        sessionsAPI.getSessions({ status: 'scheduled' }),
        matchesAPI.getMatches({ status: 'active' }),
      ]);

      const userProfile = profileRes.data.user;
      setBalance(userProfile.skillCredits || 0);
      updateUser(userProfile); // Update user context with latest data
      setSessions(sessionsRes.data.sessions?.slice(0, 5) || []);
      setMatches(matchesRes.data.matches?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome back, {user?.name}!</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Skill Credits</h3>
            <p className="stat-value">{balance}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>Upcoming Sessions</h3>
            <p className="stat-value">{sessions.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤝</div>
          <div className="stat-content">
            <h3>Active Matches</h3>
            <p className="stat-value">{matches.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Rating</h3>
            <p className="stat-value">
              {user?.rating?.asTeacher?.average?.toFixed(1) || '0.0'}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming Sessions</h2>
            <Link to="/sessions" className="btn btn-outline">View All</Link>
          </div>
          {sessions.length === 0 ? (
            <p className="empty-state">No upcoming sessions</p>
          ) : (
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session._id} className="session-item">
                  <div className="session-info">
                    <h4>{session.skill?.name}</h4>
                    <p>
                      {formatDateTime(session.scheduledDate)} • {session.duration} min
                    </p>
                    <p>
                      {session.teacher._id === (user?._id || user?.id) ? 'Teaching' : 'Learning'} with{' '}
                      {session.teacher._id === (user?._id || user?.id)
                        ? session.learner.name
                        : session.teacher.name}
                    </p>
                  </div>
                  <div className="session-credits">
                    {session.creditsSpent} credits
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h2>Active Matches</h2>
            <Link to="/matches" className="btn btn-outline">View All</Link>
          </div>
          {matches.length === 0 ? (
            <p className="empty-state">No active matches</p>
          ) : (
            <div className="matches-list">
              {matches.map((match) => (
                <div key={match._id} className="match-item">
                  <div className="match-info">
                    <h4>
                      {match.user1._id === (user?._id || user?.id)
                        ? match.user2.name
                        : match.user1.name}
                    </h4>
                    <p>
                      Teaching: {match.skillOffered?.name} • Learning:{' '}
                      {match.skillRequested?.name}
                    </p>
                    <p className="match-score">Match Score: {match.matchScore}%</p>
                  </div>
                  <Link
                    to={`/chat/${match._id}`}
                    className="btn btn-primary btn-sm"
                  >
                    Chat
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/skills" className="btn btn-primary">
          Manage Skills
        </Link>
        <Link to="/matches" className="btn btn-primary">
          Find Matches
        </Link>
        <Link to="/sessions" className="btn btn-primary">
          Schedule Session
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;


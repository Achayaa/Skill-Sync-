import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchesAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/helpers';
import './Matches.css';

const Matches = () => {
  const { user } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [activeMatches, setActiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('potential');

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const [potentialRes, activeRes] = await Promise.all([
        matchesAPI.findMatches(), // Using GET /api/match/find
        matchesAPI.getMatches({ status: 'active' }),
      ]);

      setPotentialMatches(potentialRes.data.matches || []);
      setActiveMatches(activeRes.data.matches || []);
    } catch (error) {
      console.error('Error loading matches:', error);
      setError(error.response?.data?.message || 'Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (matchData) => {
    try {
      setError('');
      await matchesAPI.createMatch({
        userId: matchData.user._id,
        skillOffered: matchData.skillOffered._id,
        skillRequested: matchData.skillRequested._id,
      });
      alert('Match request sent!');
      loadMatches();
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating match');
    }
  };

  if (loading) {
    return (
      <div className="matches-page">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <h1>Find Your Learning Partners</h1>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="matches-tabs">
        <button
          className={`tab ${activeTab === 'potential' ? 'active' : ''}`}
          onClick={() => setActiveTab('potential')}
        >
          Potential Matches ({potentialMatches.length})
        </button>
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Matches ({activeMatches.length})
        </button>
      </div>

      {activeTab === 'potential' ? (
        <div className="matches-grid">
          {potentialMatches.length === 0 ? (
            <p className="empty-state">No potential matches found. Add more skills to find matches!</p>
          ) : (
            potentialMatches.map((match) => (
              <div key={`${match.user._id}-${match.skillOffered._id}`} className="match-card">
                <div className="match-header">
                  <div className="user-avatar">
                    {match.user.avatar ? (
                      <img src={match.user.avatar} alt={match.user.name} />
                    ) : (
                      <span>{getInitials(match.user.name)}</span>
                    )}
                  </div>
                  <div className="user-info">
                    <h3>{match.user.name}</h3>
                    <p className="match-score">Match Score: {match.matchScore}%</p>
                    <p className="user-credits">💰 {match.user.skillCredits} credits</p>
                  </div>
                </div>
                <div className="match-skills">
                  <div className="skill-badge">
                    <span>Teaching: {match.skillOffered.name}</span>
                  </div>
                  <div className="skill-badge">
                    <span>Learning: {match.skillRequested.name}</span>
                  </div>
                </div>
                <div className="match-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCreateMatch(match)}
                  >
                    Connect
                  </button>
                  <Link
                    to={`/sessions?matchId=${match.user._id}&skillOffered=${match.skillOffered._id}`}
                    className="btn btn-success"
                  >
                    Request Session
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="matches-grid">
          {activeMatches.length === 0 ? (
            <p className="empty-state">No active matches</p>
          ) : (
            activeMatches.map((match) => {
              const otherUser = match.user1._id === (user?._id || user?.id) ? match.user2 : match.user1;
              return (
                <div key={match._id} className="match-card">
                  <div className="match-header">
                    <div className="user-avatar">
                      {otherUser.avatar ? (
                        <img src={otherUser.avatar} alt={otherUser.name} />
                      ) : (
                        <span>{getInitials(otherUser.name)}</span>
                      )}
                    </div>
                    <div className="user-info">
                      <h3>{otherUser.name}</h3>
                      <p className="match-score">Match Score: {match.matchScore}%</p>
                      <p className="match-status">Status: {match.status}</p>
                    </div>
                  </div>
                  <div className="match-skills">
                    <div className="skill-badge">
                      <span>Teaching: {match.skillOffered.name}</span>
                    </div>
                    <div className="skill-badge">
                      <span>Learning: {match.skillRequested.name}</span>
                    </div>
                  </div>
                  <div className="match-actions">
                    <Link to={`/chat/${match._id}`} className="btn btn-primary">
                      Chat
                    </Link>
                    <Link to="/sessions" className="btn btn-outline">
                      Schedule Session
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Matches;


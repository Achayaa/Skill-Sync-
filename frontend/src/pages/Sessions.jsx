import React, { useState, useEffect } from 'react';
import { sessionsAPI, matchesAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, isSessionPast, isSessionUpcoming } from '../utils/helpers';
import './Sessions.css';

const Sessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [formData, setFormData] = useState({
    scheduledDate: '',
    duration: 60,
    meetingLink: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [sessionsRes, matchesRes] = await Promise.all([
        sessionsAPI.getMySessions(), // GET /api/session/my-sessions
        matchesAPI.getMatches({ status: 'active' }),
      ]);

      setSessions(sessionsRes.data.sessions || []);
      setMatches(matchesRes.data.matches || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setError(error.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    try {
      await sessionsAPI.createSession({ // POST /api/session/create
        matchId: selectedMatch._id,
        scheduledDate: formData.scheduledDate,
        duration: parseInt(formData.duration),
        meetingLink: formData.meetingLink,
      });
      setShowCreateModal(false);
      setFormData({ scheduledDate: '', duration: 60, meetingLink: '' });
      setSelectedMatch(null);
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Error creating session');
    } finally {
      setCreating(false);
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      setError('');
      await sessionsAPI.updateSession(sessionId, { status: 'completed' });
      loadData();
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating session');
    }
  };

  const handleReviewSession = (session) => {
    setSelectedSession(session);
    setShowReviewModal(true);
  };

  const handleReviewSuccess = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="sessions-page">
        <div className="spinner"></div>
      </div>
    );
  }

  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const cancelledSessions = sessions.filter(s => s.status === 'cancelled');

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <h1>My Sessions</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Schedule New Session
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Schedule Session</h2>
            <form onSubmit={handleCreateSession}>
              <div className="form-group">
                <label className="form-label">Select Match</label>
                <select
                  className="form-select"
                  value={selectedMatch?._id || ''}
                  onChange={(e) => {
                    const match = matches.find(m => m._id === e.target.value);
                    setSelectedMatch(match);
                  }}
                  required
                >
                  <option value="">Choose a match...</option>
                  {matches.map((match) => (
                    <option key={match._id} value={match._id}>
                      {match.user1._id === (user?._id || user?.id) ? match.user2.name : match.user1.name} - {match.skillOffered.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  min="15"
                  max="480"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Meeting Link (optional)</label>
                <input
                  type="url"
                  className="form-input"
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sessions-tabs">
        <div className="tab-section">
          <h2>Scheduled ({scheduledSessions.length})</h2>
          {scheduledSessions.length === 0 ? (
            <p className="empty-state">No scheduled sessions</p>
          ) : (
            <div className="sessions-list">
              {scheduledSessions.map((session) => (
                <div key={session._id} className="session-card">
                  <div className="session-info">
                    <h3>{session.skill.name}</h3>
                    <p>{formatDateTime(session.scheduledDate)}</p>
                    <p>
                      Duration: {session.duration} minutes • {session.creditsSpent} credits
                    </p>
                    <p>
                      {session.teacher._id === (user?._id || user?.id) ? 'Teaching' : 'Learning'} with{' '}
                      {session.teacher._id === (user?._id || user?.id)
                        ? session.learner.name
                        : session.teacher.name}
                    </p>
                    {session.meetingLink && (
                      <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                        Join Meeting
                      </a>
                    )}
                  </div>
                  {isSessionPast(session.scheduledDate) && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleCompleteSession(session._id)}
                    >
                      Mark Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tab-section">
          <h2>Completed ({completedSessions.length})</h2>
          {completedSessions.length === 0 ? (
            <p className="empty-state">No completed sessions</p>
          ) : (
            <div className="sessions-list">
              {completedSessions.map((session) => {
                const isTeacher = session.teacher._id === (user?._id || user?.id);
                const hasReviewed = isTeacher
                  ? session.feedback?.fromTeacher?.rating
                  : session.feedback?.fromLearner?.rating;
                
                return (
                  <div key={session._id} className="session-card">
                    <div className="session-info">
                      <h3>{session.skill.name}</h3>
                      <p>{formatDateTime(session.scheduledDate)}</p>
                      <p>
                        {isTeacher ? 'Taught' : 'Learned'} with{' '}
                        {isTeacher ? session.learner.name : session.teacher.name}
                      </p>
                      {hasReviewed && (
                        <p className="review-status">
                          Your rating: {isTeacher ? session.feedback.fromTeacher.rating : session.feedback.fromLearner.rating} ⭐
                        </p>
                      )}
                    </div>
                    {!hasReviewed && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleReviewSession(session)}
                      >
                        Rate Session
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showReviewModal && selectedSession && (
        <ReviewModal
          session={selectedSession}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSession(null);
          }}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
};

export default Sessions;


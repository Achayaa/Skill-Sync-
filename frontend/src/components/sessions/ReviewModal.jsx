import React, { useState } from 'react';
import { sessionsAPI } from '../../services/api';
import './ReviewModal.css';

const ReviewModal = ({ session, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await sessionsAPI.submitReview({
        sessionId: session._id,
        rating,
        comments,
      });
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Rate Your Session</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Rating</label>
            <div className="rating-input">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= rating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ⭐
                </button>
              ))}
              <span className="rating-value">{rating} / 5</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Comments (optional)</label>
            <textarea
              className="form-textarea"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your experience..."
              rows="4"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;


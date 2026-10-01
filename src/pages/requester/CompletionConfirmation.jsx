import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CheckCircle2, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function CompletionConfirmation({ requests }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const req = (requests || []).find(r => r.id === id) || (requests && requests[0]);

  const handleSubmitRating = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      navigate('/requester/requests');
    }, 1500);
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="page-title">Service Completion Confirmation</h1>
          <p className="page-subtitle">Confirm resolution and rate technician service quality for {req?.id || 'Request'}.</p>
        </div>
      </div>

      <div className="form-card-container text-center">
        {submitted ? (
          <div className="success-state py-8">
            <CheckCircle2 size={48} className="text-success mx-auto mb-4" />
            <h2>Thank You for Your Feedback!</h2>
            <p className="text-muted">Your rating has been recorded and ticket #{req?.id || 'SR-1086'} is officially closed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRating} className="dialog-body">
            <div className="rating-box">
              <h3>How satisfied were you with the resolution?</h3>
              <p className="text-muted mb-4">Technician: <strong>{req?.assignedTechName || 'Field Specialist'}</strong></p>

              <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= rating ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    <Star size={32} />
                  </button>
                ))}
              </div>
              <span className="rating-label">{rating} Out of 5 Stars</span>
            </div>

            <div className="form-group text-left mt-6">
              <label className="form-label">Additional Feedback & Comments (Optional)</label>
              <textarea
                rows={4}
                className="form-textarea"
                placeholder="Let us know what went well or how we can improve our service desk response time..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              ></textarea>
            </div>

            <div className="dialog-footer mt-6">
              <button type="submit" className="btn-primary w-full">
                <Send size={16} />
                <span>Submit Rating & Confirm Closure</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

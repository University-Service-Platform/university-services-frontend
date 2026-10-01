import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Clock, Shield, User, AlertCircle, Sparkles } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function RequestTimeline({ requests }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const req = (requests || []).find(r => r.id === id) || (requests && requests[0]);

  if (!req) return <div className="page-container"><p>Request not found.</p></div>;

  const timelineSteps = req.timeline || [
    { time: req.createdAt, author: req.requester, status: 'Submitted', text: 'Service request created.' }
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="page-title">Request Timeline — {req.id}</h1>
          <p className="page-subtitle">Real-time audit log and status progression steps for "{req.title}"</p>
        </div>
      </div>

      <div className="timeline-container-card">
        <div className="timeline-header">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <span className="font-bold">Active Lifecycle Status: {req.status}</span>
          </div>
          <span className="text-muted">Estimated SLA: {req.slaRemaining}</span>
        </div>

        <div className="vertical-timeline">
          {timelineSteps.map((step, idx) => (
            <div key={idx} className="timeline-item">
              <div className="timeline-marker">
                <CheckCircle2 size={16} className="marker-icon" />
              </div>
              <div className="timeline-content">
                <div className="timeline-meta">
                  <span className="timeline-author">{step.author}</span>
                  <span className="timeline-time">{step.time}</span>
                </div>
                <div className="timeline-status-badge">{step.status}</div>
                <p className="timeline-text">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

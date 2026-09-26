import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User, Phone, Mail, Wrench, Shield, CheckCircle2 } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function WorkOrderDetails({ requests }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const req = (requests || []).find(r => r.id === id || r.workOrderId === id) || (requests && requests[0]);

  if (!req) return <div className="page-container"><p>Work Order not found.</p></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2">
            <span className="wo-id-tag">{req.workOrderId || req.id}</span>
            <span className="badge-pill" style={{ backgroundColor: colors.priority[req.priority].bg, color: colors.priority[req.priority].text }}>
              {colors.priority[req.priority].label}
            </span>
          </div>
          <h1 className="page-title mt-2">{req.title}</h1>
        </div>

        <button className="btn-primary" onClick={() => navigate(`/technician/update/${req.id}`)}>
          <Wrench size={16} />
          <span>Update Work Progress</span>
        </button>
      </div>

      <div className="detail-grid-container">
        <div className="detail-card-main">
          <h2>Technical & Site Details</h2>
          <div className="detail-grid mt-4">
            <div className="detail-field">
              <label>Location & Campus Site</label>
              <span>{req.location || 'Building 4, Room B-12'}</span>
            </div>
            <div className="detail-field">
              <label>Equipment / Service Category</label>
              <span>{req.category}</span>
            </div>
            <div className="detail-field">
              <label>Requester Contact</label>
              <span>{req.requester} ({req.requesterEmail || 'Email unavailable'})</span>
            </div>
            <div className="detail-field">
              <label>SLA Clock</label>
              <span>{req.slaRemaining}</span>
            </div>
          </div>

          <div className="detail-section mt-6">
            <label>Problem Statement</label>
            <p className="detail-box">{req.description}</p>
          </div>

          {req.workNotes && req.workNotes.length > 0 && (
            <div className="detail-section mt-6">
              <label>Logged Work Notes</label>
              <div className="work-notes-list">
                {req.workNotes.map((note, idx) => (
                  <div key={idx} className="work-note-item">
                    <span className="note-time">{note.timestamp} — {note.author}</span>
                    <p className="note-text">{note.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="detail-card-sidebar">
          <h3>Field Checklist</h3>
          <div className="checklist-item"><input type="checkbox" defaultChecked /> Verify Site Access & Power</div>
          <div className="checklist-item"><input type="checkbox" defaultChecked /> Inspect Hardware Diagnostic LEDs</div>
          <div className="checklist-item"><input type="checkbox" /> Swap Faulty Component / Dock</div>
          <div className="checklist-item"><input type="checkbox" /> Confirm User Resolution Sign-off</div>
        </div>
      </div>
    </div>
  );
}

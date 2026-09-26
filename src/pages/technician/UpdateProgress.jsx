import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Wrench, Clock, Send, Package } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function UpdateProgress({ requests, onUpdateRequest }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const req = (requests || []).find(r => r.id === id || r.workOrderId === id) || (requests && requests[0]);

  const [status, setStatus] = useState(req?.status || 'IN_PROGRESS');
  const [newNote, setNewNote] = useState('');
  const [resolutionText, setResolutionText] = useState(req?.resolutionDetails || '');

  if (!req) return <div className="page-container"><p>Work order not found.</p></div>;

  const handleSubmit = (e) => {
    e.preventDefault();

    const existingNotes = req.workNotes || [];
    const updatedNotes = newNote.trim() 
      ? [...existingNotes, { timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16), author: 'Technician', note: newNote }]
      : existingNotes;

    const updated = {
      ...req,
      status,
      workNotes: updatedNotes,
      resolutionDetails: status === 'RESOLVED' ? resolutionText : req.resolutionDetails
    };

    if (onUpdateRequest) {
      onUpdateRequest(updated);
    }

    navigate('/technician/dashboard');
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="page-title">Update Field Work Progress — {req.workOrderId || req.id}</h1>
          <p className="page-subtitle">Log work activity, record component replacements, or mark task as resolved.</p>
        </div>
      </div>

      <div className="form-card-container">
        <form onSubmit={handleSubmit} className="dialog-body">
          <div className="form-group">
            <label className="form-label">Job Status Update</label>
            <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="IN_PROGRESS">In Progress (Active Field Work)</option>
              <option value="PENDING_APPROVAL">Waiting on Parts / Hardware Procurement</option>
              <option value="RESOLVED">Resolved / Task Completed</option>
            </select>
          </div>

          <div className="form-group mt-3">
            <label className="form-label">Add Field Work Log Note</label>
            <textarea
              rows={4}
              className="form-textarea"
              placeholder="Record diagnostic findings, component model numbers used, or test results..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            ></textarea>
          </div>

          {status === 'RESOLVED' && (
            <div className="form-group mt-4 success-box">
              <label className="form-label font-bold text-success flex items-center gap-2">
                <CheckCircle2 size={16} /> Final Resolution Summary *
              </label>
              <textarea
                rows={4}
                required
                className="form-textarea mt-2"
                placeholder="Explain how the issue was fixed, verification tests performed, and user sign-off status..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
              ></textarea>
            </div>
          )}

          <div className="dialog-footer mt-6">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Send size={16} />
              <span>Save & Publish Progress Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

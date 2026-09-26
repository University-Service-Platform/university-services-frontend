import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, Shield, CheckCircle2, Wrench, Sparkles } from 'lucide-react';
import { colors } from '../../theme/colors';
import { mockTechnicians } from '../../data/mockData';

export default function AssignmentPanel({ requests, onAssignTech }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const req = (requests || []).find(r => r.id === id) || (requests && requests[0]);
  const [selectedTechId, setSelectedTechId] = useState(mockTechnicians[0].id);

  if (!req) return <div className="page-container"><p>Ticket not found for assignment.</p></div>;

  const handleAssign = (e) => {
    e.preventDefault();
    const tech = mockTechnicians.find(t => t.id === selectedTechId);
    if (onAssignTech && tech) {
      onAssignTech(req.id, tech);
    }
    navigate('/work-orders');
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="page-title">Technician Assignment Dispatch</h1>
          <p className="page-subtitle">Dispatch field work order <span className="highlight-code">{req.workOrderId || req.id}</span> to an available technician.</p>
        </div>
      </div>

      <div className="detail-grid-container">
        {/* Technicians List Card */}
        <div className="detail-card-main">
          <h2>Select Field Specialist</h2>
          <p className="text-muted text-sm mb-4">Choose a technician based on skill matching, active work load, and proximity.</p>

          <form onSubmit={handleAssign}>
            <div className="technicians-grid">
              {mockTechnicians.map(tech => {
                const isSelected = selectedTechId === tech.id;
                return (
                  <div
                    key={tech.id}
                    className={`tech-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedTechId(tech.id)}
                  >
                    <div className="tech-avatar">{tech.avatar}</div>
                    <div className="tech-info">
                      <h3>{tech.name}</h3>
                      <p className="tech-role">{tech.role}</p>
                      <span className="tech-spec">{tech.specialization}</span>
                    </div>
                    <div className="tech-stats">
                      <span className="load-badge">{tech.load} Active WOs</span>
                      <span className={`status-dot ${tech.status.toLowerCase().replace(' ', '-')}`}></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dialog-footer mt-6">
              <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <UserCheck size={16} />
                <span>Dispatch Work Order to Technician</span>
              </button>
            </div>
          </form>
        </div>

        {/* Work Order Preview */}
        <div className="detail-card-sidebar">
          <h3>Work Order Summary</h3>
          <div className="detail-field mb-3">
            <label>Title</label>
            <span className="font-semibold">{req.title}</span>
          </div>
          <div className="detail-field mb-3">
            <label>Priority</label>
            <span className="badge-pill" style={{ backgroundColor: colors.priority[req.priority].bg, color: colors.priority[req.priority].text }}>
              {colors.priority[req.priority].label}
            </span>
          </div>
          <div className="detail-field mb-3">
            <label>Location</label>
            <span>{req.location || 'Building 4'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Paperclip, AlertCircle, Sparkles } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function CreateServiceRequest({ onRequestCreated }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hardware Maintenance',
    impact: 'Medium - Single user blocker',
    urgency: 'Medium',
    location: 'Building 2, Office 104',
    description: '',
    requesterEmail: 'jordan.smith@university.edu'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    const newRequest = {
      id: `SR-${Math.floor(1000 + Math.random() * 9000)}`,
      workOrderId: `WO-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.title,
      category: formData.category,
      requester: 'Jordan Smith',
      requesterEmail: formData.requesterEmail,
      department: 'School of Computing',
      location: formData.location,
      priority: formData.urgency === 'High' ? 'HIGH' : formData.urgency === 'Critical' ? 'CRITICAL' : 'MEDIUM',
      status: 'NEW',
      assignedTechId: null,
      assignedTechName: 'Unassigned',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      slaRemaining: '4 hrs 00 mins',
      description: formData.description,
      impact: formData.impact,
      urgency: formData.urgency,
      timeline: [
        { time: new Date().toISOString().replace('T', ' ').substring(0, 16), author: 'Jordan Smith', status: 'Submitted', text: 'Service request submitted.' }
      ]
    };

    if (onRequestCreated) onRequestCreated(newRequest);
    navigate('/requester/requests');
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <button className="btn-secondary mb-3" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="page-title">Create Service Request</h1>
          <p className="page-subtitle">Submit a detailed request to the Service Desk triage team.</p>
        </div>
      </div>

      <div className="form-card-container">
        <form onSubmit={handleSubmit} className="dialog-body">
          <div className="form-group">
            <label className="form-label">Request Title / Short Summary *</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g., Unable to connect to Lab 3 printer over Wi-Fi"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Service Category *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Hardware Maintenance">Hardware Maintenance</option>
                <option value="Access & Security">Access & Security</option>
                <option value="Infrastructure & Cooling">Infrastructure & Cooling</option>
                <option value="Database Admin">Database Admin</option>
                <option value="Software License">Software License</option>
                <option value="Network & VPN">Network & VPN</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Physical Location / Campus Room</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Building 4, Room 201"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Impact Assessment</label>
              <select
                className="form-select"
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              >
                <option value="High - Affects entire department/class">High - Affects entire department/class</option>
                <option value="Medium - Single user blocker">Medium - Single user blocker</option>
                <option value="Low - Minor inconvenience">Low - Minor inconvenience</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Urgency</label>
              <select
                className="form-select"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
              >
                <option value="Critical">P1 - Critical (&lt; 1 hr SLA)</option>
                <option value="High">P2 - High (4 hrs SLA)</option>
                <option value="Medium">P3 - Medium (24 hrs SLA)</option>
                <option value="Low">P4 - Low (72 hrs SLA)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Problem Details & Reproduction Steps *</label>
            <textarea
              rows={5}
              required
              className="form-textarea"
              placeholder="Describe the issue, any error codes displayed, equipment serial number, and steps already tried..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>

          <div className="file-upload-box">
            <Paperclip size={20} className="text-muted" />
            <span>Drag & drop screenshots or logs here, or click to attach files (PNG, PDF, LOG up to 10MB)</span>
          </div>

          <div className="dialog-footer mt-4">
            <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Send size={16} />
              <span>Submit Service Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

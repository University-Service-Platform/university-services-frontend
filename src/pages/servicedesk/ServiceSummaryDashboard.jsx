import React from 'react';
import { BarChart2, ShieldAlert, CheckCircle2, Clock, Users, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { colors } from '../../theme/colors';

export default function ServiceSummaryDashboard({ requests }) {
  const allReqs = requests || [];

  const total = allReqs.length;
  const resolved = allReqs.filter(r => r.status === 'RESOLVED').length;
  const rejected = allReqs.filter(r => r.status === 'REJECTED').length;
  const critical = allReqs.filter(r => r.priority === 'CRITICAL').length;
  const inProgress = allReqs.filter(r => r.status === 'IN_PROGRESS').length;

  const slaComplianceRate = total > 0 ? Math.round(((resolved + inProgress) / total) * 100) : 98;

  // Donut chart math (Radius = 65, Circumference = 408.4)
  const categoryData = [
    { name: 'Hardware Maintenance', percent: 42, count: 54, color: '#1E40AF', dash: '171.5', offset: '0' },
    { name: 'Access & Security', percent: 28, count: 36, color: '#3B82F6', dash: '114.35', offset: '-171.5' },
    { name: 'Infrastructure & Cooling', percent: 18, count: 23, color: '#0F766E', dash: '73.5', offset: '-285.85' },
    { name: 'Database & VPN', percent: 12, count: 15, color: '#F59E0B', dash: '49.0', offset: '-359.35' }
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header-banner">
        <div>
          <div className="role-icon-pill" style={{ backgroundColor: `${colors.roles.SERVICE_DESK.color}20`, color: colors.roles.SERVICE_DESK.color }}>
            <BarChart2 size={16} />
            <span>Service Desk Executive Summary</span>
          </div>
          <h1 className="page-title">Service Analytics & SLA Performance</h1>
          <p className="page-subtitle">Real-time telemetry, queue throughput, and technician resolution metrics.</p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">SLA Compliance</span>
            <div className="metric-icon positive"><ShieldAlert size={18} /></div>
          </div>
          <div className="metric-value positive-text">{slaComplianceRate}%</div>
          <div className="metric-footer positive">Target &gt; 95%</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Avg Resolution Time</span>
            <div className="metric-icon primary"><Clock size={18} /></div>
          </div>
          <div className="metric-value">2.4 hrs</div>
          <div className="metric-footer positive">18% faster than last week</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">P1 SLA Incidents</span>
            <div className="metric-icon danger"><AlertTriangle size={18} /></div>
          </div>
          <div className="metric-value danger-text">{critical}</div>
          <div className="metric-footer danger">All assigned to lead tech</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Resolved Tickets</span>
            <div className="metric-icon positive"><CheckCircle2 size={18} /></div>
          </div>
          <div className="metric-value">{resolved}</div>
          <div className="metric-footer positive">Successfully closed</div>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="analytics-sections-grid mt-6">
        {/* Donut Circle Chart Card */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>Volume Breakdown by Category</h3>
          </div>

          <div className="donut-chart-container">
            {/* Donut Circle SVG */}
            <div className="donut-svg-wrapper">
              <svg viewBox="0 0 160 160" className="donut-svg">
                {categoryData.map((item, index) => (
                  <circle
                    key={index}
                    cx="80"
                    cy="80"
                    r="65"
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth="18"
                    strokeDasharray={`${item.dash} 408.4`}
                    strokeDashoffset={item.offset}
                    className="donut-segment"
                  />
                ))}
              </svg>
              <div className="donut-center-info">
                <span className="donut-total-num">128</span>
                <span className="donut-total-label">Total Volume</span>
              </div>
            </div>

            {/* Donut Legend Items */}
            <div className="donut-legend-grid">
              {categoryData.map((item, index) => (
                <div key={index} className="donut-legend-item">
                  <div className="legend-marker" style={{ backgroundColor: item.color }}></div>
                  <div className="legend-details">
                    <span className="legend-name">{item.name}</span>
                    <span className="legend-count">{item.count} tickets</span>
                  </div>
                  <span className="legend-percent" style={{ color: item.color }}>{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLA Target Status Card */}
        <div className="analytics-card">
          <div className="card-header">
            <h3>SLA Target Status</h3>
          </div>
          <div className="sla-status-list">
            <div className="sla-row success">
              <CheckCircle2 size={18} />
              <div className="sla-info">
                <span>P1 Critical Response (&lt; 1 hr)</span>
                <strong>100% Met</strong>
              </div>
            </div>
            <div className="sla-row success">
              <CheckCircle2 size={18} />
              <div className="sla-info">
                <span>P2 High Resolution (&lt; 4 hrs)</span>
                <strong>96.4% Met</strong>
              </div>
            </div>
            <div className="sla-row warning">
              <Clock size={18} />
              <div className="sla-info">
                <span>P3 Medium Resolution (&lt; 24 hrs)</span>
                <strong>92.1% Met</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

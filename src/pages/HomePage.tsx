import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  GraduationCap,
  Building2,
  UserCheck,
  User,
  ArrowRight,
  Shield,
  Layers,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/auth';
import { Card, CardHeader, CardBody, Badge, Button } from '@/components/ui';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated, isAuthorized } = useAuth();
  const isAdmin = isAuthorized(['ADMIN']);

  return (
    <div className="home-container">
      {/* Hero Welcome Banner */}
      <div className="home-hero-card">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <Sparkles size={14} /> Group 5 Core Identity Foundation
          </div>
          <h1 className="home-hero-title">
            {isAuthenticated && user
              ? `Welcome back, ${user.firstName} ${user.lastName}`
              : 'University Identity & Directory Services'}
          </h1>
          <p className="home-hero-subtitle">
            Centralized authentication, role-based authorization, directory registry, and cross-team
            identity validation core powering the University Services Management Platform.
          </p>
          <div className="home-hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <Button variant="outline" style={{ backgroundColor: '#ffffff', color: 'var(--color-primary)', borderColor: '#ffffff' }}>
                    View Profile
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/users">
                    <Button variant="primary" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.4)' }}>
                      Manage Users
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <Link to="/login">
                <Button variant="primary" style={{ backgroundColor: '#ffffff', color: 'var(--color-primary)', borderColor: '#ffffff' }}>
                  Sign In to Identity Core
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Identity Core Statistics */}
      <div className="home-stats-grid">
        <div className="home-stat-card">
          <div className="home-stat-icon-wrapper">
            <Users size={24} />
          </div>
          <div className="home-stat-info">
            <span className="home-stat-value">Identity Directory</span>
            <span className="home-stat-label">Centralized User Accounts</span>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon-wrapper" style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="home-stat-info">
            <span className="home-stat-value">RBAC Access</span>
            <span className="home-stat-label">Role-Based Authorizations</span>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon-wrapper" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
            <GraduationCap size={24} />
          </div>
          <div className="home-stat-info">
            <span className="home-stat-value">Academic Faculties</span>
            <span className="home-stat-label">Faculty & Department Registry</span>
          </div>
        </div>

        <div className="home-stat-card">
          <div className="home-stat-icon-wrapper" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
            <Building2 size={24} />
          </div>
          <div className="home-stat-info">
            <span className="home-stat-value">Service Units</span>
            <span className="home-stat-label">Administrative Units</span>
          </div>
        </div>
      </div>

      {/* Group 5 Core Modules Directory */}
      <div className="home-modules-section">
        <div className="home-section-header">
          <h2 className="home-section-title">Directory & Identity Modules</h2>
          <Badge variant="info">Group 5 Services</Badge>
        </div>

        <div className="home-modules-grid">
          <Link to="/users" className="home-module-card">
            <div className="home-module-top">
              <div className="home-module-icon">
                <Users size={22} />
              </div>
              <div className="home-module-content">
                <h3 className="home-module-title">User Management</h3>
                <p className="home-module-desc">
                  Explore and manage university identities, directory profiles, contact details, and assigned roles.
                </p>
              </div>
            </div>
            <div className="home-module-footer">
              <span>Open User Directory</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/roles" className="home-module-card">
            <div className="home-module-top">
              <div className="home-module-icon">
                <Shield size={22} />
              </div>
              <div className="home-module-content">
                <h3 className="home-module-title">Roles & Permissions</h3>
                <p className="home-module-desc">
                  Define system access levels, assign security roles, and enforce least-privilege security boundaries.
                </p>
              </div>
            </div>
            <div className="home-module-footer">
              <span>Manage Role Matrix</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/faculties" className="home-module-card">
            <div className="home-module-top">
              <div className="home-module-icon">
                <GraduationCap size={22} />
              </div>
              <div className="home-module-content">
                <h3 className="home-module-title">Faculties & Departments</h3>
                <p className="home-module-desc">
                  Directory of academic faculties, affiliated departments, and academic unit identifiers.
                </p>
              </div>
            </div>
            <div className="home-module-footer">
              <span>Browse Faculties</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/service-units" className="home-module-card">
            <div className="home-module-top">
              <div className="home-module-icon">
                <Building2 size={22} />
              </div>
              <div className="home-module-content">
                <h3 className="home-module-title">Service Units</h3>
                <p className="home-module-desc">
                  Administrative divisions, service support facilities, and university operations registry.
                </p>
              </div>
            </div>
            <div className="home-module-footer">
              <span>Browse Units</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/users/account-status" className="home-module-card">
            <div className="home-module-top">
              <div className="home-module-icon">
                <UserCheck size={22} />
              </div>
              <div className="home-module-content">
                <h3 className="home-module-title">Account Status Control</h3>
                <p className="home-module-desc">
                  Review activation status, activate or deactivate accounts, and enforce authentication governance.
                </p>
              </div>
            </div>
            <div className="home-module-footer">
              <span>Account Validation</span>
              <ArrowRight size={16} />
            </div>
          </Link>

          <Link to="/profile" className="home-module-card">
            <div className="home-module-top">
              <div className="home-module-icon">
                <User size={22} />
              </div>
              <div className="home-module-content">
                <h3 className="home-module-title">My Profile & Security</h3>
                <p className="home-module-desc">
                  Manage personal contact details, review granted system permissions, and verify identity status.
                </p>
              </div>
            </div>
            <div className="home-module-footer">
              <span>View Profile</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>
      </div>

      {/* Cross-Team Integration Overview */}
      <Card className="home-integration-card">
        <CardHeader
          title="Cross-Team Service Boundaries & Validation"
          subtitle="Group 5 serves as the single source of truth for Identity, Status, and Role Validation across Group 6, Group 7, and Group 8."
          action={<Badge variant="success">Active Foundation</Badge>}
        />
        <CardBody>
          <div className="home-integration-grid">
            <div className="home-integration-item">
              <h4>
                <CheckCircle2 size={16} color="var(--color-success)" />
                Group 6 (Facilities)
              </h4>
              <p>Validates booking requester identity, department affiliation, and facility reservation privileges.</p>
            </div>
            <div className="home-integration-item">
              <h4>
                <CheckCircle2 size={16} color="var(--color-success)" />
                Group 7 (Requests)
              </h4>
              <p>Authenticates service ticket creators and checks approval authority across administrative units.</p>
            </div>
            <div className="home-integration-item">
              <h4>
                <CheckCircle2 size={16} color="var(--color-success)" />
                Group 8 (Communication)
              </h4>
              <p>Powers audience targeting by faculty/unit and verifies registration eligibility before confirmation.</p>
            </div>
            <div className="home-integration-item">
              <h4>
                <Layers size={16} color="var(--color-primary)" />
                Token & Security Architecture
              </h4>
              <p>Enforces zero direct DB access across groups with centralized REST validation endpoints.</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

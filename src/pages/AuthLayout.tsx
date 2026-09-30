import React from 'react';
import { GraduationCap } from 'lucide-react';
import './LoginPage.css';

export interface AuthLayoutProps {
  heading: string;
  subheading: React.ReactNode;
  children: React.ReactNode;
}

/** The signed-out screens (sign in, forgot password, reset password) share this two-panel layout. */
export const AuthLayout: React.FC<AuthLayoutProps> = ({ heading, subheading, children }) => (
  <div className="login-page-container">
    {/* Left Column: Visual & University Branding */}
    <section className="auth-brand-panel" aria-label="University Branding">
      <div className="brand-panel-content">
        <div className="brand-emblem-badge" aria-hidden="true">
          <GraduationCap size={36} color="#FFFFFF" />
        </div>
        <h1 className="brand-title">University of Kelaniya</h1>
        <p className="brand-tagline">One Platform. Many Possibilities.</p>
      </div>

      <footer className="brand-panel-footer">
        © 2026 University of Kelaniya • Learn • Belong • Thrive
      </footer>
    </section>

    {/* Right Column: Authentication Form Panel */}
    <section className="auth-form-panel" aria-label="Authentication Form">
      <div className="auth-form-card">
        <header className="auth-header">
          <div className="auth-badge">
            <span className="auth-badge-dot" aria-hidden="true" />
            <span>University Services Platform</span>
          </div>
          <h2 className="auth-heading">{heading}</h2>
          <p className="auth-subheading">{subheading}</p>
        </header>
        {children}
      </div>
    </section>
  </div>
);

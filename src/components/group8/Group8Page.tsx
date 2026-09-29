import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, LogIn } from 'lucide-react';
import { useAuth } from '@/auth';
import { Button, Card, Modal } from '@/components/ui';
import { G8_SESSION_EXPIRED_EVENT, setG8DemoIdentity } from '@/services/group8/g8Api';
import './group8.css';

/**
 * Wrapper for every Group 8 screen: keeps a consistent page width and lets the
 * demo fallback apply the signed-in user's roles to synthetic data.
 */
export const Group8Page: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setG8DemoIdentity(user);
  }, [user]);

  // Any Group 8 call answered with 401 means the session is no longer valid.
  useEffect(() => {
    const onExpired = () => setSessionExpired(true);
    window.addEventListener(G8_SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(G8_SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const signInAgain = () => {
    setSessionExpired(false);
    logout();
    navigate('/auth', { replace: true });
  };

  return (
    <div className="g8-page">
      {children}
      <Modal
        isOpen={sessionExpired}
        onClose={() => setSessionExpired(false)}
        title="Your session has expired"
        footer={
          <div className="g8-form-footer">
            <Button variant="ghost" onClick={() => setSessionExpired(false)}>
              Stay on this page
            </Button>
            <Button icon={<LogIn size={16} />} onClick={signInAgain}>
              Sign in again
            </Button>
          </div>
        }
      >
        <p className="g8-modal-text">
          For your security you were signed out. Nothing you submitted after this point was saved. Sign in again to
          continue - unsaved form input on this page will be lost.
        </p>
      </Modal>
    </div>
  );
};

export interface G8PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const G8PageHeader: React.FC<G8PageHeaderProps> = ({ title, subtitle, actions, icon }) => (
  <Card>
    <div className="g8-header-card">
      <div className="g8-header-main">
        {icon && (
          <div className="g8-header-icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="g8-header-text">
          <h2 className="g8-title">{title}</h2>
          {subtitle && <p className="g8-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="g8-header-actions">{actions}</div>}
    </div>
  </Card>
);

/** Shown whenever data came from the synthetic fallback, so users are never misled (NFR8-04). */
export const DemoDataNotice: React.FC<{ show: boolean }> = ({ show }) =>
  show ? (
    <div className="g8-demo-notice" role="note">
      <Info size={16} aria-hidden="true" />
      <span>
        Showing synthetic demo data - Group 8 services are not reachable through the API Gateway yet. Changes are
        kept only for this browser session.
      </span>
    </div>
  ) : null;

export type G8AlertTone = 'success' | 'danger' | 'warning' | 'info';

export const G8Alert: React.FC<{ tone: G8AlertTone; children: React.ReactNode; onDismiss?: () => void }> = ({
  tone,
  children,
  onDismiss,
}) => (
  <div className={`g8-alert g8-alert-${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
    <span className="g8-alert-text">{children}</span>
    {onDismiss && (
      <button type="button" className="g8-alert-dismiss" onClick={onDismiss} aria-label="Dismiss message">
        ×
      </button>
    )}
  </div>
);

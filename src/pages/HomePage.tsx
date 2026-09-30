import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/auth';
import { Button } from '@/components/ui';
import { renderNavIcon } from '@/components/layout/navIcons';
import { getAuthorizedNavItems } from '@/config/navigationConfig';
import { formatRole } from '@/utils';
import './HomePage.css';

/** What each page is for, in the words of the person using it. */
const MODULE_DESCRIPTIONS: Record<string, string> = {
  '/profile': 'See your details, department and the roles you hold.',
  '/users': 'Add, edit and remove university user accounts.',
  '/users/account-status': 'Activate or deactivate user accounts.',
  '/roles': 'Review roles and the permissions each one grants.',
  '/faculties': 'Manage the university’s faculties.',
  '/departments': 'Manage departments and the faculty each belongs to.',
  '/service-units': 'Manage administrative and support service units.',
  '/events': 'Browse upcoming university events and register.',
  '/registrations': 'Track the events you have registered for.',
  '/announcements': 'Read the latest university announcements.',
  '/notifications': 'See updates about your events and requests.',
  '/feedback': 'Share feedback on events and services you used.',
  '/engagement-dashboard': 'Event attendance and feedback at a glance.',
};

export const HomePage: React.FC = () => {
  const { user, roles, isAuthenticated, isAccountInactive, isAuthorized } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <div className="home-container">
        <div className="home-hero-card">
          <div className="home-hero-content">
            <h1 className="home-hero-title">University Services Platform</h1>
            <p className="home-hero-subtitle">
              Events, announcements, facilities and service requests for the whole university, in one place.
            </p>
            <div className="home-hero-actions">
              <Link to="/auth">
                <Button variant="primary" style={{ backgroundColor: '#ffffff', color: 'var(--color-primary)', borderColor: '#ffffff' }}>
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Same source as the sidebar, so the dashboard never offers a page the user can't open
  const modules = getAuthorizedNavItems(isAuthorized, isAuthenticated, isAccountInactive)
    .filter((item) => item.path !== '/');
  const roleLabel = roles.length > 0 ? roles.map(formatRole).join(', ') : undefined;

  return (
    <div className="home-container">
      <div className="home-hero-card">
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            Welcome back{user.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="home-hero-subtitle">
            {roleLabel ? `Signed in as ${roleLabel}. ` : ''}Here is everything you have access to.
          </p>
        </div>
      </div>

      <div className="home-modules-section">
        <div className="home-section-header">
          <h2 className="home-section-title">Quick access</h2>
        </div>

        <div className="home-modules-grid">
          {modules.map((item) => (
            <Link key={item.path} to={item.path} className="home-module-card">
              <div className="home-module-top">
                <div className="home-module-icon">{renderNavIcon(item.icon, 22)}</div>
                <div className="home-module-content">
                  <h3 className="home-module-title">{item.label}</h3>
                  {MODULE_DESCRIPTIONS[item.path] && (
                    <p className="home-module-desc">{MODULE_DESCRIPTIONS[item.path]}</p>
                  )}
                </div>
              </div>
              <div className="home-module-footer">
                <span>Open</span>
                <ArrowRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

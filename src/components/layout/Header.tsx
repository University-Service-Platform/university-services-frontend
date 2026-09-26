import React from 'react';
import { Menu, User, LogOut, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth';
import { formatRole } from '@/utils';
import { Button } from '@/components/ui';
import { NotificationBell } from '@/components/group8/NotificationBell';
import './layout.css';

export interface HeaderProps {
  title?: string;
  onToggleSidebar?: () => void;
  userName?: string;
  userRole?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'University Services',
  onToggleSidebar,
  userName: propUserName,
  userRole: propUserRole,
}) => {
  const { isAuthenticated, user, roles, logout } = useAuth();

  const displayName = propUserName || (user ? `${user.firstName} ${user.lastName}` : undefined);
  const displayRole = propUserRole || (roles.length > 0 ? formatRole(roles[0]) : undefined);

  return (
    <header className="app-header">
      <div className="header-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="header-toggle-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>
        )}
        <h1 className="header-title">{title}</h1>
      </div>

      <div className="header-right">
        {isAuthenticated && <NotificationBell />}
        {isAuthenticated ? (
          <div className="user-profile-summary">
            <div className="avatar-placeholder" aria-hidden="true">
              <User size={18} />
            </div>
            <div className="user-info">
              {displayName && <span className="user-name">{displayName}</span>}
              {displayRole && <span className="user-role-label">{displayRole}</span>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              aria-label="Log out"
              icon={<LogOut size={16} />}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button variant="outline" size="sm" icon={<LogIn size={16} />}>
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

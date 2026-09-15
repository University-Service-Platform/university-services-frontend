import React from 'react';
import { Menu, User } from 'lucide-react';
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
  userName,
  userRole,
}) => {
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
        <div className="user-profile-summary">
          <div className="avatar-placeholder" aria-hidden="true">
            <User size={18} />
          </div>
          {(userName || userRole) && (
            <div className="user-info">
              {userName && <span className="user-name">{userName}</span>}
              {userRole && <span className="user-role-label">{userRole}</span>}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

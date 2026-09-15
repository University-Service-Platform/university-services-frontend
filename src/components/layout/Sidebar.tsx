import React from 'react';
import { NavLink } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import type { NavItem } from '@/types';
import { cn } from '@/utils';
import './layout.css';

export interface SidebarProps {
  navItems?: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
  brandTitle?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  navItems = [],
  isOpen = false,
  onClose,
  brandTitle = 'University Platform',
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />}

      <aside className={cn('app-sidebar', isOpen && 'open')}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-brand" onClick={onClose}>
            <div className="sidebar-brand-icon">
              <GraduationCap size={20} />
            </div>
            <span>{brandTitle}</span>
          </NavLink>
          {onClose && (
            <button
              type="button"
              className="header-toggle-btn"
              onClick={onClose}
              aria-label="Close sidebar"
              style={{ color: '#FFFFFF' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="Main Navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => cn('sidebar-nav-item', isActive && 'active')}
            >
              <span>{item.label}</span>
              {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

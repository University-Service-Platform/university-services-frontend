import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  GraduationCap,
  X,
  LayoutDashboard,
  User,
  Users,
  UserCheck,
  Shield,
  Building2,
  Layers,
  CalendarDays,
  Ticket,
  Megaphone,
  Bell,
  MessageSquareText,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/auth';
import { getAuthorizedNavItems } from '@/config/navigationConfig';
import type { NavItem } from '@/types';
import { cn } from '@/utils';
import './layout.css';

export interface SidebarProps {
  navItems?: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
  brandTitle?: string;
}

const renderNavIcon = (iconName?: string) => {
  switch (iconName) {
    case 'LayoutDashboard':
      return <LayoutDashboard size={18} aria-hidden="true" />;
    case 'User':
      return <User size={18} aria-hidden="true" />;
    case 'Users':
      return <Users size={18} aria-hidden="true" />;
    case 'UserCheck':
      return <UserCheck size={18} aria-hidden="true" />;
    case 'Shield':
      return <Shield size={18} aria-hidden="true" />;
    case 'GraduationCap':
      return <GraduationCap size={18} aria-hidden="true" />;
    case 'Building2':
      return <Building2 size={18} aria-hidden="true" />;
    case 'Layers':
      return <Layers size={18} aria-hidden="true" />;
    case 'CalendarDays':
      return <CalendarDays size={18} aria-hidden="true" />;
    case 'Ticket':
      return <Ticket size={18} aria-hidden="true" />;
    case 'Megaphone':
      return <Megaphone size={18} aria-hidden="true" />;
    case 'Bell':
      return <Bell size={18} aria-hidden="true" />;
    case 'MessageSquareText':
      return <MessageSquareText size={18} aria-hidden="true" />;
    case 'BarChart3':
      return <BarChart3 size={18} aria-hidden="true" />;
    default:
      return <GraduationCap size={18} aria-hidden="true" />;
  }
};


export const Sidebar: React.FC<SidebarProps> = ({
  navItems: propNavItems,
  isOpen = false,
  onClose,
  brandTitle = 'University Platform',
}) => {
  const { isAuthorized, isAuthenticated, isAccountInactive } = useAuth();

  // Dynamically compute visible nav items based on authorization and account status
  const navItems = propNavItems ?? getAuthorizedNavItems(isAuthorized, isAuthenticated, isAccountInactive);

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
              {renderNavIcon(item.icon)}
              <span>{item.label}</span>
              {item.badge && <span className="sidebar-nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import type { NavItem } from '@/types';
import './layout.css';

export interface AppShellProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  pageTitle?: string;
  userName?: string;
  userRole?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  navItems = [],
  pageTitle,
  userName,
  userRole,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        navItems={navItems}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="app-main">
        <Header
          title={pageTitle}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          userName={userName}
          userRole={userRole}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
};

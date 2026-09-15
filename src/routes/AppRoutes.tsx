import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { HomePage } from '@/pages';
import type { NavItem } from '@/types';

// Foundation navigation configuration (extensible for future Jira routes)
const defaultNavItems: NavItem[] = [
  { label: 'Home', path: '/' },
];

export const AppRoutes: React.FC = () => {
  return (
    <AppShell navItems={defaultNavItems} pageTitle="University Services Platform">
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Future Jira feature routes will be registered here */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </AppShell>
  );
};

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { HomePage, LoginPage } from '@/pages';
import type { NavItem } from '@/types';

// Foundation navigation items
const defaultNavItems: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Login', path: '/auth' },
];

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Standalone Authentication Route */}
      <Route path="/auth" element={<LoginPage />} />

      {/* Main Application Shell Routes */}
      <Route
        path="/*"
        element={
          <AppShell navItems={defaultNavItems} pageTitle="University Services Platform">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
};

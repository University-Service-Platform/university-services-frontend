import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { HomePage, LoginPage } from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';
import { APP_ROUTES_CONFIG } from '@/config/navigationConfig';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Standalone Authentication Route */}
      <Route path="/auth" element={<LoginPage />} />

      {/* Main Application Shell with Role-Aware Route Protection */}
      <Route
        path="/*"
        element={
          <AppShell pageTitle="University Services Platform">
            <Routes>
              {APP_ROUTES_CONFIG.map((routeConfig) => (
                <Route
                  key={routeConfig.id}
                  path={routeConfig.path === '/' ? '' : routeConfig.path.replace('/', '')}
                  element={
                    <ProtectedRoute
                      isPublic={routeConfig.isPublic}
                      requiredRoles={routeConfig.requiredRoles}
                      requiredPermissions={routeConfig.requiredPermissions}
                    >
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
              ))}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
};

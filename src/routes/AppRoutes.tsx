import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import { HomePage, LoginPage, NotFoundPage, ForgotPasswordPage, ResetPasswordPage, ProfilePage, RolesPage, FacultiesPage, ServiceUnitsPage, DepartmentsPage, UsersPage, AccountStatusPage } from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';
import { APP_ROUTES_CONFIG } from '@/config/navigationConfig';
import { renderGroup8Page } from './group8RouteElements';

const renderRoutePage = (path: string) => {
  switch (path) {
    case '/profile':
      return <ProfilePage />;
    case '/users':
      return <UsersPage />;
    case '/users/account-status':
      return <AccountStatusPage />;
    case '/roles':
      return <RolesPage />;
    case '/faculties':
      return <FacultiesPage />;
    case '/departments':
      return <DepartmentsPage />;
    case '/service-units':
      return <ServiceUnitsPage />;
    default:
      return renderGroup8Page(path) ?? (path === '/' ? <HomePage /> : <NotFoundPage />);
  }
};


export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Standalone Authentication Route */}
      <Route path="/auth" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                      {renderRoutePage(routeConfig.path)}
                    </ProtectedRoute>
                  }
                />
              ))}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
};

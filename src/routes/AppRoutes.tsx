import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import {
  HomePage,
  LoginPage,
  ProfilePage,
  RolesPage,
  FacultiesPage,
  ServiceUnitsPage,
  UsersPage,
  AccountStatusPage,
  MyServiceRequestsPage,
  CreateServiceRequestPage,
  RequestDetailsPage,
  ServiceRequestTimelinePage,
} from '@/pages';
import { ProtectedRoute } from './ProtectedRoute';
import { APP_ROUTES_CONFIG } from '@/config/navigationConfig';

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
    case '/service-units':
      return <ServiceUnitsPage />;
    case '/requests/my':
    case '/my-requests':
      return <MyServiceRequestsPage />;
    case '/requests/new':
      return <CreateServiceRequestPage />;
    default:
      return <HomePage />;
  }
};


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
                      {renderRoutePage(routeConfig.path)}
                    </ProtectedRoute>
                  }
                />
              ))}
              <Route
                path="requests/new"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'STAFF', 'ADMIN', 'DEAN', 'HOD']}>
                    <CreateServiceRequestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="requests/my"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'STAFF', 'ADMIN', 'DEAN', 'HOD']}>
                    <MyServiceRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-requests"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'STAFF', 'ADMIN', 'DEAN', 'HOD']}>
                    <MyServiceRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="requests/:id"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'STAFF', 'ADMIN', 'DEAN', 'HOD']}>
                    <RequestDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="requests/:id/timeline"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'STAFF']}>
                    <ServiceRequestTimelinePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </AppShell>
        }
      />
    </Routes>
  );
};

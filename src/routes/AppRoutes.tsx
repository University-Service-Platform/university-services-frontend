import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout';
import {
  HomePage,
  LoginPage,
  ProfilePage,
  RolesPage,
  FacultiesPage,
  DepartmentsPage,
  ServiceUnitsPage,
  UsersPage,
  AccountStatusPage,
  MyServiceRequestsPage,
  CreateServiceRequestPage,
  RequestDetailsPage,
  ServiceRequestTimelinePage,
  TriagePage,
  ServiceDashboardPage,
  WorkOrdersPage,
  AssignmentsPage,
  TechnicianPage,
} from '@/pages';
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
    case '/requests/my':
    case '/my-requests':
      return <MyServiceRequestsPage />;
    case '/requests/new':
      return <CreateServiceRequestPage />;
    case '/triage':
      return <TriagePage />;
    case '/service-dashboard':
      return <ServiceDashboardPage />;
    case '/work-orders':
      return <WorkOrdersPage />;
    case '/assignments':
      return <AssignmentsPage />;
    case '/technician':
      return <TechnicianPage />;
    default:
      return renderGroup8Page(path) ?? <HomePage />;
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
                  <ProtectedRoute requiredRoles={['STUDENT', 'ACADEMIC_STAFF', 'ADMIN_STAFF', 'STAFF', 'ADMIN', 'DEAN', 'HOD']}>
                    <CreateServiceRequestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="requests/my"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'ACADEMIC_STAFF', 'ADMIN_STAFF', 'STAFF', 'ADMIN', 'DEAN', 'HOD']}>
                    <MyServiceRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-requests"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'ACADEMIC_STAFF', 'ADMIN_STAFF', 'STAFF', 'ADMIN', 'DEAN', 'HOD']}>
                    <MyServiceRequestsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="requests/:id"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'ACADEMIC_STAFF', 'ADMIN_STAFF', 'STAFF', 'ADMIN', 'DEAN', 'HOD']}>
                    <RequestDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="requests/:id/timeline"
                element={
                  <ProtectedRoute requiredRoles={['STUDENT', 'ACADEMIC_STAFF', 'ADMIN_STAFF', 'STAFF', 'ADMIN']}>
                    <ServiceRequestTimelinePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="triage"
                element={
                  <ProtectedRoute requiredRoles={['SERVICE_DESK_OFFICER']}>
                    <TriagePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="service-dashboard"
                element={
                  <ProtectedRoute requiredRoles={['SERVICE_DESK_OFFICER', 'ADMIN_STAFF']}>
                    <ServiceDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="work-orders"
                element={
                  <ProtectedRoute requiredRoles={['SERVICE_DESK_OFFICER', 'TECHNICIAN', 'SERVICE']}>
                    <WorkOrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="assignments"
                element={
                  <ProtectedRoute requiredRoles={['SERVICE_DESK_OFFICER', 'TECHNICIAN', 'SERVICE']}>
                    <AssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="technician"
                element={
                  <ProtectedRoute requiredRoles={['TECHNICIAN']}>
                    <TechnicianPage />
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

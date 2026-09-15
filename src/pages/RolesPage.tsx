import React, { useState, useEffect, useCallback } from 'react';
import { Shield, UserPlus, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { getRoles, assignUserRole, type SystemRoleDefinition, type RoleAssignmentPayload } from '@/services/roleService';
import type { UserRole } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import { formatRole } from '@/utils';
import './RolesPage.css';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<SystemRoleDefinition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal & Assignment State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [responsibility, setResponsibility] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignSuccess, setAssignSuccess] = useState<boolean>(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ userId?: string; role?: string }>({});

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    getRoles().then((result) => {
      if (result.success && result.data && result.data.length > 0) {
        setRoles(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to role management service.');
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    getRoles().then((result) => {
      if (!isMounted) return;
      if (result.success && result.data && result.data.length > 0) {
        setRoles(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to role management service.');
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const openAssignmentModal = () => {
    setUserId('');
    setSelectedRole(roles.length > 0 ? roles[0].code : '');
    setResponsibility('');
    setFieldErrors({});
    setAssignError(null);
    setAssignSuccess(false);
    setIsModalOpen(true);
  };

  const validateAssignmentForm = (): boolean => {
    const errors: { userId?: string; role?: string } = {};

    if (!userId.trim()) {
      errors.userId = 'Please enter a valid User ID or Email.';
    }

    if (!selectedRole) {
      errors.role = 'Please select a system role.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);
    setAssignSuccess(false);

    if (roles.length === 0) {
      setAssignError('Role assignment is currently unavailable because no role definitions are loaded from the backend API contract.');
      return;
    }

    if (!validateAssignmentForm()) {
      return;
    }

    setIsAssigning(true);

    const payload: RoleAssignmentPayload = {
      userId: userId.trim(),
      role: selectedRole as UserRole,
      departmentId: responsibility.trim() || undefined,
    };

    const result = await assignUserRole(payload);

    if (result.success) {
      setAssignSuccess(true);
      setIsModalOpen(false);
    } else {
      setAssignError(result.message || 'Failed to assign role. Please check connection.');
    }

    setIsAssigning(false);
  };

  // Dynamic role select options derived from backend role definitions
  const roleSelectOptions = roles.map((r) => ({
    label: `${r.name} (${r.code})`,
    value: r.code,
  }));

  return (
    <div className="roles-container">
      {/* Alert Messages */}
      {assignSuccess && (
        <div className="roles-alert roles-alert-success" role="status">
          <CheckCircle size={18} />
          <span>Role assigned successfully.</span>
        </div>
      )}

      {assignError && !isModalOpen && (
        <div className="roles-alert roles-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{assignError}</span>
        </div>
      )}

      {/* Page Header Card */}
      <Card>
        <div className="roles-header-card">
          <div className="roles-header-text">
            <h2 className="roles-title">Role Management</h2>
            <p className="roles-subtitle">
              Manage university system roles, authorization permissions, and user role assignments.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<UserPlus size={16} />}
            onClick={openAssignmentModal}
          >
            Assign Role
          </Button>
        </div>
      </Card>

      {/* Content Area: Loading / Empty / Loaded States */}
      {isLoading ? (
        <LoadingState
          title="Loading Roles & Permissions..."
          description="Retrieving system role definitions."
        />
      ) : roles.length > 0 ? (
        <div className="roles-grid">
          {roles.map((role) => (
            <Card key={role.id} className="role-card">
              <CardBody>
                <div className="role-card-header">
                  <h3 className="role-name">{role.name}</h3>
                  <Badge variant="info">{formatRole(role.code)}</Badge>
                </div>
                {role.description && <p className="role-description">{role.description}</p>}
                {role.permissions && role.permissions.length > 0 && (
                  <div className="role-permissions-group">
                    {role.permissions.map((perm) => (
                      <span key={perm} className="permission-chip">
                        {perm}
                      </span>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Role Management API Integration Pending"
          description={
            fetchError ||
            'The official backend role management API contract is not yet available in the repository. The role assignment interface and service layer boundary are prepared to connect to backend services.'
          }
          icon={<Shield className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={handleRetry}>
                Retry Connection
              </Button>
              <Button variant="primary" icon={<UserPlus size={16} />} onClick={openAssignmentModal}>
                Open Assignment Modal
              </Button>
            </div>
          }
        />
      )}

      {/* Role Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign System Role"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignRole}
              isLoading={isAssigning}
              disabled={roles.length === 0}
              icon={<Shield size={16} />}
            >
              Assign Role
            </Button>
          </>
        }
      >
        <form onSubmit={handleAssignRole} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {roles.length === 0 && (
            <div className="roles-alert roles-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>Role definitions are unavailable. Official backend role API contract integration is pending.</span>
            </div>
          )}

          {assignError && (
            <div className="roles-alert roles-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{assignError}</span>
            </div>
          )}

          <Input
            id="target-user-id"
            label="User Identifier / Email"
            placeholder="Enter user ID or email address..."
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              if (fieldErrors.userId) {
                setFieldErrors((prev) => ({ ...prev, userId: undefined }));
              }
            }}
            error={fieldErrors.userId}
            disabled={isAssigning}
            required
          />

          <Select
            id="target-role-select"
            label="System Role"
            options={roleSelectOptions}
            placeholder={roles.length > 0 ? 'Select system role...' : 'No role definitions available from backend service'}
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              if (fieldErrors.role) {
                setFieldErrors((prev) => ({ ...prev, role: undefined }));
              }
            }}
            error={fieldErrors.role}
            disabled={isAssigning || roles.length === 0}
            required
          />

          <Input
            id="department-responsibility"
            label="Department / Service Unit Responsibility (Optional)"
            placeholder="e.g. DEPT-CS-01 or UNIT-IT-02"
            value={responsibility}
            onChange={(e) => setResponsibility(e.target.value)}
            helperText="Optional organizational scope for department or service unit authorization."
            disabled={isAssigning}
          />
        </form>
      </Modal>
    </div>
  );
};

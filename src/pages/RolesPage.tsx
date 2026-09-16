import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shield, UserPlus, AlertCircle, CheckCircle, RefreshCw, ChevronRight, ArrowLeft } from 'lucide-react';
import { getRoles, assignUserRole, type SystemRoleDefinition, type RoleAssignmentPayload } from '@/services/roleService';
import { getUsers } from '@/services/userService';
import type { UserProfile, UserRole } from '@/types';
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

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Role Management & Role Assignment API contract is not yet documented in the repository.
 * Role definitions, permissions, user-role assignments, and responsibility fields serve strictly as an integration boundary.
 */
export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<SystemRoleDefinition[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal & Assignment Step State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [step, setStep] = useState<'FORM' | 'CONFIRM'>('FORM');
  const [userId, setUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [responsibility, setResponsibility] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [assignSuccessMessage, setAssignSuccessMessage] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ userId?: string; role?: string }>({});

  const fetchData = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);

    Promise.all([getRoles(), getUsers()])
      .then(([rolesRes, usersRes]) => {
        if (rolesRes.success && rolesRes.data && rolesRes.data.length > 0) {
          setRoles(rolesRes.data);
        } else {
          setFetchError(rolesRes.message || 'Unable to connect to role management service.');
        }

        if (usersRes.success && usersRes.data) {
          setAvailableUsers(usersRes.data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setFetchError('Unable to connect to backend role management services.');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getRoles(), getUsers()]).then(([rolesRes, usersRes]) => {
      if (!isMounted) return;
      if (rolesRes.success && rolesRes.data && rolesRes.data.length > 0) {
        setRoles(rolesRes.data);
      } else {
        setFetchError(rolesRes.message || 'Unable to connect to role management service.');
      }

      if (usersRes.success && usersRes.data) {
        setAvailableUsers(usersRes.data);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const openAssignmentModal = () => {
    setStep('FORM');
    setUserId(availableUsers.length > 0 ? availableUsers[0].id : '');
    setSelectedRole(roles.length > 0 ? roles[0].code : '');
    setResponsibility('');
    setFieldErrors({});
    setAssignError(null);
    setAssignSuccessMessage(null);
    setIsModalOpen(true);
  };

  const validateAssignmentForm = (): boolean => {
    const errors: { userId?: string; role?: string } = {};

    if (!userId.trim()) {
      errors.userId = 'Target user identifier or selection is required.';
    }

    if (!selectedRole) {
      errors.role = 'Please select a system role.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignError(null);

    if (roles.length === 0) {
      setAssignError('Role assignment is currently unavailable because no role definitions are loaded from the backend API contract.');
      return;
    }

    if (!validateAssignmentForm()) {
      return;
    }

    setStep('CONFIRM');
  };

  const handleExecuteAssignment = async () => {
    setIsAssigning(true);
    setAssignError(null);

    const payload: RoleAssignmentPayload = {
      userId: userId.trim(),
      role: selectedRole as UserRole,
      departmentId: responsibility.trim() || undefined,
    };

    const result = await assignUserRole(payload);

    if (result.success) {
      const selectedRoleObj = roles.find((r) => r.code === selectedRole);
      const roleDisplayName = selectedRoleObj ? selectedRoleObj.name : selectedRole;

      setAssignSuccessMessage(
        `Role "${roleDisplayName}" assigned successfully to target user (${userId}).`
      );
      setIsModalOpen(false);
      setStep('FORM');
    } else {
      setAssignError(result.message || 'Failed to assign role. Unable to connect to backend.');
    }

    setIsAssigning(false);
  };

  // Dynamic role select options derived strictly from backend role definitions
  const roleSelectOptions = useMemo(() => {
    return roles.map((r) => ({
      label: `${r.name} (${r.code})`,
      value: r.code,
    }));
  }, [roles]);

  // Dynamic user select options derived from backend real user data if available
  const userSelectOptions = useMemo(() => {
    if (availableUsers.length === 0) return [];
    return availableUsers.map((u) => ({
      label: `${u.firstName} ${u.lastName} (${u.email})`,
      value: u.id,
    }));
  }, [availableUsers]);

  const targetSelectedUserObj = useMemo(() => {
    return availableUsers.find((u) => u.id === userId || u.email === userId);
  }, [availableUsers, userId]);

  const targetSelectedRoleObj = useMemo(() => {
    return roles.find((r) => r.code === selectedRole);
  }, [roles, selectedRole]);

  return (
    <div className="roles-container">
      {/* Alert Messages */}
      {assignSuccessMessage && (
        <div className="roles-alert roles-alert-success" role="status">
          <CheckCircle size={18} />
          <span>{assignSuccessMessage}</span>
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
          description="Retrieving system role definitions from backend identity services."
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
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchData}>
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
        onClose={() => {
          if (!isAssigning) {
            setIsModalOpen(false);
            setStep('FORM');
          }
        }}
        title={step === 'FORM' ? 'Assign System Role' : 'Confirm Role Assignment'}
        footer={
          step === 'FORM' ? (
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
                onClick={handleProceedToConfirmation}
                disabled={roles.length === 0}
                icon={<ChevronRight size={16} />}
              >
                Review Assignment
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep('FORM')}
                disabled={isAssigning}
                icon={<ArrowLeft size={16} />}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleExecuteAssignment}
                isLoading={isAssigning}
                icon={<Shield size={16} />}
              >
                Confirm & Assign Role
              </Button>
            </>
          )
        }
      >
        {step === 'FORM' ? (
          <form onSubmit={handleProceedToConfirmation} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

            {availableUsers.length > 0 ? (
              <Select
                id="target-user-select"
                label="Target User"
                options={userSelectOptions}
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
            ) : (
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
            )}

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
              helperText="Optional organizational scope for department or service unit authorization pending official DTO schema."
              disabled={isAssigning}
            />
          </form>
        ) : (
          <div className="role-confirmation-flow" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignError && (
              <div className="roles-alert roles-alert-error" role="alert">
                <AlertCircle size={18} />
                <span>{assignError}</span>
              </div>
            )}

            <p style={{ color: 'var(--color-neutral)', lineHeight: '1.6' }}>
              Please review and confirm the security role assignment details below:
            </p>

            <div className="confirmation-details-card" style={{ padding: '1rem', backgroundColor: 'var(--color-neutral-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', borderRadius: 'var(--radius-md, 0.375rem)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral)', fontWeight: 500 }}>Target User:</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral-heading)', fontWeight: 600 }}>
                  {targetSelectedUserObj ? `${targetSelectedUserObj.firstName} ${targetSelectedUserObj.lastName} (${targetSelectedUserObj.email})` : userId}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral)', fontWeight: 500 }}>Assigned System Role:</span>
                <Badge variant="info">
                  {targetSelectedRoleObj ? `${targetSelectedRoleObj.name} (${targetSelectedRoleObj.code})` : formatRole(selectedRole as UserRole)}
                </Badge>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral)', fontWeight: 500 }}>Department / Service Responsibility:</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral-heading)' }}>
                  {responsibility.trim() ? responsibility.trim() : 'None (System-wide)'}
                </span>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--color-neutral)', lineHeight: '1.5', padding: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.08)', borderRadius: 'var(--radius-sm, 0.25rem)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <strong>Security Notice:</strong> Assigning a system role grants access permissions according to the selected role definition within the university services platform.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

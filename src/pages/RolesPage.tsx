import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  UserPlus,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  Search,
  Users,
  Key,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { getRoles, assignUserRole, type SystemRoleDefinition, type RoleAssignmentPayload } from '@/services/roleService';
import { getUsers } from '@/services/userService';
import type { UserProfile, UserRole } from '@/types';
import { useAuth } from '@/auth';
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
  const { isAuthorized, isAccountInactive } = useAuth();
  const canManageRoles = isAuthorized(['ADMIN']) && !isAccountInactive;

  const [roles, setRoles] = useState<SystemRoleDefinition[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Stats calculation
  const stats = useMemo(() => {
    const totalRoles = roles.length;
    const adminRoles = roles.filter((r) => r.code === 'ADMIN' || r.code === 'DEAN' || r.code === 'HOD').length;
    const totalUsers = availableUsers.length;
    return { totalRoles, adminRoles, totalUsers };
  }, [roles, availableUsers]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    if (!searchQuery.trim()) return roles;
    const query = searchQuery.toLowerCase().trim();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.code.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
    );
  }, [roles, searchQuery]);

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

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { userId?: string; role?: string } = {};

    if (!userId) {
      errors.userId = 'Please select a university user.';
    }
    if (!selectedRole) {
      errors.role = 'Please select a role to assign.';
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length === 0) {
      setStep('CONFIRM');
    }
  };

  const handleBackToForm = () => {
    setStep('FORM');
    setAssignError(null);
  };

  const handleConfirmAssignment = async () => {
    setIsAssigning(true);
    setAssignError(null);

    const payload: RoleAssignmentPayload = {
      userId,
      role: selectedRole as UserRole,
    };

    const result = await assignUserRole(payload);

    if (result.success) {
      setAssignSuccessMessage(`Role "${formatRole(selectedRole as UserRole)}" assigned successfully.`);
      setIsModalOpen(false);
      fetchData();
    } else {
      setAssignError(result.message || 'Failed to assign role. Backend service unavailable.');
    }

    setIsAssigning(false);
  };

  const targetUserObj = availableUsers.find((u) => u.id === userId);
  const targetRoleObj = roles.find((r) => r.code === selectedRole);
  const isTargetUserInactive = targetUserObj?.accountStatus === 'INACTIVE';

  return (
    <div className="roles-container">
      {/* Success Notification */}
      {assignSuccessMessage && (
        <div className="roles-alert roles-alert-success" role="status">
          <CheckCircle size={18} />
          <span>{assignSuccessMessage}</span>
        </div>
      )}

      {/* Inactive user banner if current user is restricted */}
      {isAccountInactive && (
        <div className="roles-alert roles-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>Your account is currently inactive. Role management actions are restricted.</span>
        </div>
      )}

      {/* Header Card */}
      <Card>
        <div className="roles-header-card">
          <div className="roles-header-text">
            <h2 className="roles-title">Role & Authorization Management</h2>
            <p className="roles-subtitle">
              Manage system security roles, permission matrices, and user privilege delegations.
            </p>
          </div>
          {canManageRoles && (
            <Button
              variant="primary"
              icon={<UserPlus size={16} />}
              onClick={openAssignmentModal}
              disabled={isAccountInactive}
            >
              Assign Role
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Overview */}
      {roles.length > 0 && (
        <div className="roles-stats-bar">
          <div className="roles-stat-pill">
            <div className="roles-stat-pill-icon">
              <Shield size={18} />
            </div>
            <div className="roles-stat-pill-content">
              <span className="roles-stat-pill-count">{stats.totalRoles}</span>
              <span className="roles-stat-pill-label">Defined System Roles</span>
            </div>
          </div>

          <div className="roles-stat-pill">
            <div className="roles-stat-pill-icon" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
              <Key size={18} />
            </div>
            <div className="roles-stat-pill-content">
              <span className="roles-stat-pill-count">{stats.adminRoles}</span>
              <span className="roles-stat-pill-label">Privileged Tier Roles</span>
            </div>
          </div>

          <div className="roles-stat-pill">
            <div className="roles-stat-pill-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
              <Users size={18} />
            </div>
            <div className="roles-stat-pill-content">
              <span className="roles-stat-pill-count">{stats.totalUsers}</span>
              <span className="roles-stat-pill-label">Directory Members</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Filter Bar */}
      {roles.length > 0 && (
        <Card>
          <div className="roles-filter-bar">
            <div className="roles-search-input">
              <Input
                id="role-search-input"
                placeholder="Search roles by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Content Area: Loading / Loaded / Empty */}
      {isLoading ? (
        <LoadingState
          title="Loading Role Matrix..."
          description="Retrieving system role definitions and permissions from identity core."
        />
      ) : roles.length > 0 ? (
        <div className="roles-grid">
          {filteredRoles.map((role) => (
            <Card key={role.id || role.code} className="role-card">
              <CardBody>
                <div className="role-card-header">
                  <div className="role-identity">
                    <h3 className="role-name">{role.name}</h3>
                    <span className="role-code-badge">
                      <Badge variant="neutral">{role.code}</Badge>
                    </span>
                  </div>
                  {role.code === 'ADMIN' ? (
                    <Badge variant="danger">System Admin</Badge>
                  ) : (
                    <Badge variant="info">Standard</Badge>
                  )}
                </div>

                <p className="role-description">
                  {role.description || 'System role defining specific capability boundaries and permissions.'}
                </p>

                {role.permissions && role.permissions.length > 0 && (
                  <div className="role-permissions-section">
                    <span className="role-permissions-label">
                      Permissions ({role.permissions.length})
                    </span>
                    <div className="role-permissions-group">
                      {role.permissions.map((perm) => (
                        <span key={perm} className="permission-chip">
                          {perm}
                        </span>
                      ))}
                    </div>
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
            'The official backend Role Management API contract is not yet available in the repository. Role management interfaces and service boundaries are prepared to connect to backend services.'
          }
          icon={<Shield className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchData}>
                Retry Connection
              </Button>
              {canManageRoles && (
                <Button variant="primary" icon={<UserPlus size={16} />} onClick={openAssignmentModal}>
                  Assign Role
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Role Assignment Modal (2-Step) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={step === 'FORM' ? 'Assign System Role' : 'Confirm Role Assignment'}
        footer={
          step === 'FORM' ? (
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleNextStep} icon={<ChevronRight size={16} />}>
                Review & Confirm
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleBackToForm} disabled={isAssigning} icon={<ArrowLeft size={16} />}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAssignment}
                isLoading={isAssigning}
                icon={<ShieldCheck size={16} />}
              >
                Confirm Assignment
              </Button>
            </>
          )
        }
      >
        {step === 'FORM' ? (
          <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Select
              id="assign-user-select"
              label="Select User"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                if (fieldErrors.userId) {
                  setFieldErrors((prev) => ({ ...prev, userId: undefined }));
                }
              }}
              error={fieldErrors.userId}
              options={
                availableUsers.length > 0
                  ? availableUsers.map((u) => ({
                      value: u.id,
                      label: `${u.firstName} ${u.lastName} (${u.email})${u.accountStatus === 'INACTIVE' ? ' [INACTIVE]' : ''}`,
                    }))
                  : [{ value: '', label: 'No users available' }]
              }
              required
            />

            {isTargetUserInactive && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning-text)', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                <ShieldAlert size={16} />
                <span>Notice: This user account is currently inactive. Assigned roles will take effect upon account activation.</span>
              </div>
            )}

            <Select
              id="assign-role-select"
              label="Select System Role"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                if (fieldErrors.role) {
                  setFieldErrors((prev) => ({ ...prev, role: undefined }));
                }
              }}
              error={fieldErrors.role}
              options={
                roles.length > 0
                  ? roles.map((r) => ({
                      value: r.code,
                      label: `${r.name} (${r.code})`,
                    }))
                  : [{ value: '', label: 'No roles available' }]
              }
              required
            />

            <Input
              id="assign-responsibility-input"
              label="Reason / Responsibility Scope (Optional)"
              placeholder="e.g. Appointed as Academic Coordinator"
              value={responsibility}
              onChange={(e) => setResponsibility(e.target.value)}
            />
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignError && (
              <div className="roles-alert roles-alert-error" role="alert">
                <AlertCircle size={18} />
                <span>{assignError}</span>
              </div>
            )}

            <p style={{ color: 'var(--color-neutral)', fontSize: '0.875rem' }}>
              Please review the following role assignment details before confirming:
            </p>

            <div className="role-confirm-box">
              <div className="role-confirm-row">
                <span className="role-confirm-label">Target User:</span>
                <span className="role-confirm-val">
                  {targetUserObj?.firstName} {targetUserObj?.lastName}
                </span>
              </div>

              <div className="role-confirm-row">
                <span className="role-confirm-label">User Email:</span>
                <span className="role-confirm-val">{targetUserObj?.email}</span>
              </div>

              <div className="role-confirm-row">
                <span className="role-confirm-label">Assigned Role:</span>
                <span className="role-confirm-val">
                  <Badge variant="info">{targetRoleObj?.name || selectedRole}</Badge>
                </span>
              </div>

              {responsibility && (
                <div className="role-confirm-row">
                  <span className="role-confirm-label">Scope:</span>
                  <span className="role-confirm-val">{responsibility}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

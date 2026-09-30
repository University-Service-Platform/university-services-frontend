import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Phone,
  UserCheck,
  Download,
  Eye,
  Copy,
  Check,
  Shield,
  X,
  UserX,
  GraduationCap,
  Building2,
} from 'lucide-react';

import { useAuth } from '@/auth';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserCreatePayload,
  type UserUpdatePayload,
} from '@/services/userService';
import type { UserProfile, UserRole, AccountStatus } from '@/types';
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
import './UsersPage.css';

const AVAILABLE_ROLES: { value: string; label: string }[] = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'DEAN', label: 'Dean' },
  { value: 'HOD', label: 'Head of Department' },
  { value: 'GUEST', label: 'Guest' },
];

export const UsersPage: React.FC = () => {
  const { isAuthorized, hasRole } = useAuth();
  const canManageUsers = isAuthorized(['ADMIN']);
  const canDeleteUsers = hasRole('ADMIN');

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Quick View Details Modal State
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Form Modal State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Status Banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsersData = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    getUsers().then((result) => {
      if (result.success && result.data && result.data.length > 0) {
        setUsers(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to User Management service.');
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    getUsers().then((result) => {
      if (!isMounted) return;
      if (result.success && result.data && result.data.length > 0) {
        setUsers(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to User Management service.');
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.accountStatus === 'ACTIVE').length;
    const inactive = users.filter((u) => u.accountStatus === 'INACTIVE').length;
    return { total, active, inactive };
  }, [users]);

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search filter
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query);

      // Role filter
      const matchesRole =
        selectedRoleFilter === 'ALL' ||
        (user.roles && user.roles.includes(selectedRoleFilter as UserRole));

      // Status filter
      const matchesStatus =
        selectedStatusFilter === 'ALL' ||
        user.accountStatus === selectedStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedRoleFilter !== 'ALL' || selectedStatusFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRoleFilter('ALL');
    setSelectedStatusFilter('ALL');
  };

  const exportDirectoryCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['User ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Roles'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.firstName}"`,
      `"${u.lastName}"`,
      `"${u.email}"`,
      `"${u.phone || ''}"`,
      u.accountStatus || 'ACTIVE',
      `"${(u.roles || []).join('; ')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `university_users_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyUserId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFirstName(user.firstName || '');
    setLastName(user.lastName || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { firstName?: string; lastName?: string; email?: string } = {};

    if (!firstName.trim()) {
      errors.firstName = 'First name is required.';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    if (editingUser) {
      const payload: UserUpdatePayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      };
      const result = await updateUser(editingUser.id, payload);
      if (result.success) {
        setSuccessMessage(result.message || 'User updated successfully.');
        setIsFormModalOpen(false);
        fetchUsersData();
      } else {
        setSaveError(result.message || 'Failed to update user. Unable to connect to backend.');
      }
    } else {
      const payload: UserCreatePayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      };
      const result = await createUser(payload);
      if (result.success) {
        setSuccessMessage(result.message || 'User created successfully.');
        setIsFormModalOpen(false);
        fetchUsersData();
      } else {
        setSaveError(result.message || 'Failed to create user. Unable to connect to backend.');
      }
    }

    setIsSaving(false);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    setIsDeleting(true);
    setSuccessMessage(null);

    const result = await deleteUser(deletingUser.id);

    if (result.success) {
      setSuccessMessage('User record deleted successfully.');
      setDeletingUser(null);
      fetchUsersData();
    } else {
      setSaveError(result.message || 'Failed to delete user record.');
    }

    setIsDeleting(false);
  };

  const renderStatusBadge = (status?: AccountStatus) => {
    if (status === 'ACTIVE') {
      return <Badge variant="success">Active</Badge>;
    }
    if (status === 'INACTIVE') {
      return <Badge variant="danger">Inactive</Badge>;
    }
    return <Badge variant="neutral">Active</Badge>;
  };

  const renderRoleBadge = (role: UserRole) => (
    <Badge key={role} variant="neutral">
      {formatRole(role)}
    </Badge>
  );

  return (
    <div className="users-container">
      {/* Alert Banners */}
      {successMessage && (
        <div className="users-alert users-alert-success" role="status">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header Card */}
      <Card>
        <div className="users-header-card">
          <div className="users-header-text">
            <h2 className="users-title">User Account Directory</h2>
            <p className="users-subtitle">
              Manage university user accounts, directory profiles, and role assignments.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/users/account-status" style={{ textDecoration: 'none' }}>
              <Button variant="outline" icon={<UserCheck size={16} />}>
                Account Status
              </Button>
            </Link>
            {users.length > 0 && (
              <Button variant="outline" icon={<Download size={16} />} onClick={exportDirectoryCSV}>
                Export CSV
              </Button>
            )}
            {canManageUsers && (
              <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                Add User
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      {users.length > 0 && (
        <div className="users-stats-bar">
          <div className="users-stat-pill">
            <div className="users-stat-pill-icon">
              <Users size={18} />
            </div>
            <div className="users-stat-pill-content">
              <span className="users-stat-pill-count">{stats.total}</span>
              <span className="users-stat-pill-label">Total Accounts</span>
            </div>
          </div>

          <div className="users-stat-pill">
            <div className="users-stat-pill-icon" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
              <UserCheck size={18} />
            </div>
            <div className="users-stat-pill-content">
              <span className="users-stat-pill-count">{stats.active}</span>
              <span className="users-stat-pill-label">Active Users</span>
            </div>
          </div>

          <div className="users-stat-pill">
            <div className="users-stat-pill-icon" style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
              <UserX size={18} />
            </div>
            <div className="users-stat-pill-content">
              <span className="users-stat-pill-count">{stats.inactive}</span>
              <span className="users-stat-pill-label">Inactive Users</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      {users.length > 0 && (
        <Card className="users-controls-card">
          <div className="users-search-bar">
            <div className="users-search-input">
              <Input
                id="user-search-input"
                placeholder="Search by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>

            <div className="users-filter-group">
              <div style={{ minWidth: '160px' }}>
                <Select
                  id="role-filter-select"
                  options={AVAILABLE_ROLES}
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                />
              </div>

              <div className="users-status-pills">
                <button
                  type="button"
                  className={`users-status-btn ${selectedStatusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setSelectedStatusFilter('ALL')}
                >
                  All Status
                </button>
                <button
                  type="button"
                  className={`users-status-btn ${selectedStatusFilter === 'ACTIVE' ? 'active' : ''}`}
                  onClick={() => setSelectedStatusFilter('ACTIVE')}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`users-status-btn ${selectedStatusFilter === 'INACTIVE' ? 'active' : ''}`}
                  onClick={() => setSelectedStatusFilter('INACTIVE')}
                >
                  Inactive
                </button>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={resetFilters}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="users-results-count">
            <span>
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
            </span>
          </div>
        </Card>
      )}

      {/* Content Area: Loading / Empty / Loaded States */}
      {isLoading ? (
        <LoadingState
          title="Loading University Users..."
          description="Retrieving user account records from the identity core."
        />
      ) : users.length > 0 ? (
        filteredUsers.length > 0 ? (
          <div className="users-grid">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="user-card">
                <CardBody>
                  <div className="user-card-header">
                    <div className="user-card-identity">
                      <h3 className="user-card-name">
                        {user.firstName} {user.lastName}
                      </h3>
                      <span className="user-card-email">{user.email}</span>
                    </div>
                    {renderStatusBadge(user.accountStatus)}
                  </div>

                  <div className="user-card-body">
                    {user.phone && (
                      <div className="user-meta-item">
                        <Phone size={14} />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    {(user.facultyName || user.departmentName) && (
                      <div className="user-meta-item">
                        <GraduationCap size={14} />
                        <span>{[user.departmentName, user.facultyName].filter(Boolean).join(' • ')}</span>
                      </div>
                    )}

                    {user.serviceUnitName && (
                      <div className="user-meta-item">
                        <Building2 size={14} />
                        <span>{user.serviceUnitName}</span>
                      </div>
                    )}

                    {user.roles && user.roles.length > 0 && (
                      <div className="user-roles-list">
                        {user.roles.map((role) => renderRoleBadge(role))}
                      </div>
                    )}
                  </div>

                  <div className="user-card-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Eye size={15} />}
                      onClick={() => setViewingUser(user)}
                    >
                      Details
                    </Button>
                    {canManageUsers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 size={15} />}
                        onClick={() => openEditModal(user)}
                      >
                        Edit
                      </Button>
                    )}
                    {canDeleteUsers && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="btn-danger"
                        icon={<Trash2 size={15} />}
                        onClick={() => setDeletingUser(user)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                title="No Matching Users Found"
                description="No directory accounts match your current search and filter criteria."
                icon={<Search className="state-icon" />}
                action={
                  <Button variant="outline" icon={<RefreshCw size={16} />} onClick={resetFilters}>
                    Reset Search Filters
                  </Button>
                }
              />
            </CardBody>
          </Card>
        )
      ) : (
        <EmptyState
          title="User Management API Integration Pending"
          description={
            fetchError ||
            'The official backend User Management API contract is not yet available in the repository. The user account management interface and service layer boundary are prepared to connect to backend services.'
          }
          icon={<Users className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchUsersData}>
                Retry Connection
              </Button>
              {canManageUsers && (
                <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                  Open Create Modal
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Quick View Details Modal */}
      <Modal
        isOpen={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        title="User Account Details"
        footer={
          <Button variant="outline" onClick={() => setViewingUser(null)}>
            Close
          </Button>
        }
      >
        {viewingUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="user-details-grid">
              <div className="user-detail-field">
                <span className="user-detail-label">Full Name</span>
                <span className="user-detail-value">
                  {viewingUser.firstName} {viewingUser.lastName}
                </span>
              </div>

              <div className="user-detail-field">
                <span className="user-detail-label">Account Status</span>
                <div>{renderStatusBadge(viewingUser.accountStatus)}</div>
              </div>

              <div className="user-detail-field">
                <span className="user-detail-label">Email Address</span>
                <span className="user-detail-value">{viewingUser.email}</span>
              </div>

              <div className="user-detail-field">
                <span className="user-detail-label">Phone</span>
                <span className="user-detail-value">{viewingUser.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="user-detail-field">
              <span className="user-detail-label">User Identifier (ID)</span>
              <div className="user-detail-id-box">
                <span style={{ flex: 1 }}>{viewingUser.id}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={copiedId ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                  onClick={() => copyUserId(viewingUser.id)}
                >
                  {copiedId ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            <div className="user-detail-field">
              <span className="user-detail-label">Affiliations & Units</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.25rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-heading)' }}>
                  <strong>Faculty / Department: </strong>
                  {[viewingUser.departmentName, viewingUser.facultyName].filter(Boolean).join(' • ') || 'None assigned'}
                </div>
                {viewingUser.serviceUnitName && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-neutral-heading)' }}>
                    <strong>Service Unit: </strong>
                    {viewingUser.serviceUnitName}
                  </div>
                )}
              </div>
            </div>

            <div className="user-detail-field">
              <span className="user-detail-label">Assigned Roles</span>
              <div className="user-roles-list" style={{ marginTop: '0.5rem' }}>
                {viewingUser.roles && viewingUser.roles.length > 0 ? (
                  viewingUser.roles.map((role) => (
                    <Badge key={role} variant="neutral">
                      <Shield size={12} style={{ marginRight: '0.25rem' }} />
                      {formatRole(role)}
                    </Badge>
                  ))
                ) : (
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-neutral)' }}>No roles assigned</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Add New User Account'}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveUser}
              isLoading={isSaving}
              icon={<Users size={16} />}
            >
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveUser} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {saveError && (
            <div className="users-alert users-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <Input
            id="user-first-name-input"
            label="First Name"
            placeholder="e.g. Priyantha"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (fieldErrors.firstName) {
                setFieldErrors((prev) => ({ ...prev, firstName: undefined }));
              }
            }}
            error={fieldErrors.firstName}
            disabled={isSaving}
            required
          />

          <Input
            id="user-last-name-input"
            label="Last Name"
            placeholder="e.g. Perera"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (fieldErrors.lastName) {
                setFieldErrors((prev) => ({ ...prev, lastName: undefined }));
              }
            }}
            error={fieldErrors.lastName}
            disabled={isSaving}
            required
          />

          <Input
            id="user-email-input"
            label="Email Address"
            type="email"
            placeholder="e.g. user@kln.ac.lk"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            error={fieldErrors.email}
            disabled={isSaving}
            required
          />

          <Input
            id="user-phone-input"
            label="Phone Number (Optional)"
            placeholder="e.g. +94 77 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSaving}
          />
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        title="Confirm User Deletion"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingUser(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteUser}
              isLoading={isDeleting}
              icon={<Trash2 size={16} />}
            >
              Delete User
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-neutral)', marginBottom: '1rem' }}>
          Are you sure you want to delete the user account for{' '}
          <strong>
            {deletingUser?.firstName} {deletingUser?.lastName}
          </strong>{' '}
          ({deletingUser?.email})?
        </p>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: '0.875rem' }}>
          This action cannot be undone. The user will lose access to all university platform services.
        </div>
      </Modal>
    </div>
  );
};

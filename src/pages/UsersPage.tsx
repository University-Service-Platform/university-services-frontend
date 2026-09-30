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
  Mail,
  Phone,
  UserCheck,
  GraduationCap,
  Building2,
  Layers,
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
import { getFaculties } from '@/services/facultyService';
import { getDepartments } from '@/services/departmentService';
import { getServiceUnits } from '@/services/serviceUnitService';
import type { UserProfile, UserRole, AccountStatus, Faculty, Department, ServiceUnit } from '@/types';
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
  ErrorState,
} from '@/components/ui';
import { formatRole } from '@/utils';
import './UsersPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend User Management contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
export const UsersPage: React.FC = () => {
  const { isAuthorized, hasRole } = useAuth();
  const canManageUsers = isAuthorized(['ADMIN']);
  const canDeleteUsers = hasRole('ADMIN');

  // User list state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Directory state for affiliation selection and name resolution
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [serviceUnits, setServiceUnits] = useState<ServiceUnit[]>([]);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Affiliation Form Fields
  const [facultyId, setFacultyId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [serviceUnitId, setServiceUnitId] = useState<string>('');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status Banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load user records and directory lists safely
  const fetchUsersData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);

    const [usersRes, facultiesRes, deptsRes, unitsRes] = await Promise.all([
      getUsers(),
      getFaculties(),
      getDepartments(),
      getServiceUnits(),
    ]);

    // A successful empty list is a valid empty state, not a connection error.
    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
    } else {
      setFetchError(usersRes.message || 'Unable to connect to User Management service.');
    }

    if (facultiesRes.success && facultiesRes.data) {
      setFaculties(facultiesRes.data);
    }
    if (deptsRes.success && deptsRes.data) {
      setDepartments(deptsRes.data);
    }
    if (unitsRes.success && unitsRes.data) {
      setServiceUnits(unitsRes.data);
    }

    const failedDirectories = [
      !facultiesRes.success && 'faculties',
      !deptsRes.success && 'departments',
      !unitsRes.success && 'service units',
    ].filter(Boolean);
    setDirectoryError(
      failedDirectories.length > 0
        ? `Unable to load ${failedDirectories.join(', ')}. Affiliation options may be incomplete.`
        : null
    );

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsersData();
  }, [fetchUsersData]);

  // Lookup maps for resolving affiliation names from IDs when missing from UserProfile
  const facultyMap = useMemo(() => new Map(faculties.map((f) => [f.id, f.name])), [faculties]);
  const departmentMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);
  const serviceUnitMap = useMemo(() => new Map(serviceUnits.map((s) => [s.id, s.name])), [serviceUnits]);

  // Dynamic dropdown options
  const facultyOptions = useMemo(() => {
    return faculties.map((f) => ({
      value: f.id,
      label: `${f.name} (${f.code})`,
    }));
  }, [faculties]);

  // Cascade: Filter departments by selected Faculty ID
  const filteredDepartmentOptions = useMemo(() => {
    let filtered = departments;
    if (facultyId) {
      filtered = departments.filter((d) => d.facultyId === facultyId);
    }
    return filtered.map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    }));
  }, [departments, facultyId]);

  const serviceUnitOptions = useMemo(() => {
    return serviceUnits.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.code})`,
    }));
  }, [serviceUnits]);

  // Handle Faculty change with relationship cascade
  const handleFacultyChange = (newFacultyId: string) => {
    setFacultyId(newFacultyId);

    // Cascade: If selected department does not belong to the new faculty, clear departmentId selection
    if (departmentId && newFacultyId) {
      const currentDept = departments.find((d) => d.id === departmentId);
      if (currentDept && currentDept.facultyId !== newFacultyId) {
        setDepartmentId('');
      }
    }
  };

  // Client-side filtering for loaded user records
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(
      (user) =>
        (user.firstName || '').toLowerCase().includes(query) ||
        (user.lastName || '').toLowerCase().includes(query) ||
        (user.email || '').toLowerCase().includes(query) ||
        (user.id || '').toLowerCase().includes(query) ||
        (user.facultyName && user.facultyName.toLowerCase().includes(query)) ||
        (user.departmentName && user.departmentName.toLowerCase().includes(query)) ||
        (user.serviceUnitName && user.serviceUnitName.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setFacultyId('');
    setDepartmentId('');
    setServiceUnitId('');
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
    setFacultyId(user.facultyId || '');
    setDepartmentId(user.departmentId || '');
    setServiceUnitId(user.serviceUnitId || '');
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
    if (isSaving) return;
    setSaveError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    const payload: UserCreatePayload | UserUpdatePayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      facultyId: facultyId.trim() || undefined,
      departmentId: departmentId.trim() || undefined,
      serviceUnitId: serviceUnitId.trim() || undefined,
    };

    let result;
    if (editingUser) {
      result = await updateUser(editingUser.id, payload as UserUpdatePayload);
    } else {
      result = await createUser(payload as UserCreatePayload);
    }

    if (result.success) {
      setSuccessMessage(result.message || (editingUser ? 'User updated successfully.' : 'User created successfully.'));
      setIsFormModalOpen(false);
      fetchUsersData();
    } else {
      setSaveError(result.message || 'Failed to save user account. Unable to connect to backend.');
    }

    setIsSaving(false);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);
    setSuccessMessage(null);

    const result = await deleteUser(deletingUser.id);

    if (result.success) {
      setSuccessMessage(result.message || 'User record deleted successfully.');
      setDeletingUser(null);
      fetchUsersData();
    } else {
      setDeleteError(result.message || 'Failed to delete user record.');
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
    return <Badge variant="neutral">Unknown</Badge>;
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
            <h2 className="users-title">User Account Management</h2>
            <p className="users-subtitle">
              Manage university user accounts, organizational affiliations, and access directory.
            </p>
          </div>
          {canManageUsers && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/users/account-status" style={{ textDecoration: 'none' }}>
                <Button variant="outline" icon={<UserCheck size={16} />}>
                  Manage Account Status
                </Button>
              </Link>
              <Button
                variant="primary"
                icon={<Plus size={16} />}
                onClick={openCreateModal}
              >
                Add User
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Search & Filter Bar */}
      {users.length > 0 && (
        <Card className="users-controls-card">
          <div className="users-search-bar">
            <div className="users-search-input">
              <Input
                id="user-search-input"
                placeholder="Search users by name, email, ID, faculty, department, or service unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
          </div>
        </Card>
      )}

      {fetchError && users.length > 0 && !isLoading && (
        <div className="users-alert users-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Content Area: Loading / Error / Empty / Loaded States */}
      {isLoading ? (
        <LoadingState
          title="Loading University Users..."
          description="Retrieving user account records and organizational affiliations from the identity core."
        />
      ) : fetchError && users.length === 0 ? (
        <ErrorState
          title="Unable to Load Users"
          description={fetchError}
          onRetry={fetchUsersData}
        />
      ) : users.length > 0 ? (
        <div className="users-grid">
          {filteredUsers.map((user) => {
            const resolvedFacultyName = user.facultyName || (user.facultyId ? facultyMap.get(user.facultyId) : undefined);
            const resolvedDepartmentName = user.departmentName || (user.departmentId ? departmentMap.get(user.departmentId) : undefined);
            const resolvedServiceUnitName = user.serviceUnitName || (user.serviceUnitId ? serviceUnitMap.get(user.serviceUnitId) : undefined);

            return (
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

                    {(resolvedFacultyName || resolvedDepartmentName || resolvedServiceUnitName) && (
                      <div className="user-affiliations-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
                        {resolvedFacultyName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-neutral)' }}>
                            <GraduationCap size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span style={{ fontWeight: 500 }}>{resolvedFacultyName}</span>
                          </div>
                        )}
                        {resolvedDepartmentName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-neutral)' }}>
                            <Building2 size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span>{resolvedDepartmentName}</span>
                          </div>
                        )}
                        {resolvedServiceUnitName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-neutral)' }}>
                            <Layers size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span>{resolvedServiceUnitName}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {user.roles && user.roles.length > 0 && (
                      <div className="user-roles-list" style={{ marginTop: '0.75rem' }}>
                        {user.roles.map((role) => renderRoleBadge(role))}
                      </div>
                    )}
                  </div>

                  {(canManageUsers || canDeleteUsers) && (
                    <div className="user-card-actions">
                      {canManageUsers && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 size={16} />}
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
                          icon={<Trash2 size={16} />}
                          onClick={() => {
                            setDeleteError(null);
                            setDeletingUser(user);
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No User Accounts Found"
          description="The User Management service returned no user accounts."
          icon={<Users className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchUsersData}>
                Refresh
              </Button>
              {canManageUsers && (
                <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                  Add User
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          if (!isSaving) setIsFormModalOpen(false);
        }}
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

          {directoryError && (
            <div className="users-alert users-alert-error" role="status">
              <AlertCircle size={18} />
              <span>{directoryError}</span>
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
            leftIcon={<Mail size={18} />}
            disabled={isSaving}
            required
          />

          <Input
            id="user-phone-input"
            label="Phone Number (Optional)"
            placeholder="e.g. +94 71 234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone size={18} />}
            disabled={isSaving}
          />

          {/* User Affiliation Selectors */}
          <Select
            id="user-faculty-select"
            label="Faculty Affiliation (Optional)"
            options={facultyOptions}
            placeholder="None / Select Faculty..."
            value={facultyId}
            onChange={(e) => handleFacultyChange(e.target.value)}
            disabled={isSaving}
          />

          <Select
            id="user-department-select"
            label="Department Affiliation (Optional)"
            options={filteredDepartmentOptions}
            placeholder={
              facultyId && filteredDepartmentOptions.length === 0
                ? 'No departments in selected faculty'
                : 'None / Select Department...'
            }
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            disabled={isSaving}
          />

          <Select
            id="user-service-unit-select"
            label="Service Unit Affiliation (Optional)"
            options={serviceUnitOptions}
            placeholder="None / Select Service Unit..."
            value={serviceUnitId}
            onChange={(e) => setServiceUnitId(e.target.value)}
            disabled={isSaving}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingUser)}
        onClose={() => {
          if (!isDeleting) setDeletingUser(null);
        }}
        title="Delete User Account"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {deleteError && (
            <div className="users-alert users-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{deleteError}</span>
            </div>
          )}
          <p style={{ color: 'var(--color-neutral)', lineHeight: '1.6' }}>
            Are you sure you want to delete account for <strong>{deletingUser?.firstName} {deletingUser?.lastName}</strong> ({deletingUser?.email})? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

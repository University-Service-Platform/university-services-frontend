import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, Plus, Edit2, Trash2, AlertCircle, CheckCircle, RefreshCw, Search, Mail, Phone } from 'lucide-react';
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
  Badge,
  Modal,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import { formatRole } from '@/utils';
import './UsersPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend User Management contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Client-side filtering for loaded user records
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase().trim();
    return users.filter(
      (user) =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

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
              Manage university user accounts, credentials, and access directory.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            Add User
          </Button>
        </div>
      </Card>

      {/* Search & Filter Bar */}
      {users.length > 0 && (
        <Card className="users-controls-card">
          <div className="users-search-bar">
            <div className="users-search-input">
              <Input
                id="user-search-input"
                placeholder="Search users by name, email, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
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
                    icon={<Edit2 size={16} />}
                    onClick={() => openEditModal(user)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-danger"
                    icon={<Trash2 size={16} />}
                    onClick={() => setDeletingUser(user)}
                  >
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
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
              <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                Open Create Modal
              </Button>
            </div>
          }
        />
      )}

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
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
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
        <p style={{ color: 'var(--color-neutral)', lineHeight: '1.6' }}>
          Are you sure you want to delete account for <strong>{deletingUser?.firstName} {deletingUser?.lastName}</strong> ({deletingUser?.email})? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

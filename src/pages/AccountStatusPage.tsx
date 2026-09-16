import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserCheck, UserX, Search, RefreshCw, AlertCircle, CheckCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getUsers } from '@/services/userService';
import { updateAccountStatus } from '@/services/accountStatusService';
import type { UserProfile, AccountStatus, UserRole } from '@/types';
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
import './AccountStatusPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Account Status Management API contract and endpoints are not yet documented in the repository.
 * Interface controls and service interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
export const AccountStatusPage: React.FC = () => {
  const { user: currentUser, setAuthUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Confirmation Modal State
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [pendingStatus, setPendingStatus] = useState<AccountStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Success Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    getUsers().then((result) => {
      if (result.success && result.data && result.data.length > 0) {
        setUsers(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to user account status service.');
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
        setFetchError(result.message || 'Unable to connect to user account status service.');
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter users by search query and status filter
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchQuery.trim() ||
        u.firstName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.accountStatus === 'ACTIVE') ||
        (statusFilter === 'INACTIVE' && u.accountStatus === 'INACTIVE');

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  // Count stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.accountStatus === 'ACTIVE').length;
    const inactive = users.filter((u) => u.accountStatus === 'INACTIVE').length;
    return { total, active, inactive };
  }, [users]);

  // Open Confirmation Modal
  const openConfirmation = (userItem: UserProfile, newStatus: AccountStatus) => {
    setTargetUser(userItem);
    setPendingStatus(newStatus);
    setModalError(null);
    setSuccessMessage(null);
  };

  // Close Confirmation Modal
  const closeConfirmation = () => {
    if (isUpdating) return;
    setTargetUser(null);
    setPendingStatus(null);
    setModalError(null);
  };

  // Execute Status Change API call
  const handleConfirmStatusChange = async () => {
    if (!targetUser || !pendingStatus) return;

    setIsUpdating(true);
    setModalError(null);

    const result = await updateAccountStatus(targetUser.id, pendingStatus);

    if (result.success) {
      const updatedAccountStatus = result.accountStatus || pendingStatus;

      // Update local state list with backend response
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, accountStatus: updatedAccountStatus } : u
        )
      );

      setSuccessMessage(
        `Account status for ${targetUser.firstName} ${targetUser.lastName} updated to ${updatedAccountStatus}.`
      );

      // AuthContext integration: If logged-in user changed their own account status to INACTIVE, update AuthContext
      if (currentUser?.id === targetUser.id) {
        setAuthUser({
          ...currentUser,
          accountStatus: updatedAccountStatus,
        });
      }

      setIsUpdating(false);
      setTargetUser(null);
      setPendingStatus(null);
    } else {
      // Keep previous status, show safe error message
      setModalError(result.message || 'Failed to update account status. Unable to connect to backend.');
      setIsUpdating(false);
    }
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
    <div className="account-status-container">
      {/* Success Banner */}
      {successMessage && (
        <div className="account-status-alert account-status-alert-success" role="status">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Card */}
      <Card>
        <div className="account-status-header-card">
          <div className="account-status-header-text">
            <h2 className="account-status-title">Account Status Management</h2>
            <p className="account-status-subtitle">
              Manage synthetic university user account activation and deactivation states with administrative control.
            </p>
          </div>

          {users.length > 0 && (
            <div className="account-status-stats">
              <div className="stat-chip">
                <span className="stat-label">Total</span>
                <span className="stat-value">{stats.total}</span>
              </div>
              <div className="stat-chip stat-chip-success">
                <span className="stat-label">Active</span>
                <span className="stat-value">{stats.active}</span>
              </div>
              <div className="stat-chip stat-chip-danger">
                <span className="stat-label">Inactive</span>
                <span className="stat-value">{stats.inactive}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Controls Card: Search & Filter */}
      {users.length > 0 && (
        <Card className="account-status-controls-card">
          <div className="account-status-controls">
            <div className="account-status-search">
              <Input
                id="account-status-search-input"
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            <div className="account-status-filter">
              <Select
                id="account-status-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Statuses' },
                  { value: 'ACTIVE', label: 'Active Accounts' },
                  { value: 'INACTIVE', label: 'Inactive Accounts' },
                ]}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Content Area */}
      {isLoading ? (
        <LoadingState
          title="Loading Account Status Records..."
          description="Retrieving user access states from identity and access control services."
        />
      ) : users.length > 0 ? (
        <div className="account-status-grid">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((userItem) => {
              const isActive = userItem.accountStatus === 'ACTIVE';

              return (
                <Card key={userItem.id} className="account-status-card">
                  <CardBody>
                    <div className="account-status-card-header">
                      <div className="account-status-identity">
                        <h3 className="account-status-user-name">
                          {userItem.firstName} {userItem.lastName}
                        </h3>
                        <span className="account-status-user-email">{userItem.email}</span>
                      </div>
                      {renderStatusBadge(userItem.accountStatus)}
                    </div>

                    <div className="account-status-card-body">
                      <div className="account-status-meta-row">
                        <span className="meta-label">User ID:</span>
                        <code className="meta-code">{userItem.id}</code>
                      </div>

                      {userItem.roles && userItem.roles.length > 0 && (
                        <div className="account-status-roles-list">
                          {userItem.roles.map((role) => renderRoleBadge(role))}
                        </div>
                      )}
                    </div>

                    <div className="account-status-card-actions">
                      {isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="btn-deactivate"
                          icon={<UserX size={16} />}
                          onClick={() => openConfirmation(userItem, 'INACTIVE')}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<UserCheck size={16} />}
                          onClick={() => openConfirmation(userItem, 'ACTIVE')}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })
          ) : (
            <div className="account-status-no-results">
              <p>No user accounts found matching search filters.</p>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          title="Account Status API Integration Pending"
          description={
            fetchError ||
            'The official backend Account Status API contract is not yet available in the repository. The account status management interface and service layer boundary are prepared to connect to backend services.'
          }
          icon={<UserCheck className="state-icon" />}
          action={
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchUsers}>
              Retry Connection
            </Button>
          }
        />
      )}

      {/* Status Change Confirmation Modal */}
      <Modal
        isOpen={Boolean(targetUser && pendingStatus)}
        onClose={closeConfirmation}
        title={pendingStatus === 'INACTIVE' ? 'Confirm Account Deactivation' : 'Confirm Account Activation'}
        footer={
          <>
            <Button variant="ghost" onClick={closeConfirmation} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              variant={pendingStatus === 'INACTIVE' ? 'danger' : 'primary'}
              onClick={handleConfirmStatusChange}
              isLoading={isUpdating}
              icon={pendingStatus === 'INACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />}
            >
              {pendingStatus === 'INACTIVE' ? 'Deactivate Account' : 'Activate Account'}
            </Button>
          </>
        }
      >
        <div className="confirmation-modal-content">
          {modalError && (
            <div className="account-status-alert account-status-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{modalError}</span>
            </div>
          )}

          <div className="confirmation-user-summary">
            <div className="summary-icon-container">
              {pendingStatus === 'INACTIVE' ? (
                <ShieldAlert size={28} style={{ color: 'var(--color-danger)' }} />
              ) : (
                <ShieldCheck size={28} style={{ color: 'var(--color-success)' }} />
              )}
            </div>
            <div className="summary-details">
              <h4 className="summary-name">
                {targetUser?.firstName} {targetUser?.lastName}
              </h4>
              <p className="summary-email">{targetUser?.email}</p>
            </div>
          </div>

          <div className="confirmation-status-transition">
            <div className="transition-state">
              <span className="transition-label">Current Status</span>
              {renderStatusBadge(targetUser?.accountStatus)}
            </div>
            <div className="transition-arrow">→</div>
            <div className="transition-state">
              <span className="transition-label">Target Status</span>
              {renderStatusBadge(pendingStatus || undefined)}
            </div>
          </div>

          <p className="confirmation-notice">
            {pendingStatus === 'INACTIVE' ? (
              <>
                Deactivating this user account will restrict access to protected university platform functionality. Inactive users are automatically blocked from protected routes.
              </>
            ) : (
              <>
                Activating this user account restores full access permissions assigned to their user role within the university platform.
              </>
            )}
          </p>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { User, Shield, CheckCircle, AlertCircle, Edit2, Save, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/auth';
import { getProfile, updateProfile } from '@/services/profileService';
import type { UserProfile } from '@/types';
import { Card, CardHeader, CardBody, CardFooter, Button, Input, Badge, LoadingState, EmptyState, ErrorState } from '@/components/ui';
import { formatRole } from '@/utils';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const { user: authUser, setAuthUser } = useAuth();

  const [fetchedProfile, setFetchedProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!authUser);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Dynamic Profile Object
  const currentProfile = authUser || fetchedProfile;

  // Edit Mode State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form Field State
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string; email?: string }>({});

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    getProfile().then((result) => {
      if (result.success && result.data) {
        setFetchedProfile(result.data);
      } else {
        setFetchError(result.message || 'Unable to load profile data.');
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!authUser) {
      getProfile().then((result) => {
        if (!isMounted) return;
        if (result.success && result.data) {
          setFetchedProfile(result.data);
        } else {
          setFetchError(result.message || 'Unable to load profile data.');
        }
        setIsLoading(false);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [authUser]);

  const startEditing = () => {
    if (currentProfile) {
      setFirstName(currentProfile.firstName || '');
      setLastName(currentProfile.lastName || '');
      setEmail(currentProfile.email || '');
      setPhone(currentProfile.phone || '');
    }
    setSaveSuccess(false);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFieldErrors({});
    setSaveError(null);
    setIsEditing(false);
  };

  const validateForm = (): boolean => {
    const errors: { firstName?: string; lastName?: string; email?: string } = {};

    if (!firstName.trim()) {
      errors.firstName = 'First name is required.';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errors.email = 'A valid email address is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
    };

    const result = await updateProfile(payload);

    if (result.success && result.data) {
      setFetchedProfile(result.data);
      setAuthUser(result.data);
      setSaveSuccess(true);
      setIsEditing(false);
    } else {
      setSaveError(result.message || 'Failed to update profile. Please try again.');
    }

    setIsSaving(false);
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="profile-container">
        <LoadingState
          title="Loading User Profile..."
          description="Retrieving your university account details."
        />
      </div>
    );
  }

  // 2. Error State
  if (fetchError && !currentProfile) {
    return (
      <div className="profile-container">
        <ErrorState
          title="Unable to Load Profile"
          description={fetchError}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // 3. Empty / Unavailable State
  if (!currentProfile) {
    return (
      <div className="profile-container">
        <EmptyState
          title="No Profile Information Available"
          description="Your user profile details could not be found. Please connect backend services or sign in to view your profile."
          icon={<User className="state-icon" />}
          action={
            <Button variant="outline" icon={<RefreshCw size={16} />} onClick={handleRetry}>
              Retry Connection
            </Button>
          }
        />
      </div>
    );
  }

  const userInitials = `${currentProfile.firstName?.[0] || 'U'}${currentProfile.lastName?.[0] || ''}`;
  const primaryRole = currentProfile.roles && currentProfile.roles.length > 0 ? currentProfile.roles[0] : 'GUEST';
  const statusVariant = currentProfile.accountStatus === 'ACTIVE' ? 'success' : 'danger';

  return (
    <div className="profile-container">
      {/* Alert Messages */}
      {saveSuccess && (
        <div className="profile-alert profile-alert-success" role="status">
          <CheckCircle size={18} />
          <span>Profile information updated successfully.</span>
        </div>
      )}

      {saveError && (
        <div className="profile-alert profile-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Profile Header Banner Card */}
      <Card>
        <div className="profile-header-card">
          <div className="profile-avatar">{userInitials}</div>
          <div className="profile-header-info">
            <h2 className="profile-name">
              {currentProfile.firstName} {currentProfile.lastName}
            </h2>
            <div className="profile-meta-badges">
              {currentProfile.roles?.map((role) => (
                <Badge key={role} variant="info" icon={<Shield size={12} />}>
                  {formatRole(role)}
                </Badge>
              ))}
              <Badge variant={statusVariant}>
                {currentProfile.accountStatus || 'ACTIVE'}
              </Badge>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 size={16} />}
              onClick={startEditing}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </Card>

      {/* Form Container */}
      <form onSubmit={handleSave} noValidate>
        {/* Card 1: Read-Only System Identity & Organizational Information */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <CardHeader
            title="University Identity & System Information"
            subtitle="System-controlled identity parameters (Read-only)"
          />
          <CardBody>
            <div className="profile-grid">
              <div className="profile-field-item">
                <span className="profile-field-label">University Identifier</span>
                <span className="profile-field-value">{currentProfile.id || 'N/A'}</span>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Primary Role</span>
                <span className="profile-field-value">{formatRole(primaryRole)}</span>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Account Status</span>
                <span className="profile-field-value">{currentProfile.accountStatus || 'ACTIVE'}</span>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Department / Unit</span>
                <span className="profile-field-value">
                  {currentProfile.departmentName || currentProfile.departmentId || currentProfile.serviceUnitName || currentProfile.serviceUnitId || 'General University Services'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Contact & Personal Information */}
        <Card>
          <CardHeader
            title="Personal & Contact Information"
            subtitle="User contact parameters"
          />
          <CardBody>
            {isEditing ? (
              <div className="profile-grid">
                <Input
                  id="firstName"
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={fieldErrors.firstName}
                  disabled={isSaving}
                  required
                />

                <Input
                  id="lastName"
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={fieldErrors.lastName}
                  disabled={isSaving}
                  required
                />

                <Input
                  id="email"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={fieldErrors.email}
                  disabled={isSaving}
                  required
                />

                <Input
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="+94 7X XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            ) : (
              <div className="profile-grid">
                <div className="profile-field-item">
                  <span className="profile-field-label">First Name</span>
                  <span className="profile-field-value">{currentProfile.firstName || 'N/A'}</span>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-label">Last Name</span>
                  <span className="profile-field-value">{currentProfile.lastName || 'N/A'}</span>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-label">Email Address</span>
                  <span className="profile-field-value">{currentProfile.email || 'N/A'}</span>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-label">Phone Number</span>
                  <span className="profile-field-value">{currentProfile.phone || 'Not provided'}</span>
                </div>
              </div>
            )}
          </CardBody>

          {isEditing && (
            <CardFooter>
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                icon={<X size={16} />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                icon={<Save size={16} />}
              >
                Save Changes
              </Button>
            </CardFooter>
          )}
        </Card>
      </form>
    </div>
  );
};

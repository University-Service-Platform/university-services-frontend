import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Shield,
  CheckCircle,
  AlertCircle,
  Edit2,
  Save,
  X,
  Copy,
  Check,
  Building2,
  GraduationCap,
  ShieldCheck,
  Key,
} from 'lucide-react';
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
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Form Field State
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ firstName?: string; lastName?: string; email?: string; phone?: string }>({});

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

  const copyIdToClipboard = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const startEditing = () => {
    if (currentProfile) {
      setFirstName(currentProfile.firstName || '');
      setLastName(currentProfile.lastName || '');
      setEmail(currentProfile.email || '');
      setPhone(currentProfile.phone || '');
    }
    setFieldErrors({});
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
    const errors: { firstName?: string; lastName?: string; email?: string; phone?: string } = {};

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

    if (phone.trim() && !/^[+()0-9\s-]{7,20}$/.test(phone.trim())) {
      errors.phone = 'Please enter a valid phone number (e.g. +94 71 234 5678).';
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
      phone: phone.trim() || undefined,
    };

    const result = await updateProfile(payload);

    if (result.success && result.data && currentProfile) {
      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...result.data,
        firstName: result.data.firstName || payload.firstName,
        lastName: result.data.lastName || payload.lastName,
        email: result.data.email || payload.email,
        phone: result.data.phone !== undefined ? result.data.phone : payload.phone,
      };

      setFetchedProfile(updatedProfile);
      setAuthUser(updatedProfile);
      setSaveSuccess(true);
      setIsEditing(false);
    } else {
      setSaveError(result.message || 'Failed to update profile. Unable to connect to backend profile service.');
    }

    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <LoadingState
          title="Loading Profile..."
          description="Fetching your university identity and account parameters."
        />
      </div>
    );
  }

  if (fetchError && !currentProfile) {
    return (
      <div className="profile-container">
        <ErrorState
          title="Failed to Load Profile"
          description={fetchError}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="profile-container">
        <EmptyState
          title="Profile Not Available"
          description="No active profile record found for the current user session."
          icon={<User className="state-icon" />}
        />
      </div>
    );
  }

  const primaryRole = currentProfile.roles?.[0] || 'STUDENT';
  const statusVariant = currentProfile.accountStatus === 'ACTIVE' ? 'success' : 'danger';
  const userInitials = `${(currentProfile.firstName || 'U')[0]}${(currentProfile.lastName || '')[0]}`.toUpperCase();

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
                <div className="profile-field-value">
                  <span>{currentProfile.id || 'N/A'}</span>
                  {currentProfile.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={copiedId ? <Check size={14} color="var(--color-success)" /> : <Copy size={14} />}
                      onClick={() => copyIdToClipboard(currentProfile.id)}
                    >
                      {copiedId ? 'Copied' : 'Copy'}
                    </Button>
                  )}
                </div>
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
                  {currentProfile.departmentName || currentProfile.facultyName || currentProfile.serviceUnitName || 'General University Services'}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card 2: Contact & Personal Information */}
        <Card style={{ marginBottom: '1.5rem' }}>
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
                  id="lastName"
                  label="Last Name"
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
                  id="email"
                  label="Email Address"
                  type="email"
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
                  id="phone"
                  label="Phone Number"
                  type="tel"
                  placeholder="+94 7X XXX XXXX"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                    }
                  }}
                  error={fieldErrors.phone}
                  disabled={isSaving}
                />
              </div>
            ) : (
              <div className="profile-grid">
                <div className="profile-field-item">
                  <span className="profile-field-label">First Name</span>
                  <span className="profile-field-value">{currentProfile.firstName || 'Not provided'}</span>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-label">Last Name</span>
                  <span className="profile-field-value">{currentProfile.lastName || 'Not provided'}</span>
                </div>

                <div className="profile-field-item">
                  <span className="profile-field-label">Email Address</span>
                  <span className="profile-field-value">{currentProfile.email || 'Not provided'}</span>
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%' }}>
                <Button
                  variant="ghost"
                  icon={<X size={16} />}
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={<Save size={16} />}
                  isLoading={isSaving}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

        {/* Card 3: Security & Access Level Matrix */}
        <Card>
          <CardHeader
            title="Assigned Roles & Access Rights"
            subtitle="Access capabilities derived from Group 5 Identity Core"
          />
          <CardBody>
            <div className="profile-permissions-grid">
              <div className="profile-permission-item">
                <ShieldCheck size={16} color="var(--color-primary)" />
                <span>Identity Authentication</span>
              </div>
              <div className="profile-permission-item">
                <Key size={16} color="var(--color-primary)" />
                <span>Role-Based Navigation</span>
              </div>
              <div className="profile-permission-item">
                <GraduationCap size={16} color="var(--color-primary)" />
                <span>Academic Directory Access</span>
              </div>
              <div className="profile-permission-item">
                <Building2 size={16} color="var(--color-primary)" />
                <span>Service Unit Discovery</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  );
};

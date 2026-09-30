import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { resetPassword } from '@/services/passwordResetService';
import { AuthLayout } from './AuthLayout';

const MIN_LENGTH = 8;
const MAX_LENGTH = 72;

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // Kept in state, then removed from the address bar so it doesn't stay in the browser history
  const [token] = useState(() => searchParams.get('token') || '');
  useEffect(() => {
    if (window.location.search.includes('token=')) {
      window.history.replaceState(window.history.state, '', window.location.pathname);
    }
  }, []);

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmation?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setFormError(null);

    const errors: { password?: string; confirmation?: string } = {};
    if (password.length < MIN_LENGTH || password.length > MAX_LENGTH) {
      errors.password = `Use ${MIN_LENGTH} to ${MAX_LENGTH} characters.`;
    }
    if (confirmation !== password) {
      errors.confirmation = "The passwords don't match.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    const result = await resetPassword(token, password);
    setIsLoading(false);

    if (result.success) {
      setIsDone(true);
    } else {
      setFormError(result.message);
    }
  };

  if (!token) {
    return (
      <AuthLayout heading="Reset link missing" subheading="Open the link from the password reset email, or ask for a new one.">
        <Link to="/forgot-password" className="auth-back-link">
          <ArrowLeft size={16} /> Request a new link
        </Link>
      </AuthLayout>
    );
  }

  if (isDone) {
    return (
      <AuthLayout heading="Password changed" subheading="You can now sign in with your new password.">
        <div className="auth-alert auth-alert-success" role="status">
          <CheckCircle2 size={18} className="auth-alert-icon" />
          <span>Your password has been changed.</span>
        </div>
        <Link to="/auth" className="auth-back-link">
          <ArrowLeft size={16} /> Go to sign in
        </Link>
      </AuthLayout>
    );
  }

  const visibilityToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((prev) => !prev)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      disabled={isLoading}
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  return (
    <AuthLayout heading="Set a new password" subheading={`Choose a password of ${MIN_LENGTH} to ${MAX_LENGTH} characters.`}>
      {formError && (
        <div className="auth-alert" role="alert">
          <AlertCircle size={18} className="auth-alert-icon" />
          <span>
            {formError}{' '}
            <Link to="/forgot-password">Request a new link</Link>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          id="new-password"
          label="New password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={fieldErrors.password}
          leftIcon={<Lock size={18} />}
          rightIcon={visibilityToggle}
          autoComplete="new-password"
          disabled={isLoading}
          autoFocus
        />

        <Input
          id="confirm-password"
          label="Confirm new password"
          type={showPassword ? 'text' : 'password'}
          value={confirmation}
          onChange={(e) => {
            setConfirmation(e.target.value);
            setFieldErrors((prev) => ({ ...prev, confirmation: undefined }));
          }}
          error={fieldErrors.confirmation}
          leftIcon={<Lock size={18} />}
          autoComplete="new-password"
          disabled={isLoading}
        />

        <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} icon={<KeyRound size={18} />}>
          Change password
        </Button>
      </form>

      <Link to="/auth" className="auth-back-link">
        <ArrowLeft size={16} /> Back to sign in
      </Link>
    </AuthLayout>
  );
};

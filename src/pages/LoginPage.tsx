import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight, GraduationCap, AlertCircle } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { loginUser } from '@/services/authService';
import { useAuth } from '@/auth';
import './LoginPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Login API contract is not yet documented in the repository.
 * The login form connects to the authentication service integration boundary and handles real backend responses.
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      errors.identifier = 'Please enter your University ID or Email.';
    }

    if (!password || !password.trim()) {
      errors.password = 'Please enter your password.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser({
        identifier: identifier.trim(),
        password,
      });

      if (result.success && result.user) {
        setAuthUser(result.user);
        navigate('/');
      } else if (result.isInactive) {
        if (result.user) {
          setAuthUser(result.user);
        }
        setFormError(result.message || 'Your account is currently inactive. Please contact the IT Support Helpdesk for assistance.');
      } else {
        setFormError(result.message || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setFormError('An unexpected authentication error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Left Column: Visual & University Branding */}
      <section className="auth-brand-panel" aria-label="University Branding">
        <div className="brand-panel-content">
          <div className="brand-emblem-badge" aria-hidden="true">
            <GraduationCap size={36} color="#FFFFFF" />
          </div>
          <h1 className="brand-title">University of Kelaniya</h1>
          <p className="brand-tagline">One Platform. Many Possibilities.</p>
        </div>

        <footer className="brand-panel-footer">
          © 2026 University of Kelaniya • Learn • Belong • Thrive
        </footer>
      </section>

      {/* Right Column: Authentication Form Panel */}
      <section className="auth-form-panel" aria-label="Authentication Form">
        <div className="auth-form-card">
          <header className="auth-header">
            <div className="auth-badge">
              <span className="auth-badge-dot" aria-hidden="true" />
              <span>University Services Platform</span>
            </div>
            <h2 className="auth-heading">Sign in</h2>
            <p className="auth-subheading">
              Use your university ID or email to access events, announcements, facilities and service requests.
            </p>
          </header>

          {/* Form Alert Message */}
          {formError && (
            <div className="auth-alert" role="alert">
              <AlertCircle size={18} className="auth-alert-icon" />
              <span>{formError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate>
            <Input
              id="university-id"
              label="University ID / Email"
              type="email"
              placeholder="e.g. STU001 or name@university.example"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (fieldErrors.identifier) {
                  setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                }
              }}
              error={fieldErrors.identifier}
              leftIcon={<User size={18} />}
              autoComplete="username"
              disabled={isLoading}
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              error={fieldErrors.password}
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              autoComplete="current-password"
              disabled={isLoading}
            />

            <div className="auth-options">
              <a
                href="#forgot-password"
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  setFormError('Ask a platform administrator to reset your password; they can set a new one for you.');
                }}
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              icon={<ArrowRight size={18} />}
            >
              Login
            </Button>
          </form>

          {/* Help & Legal Footer */}
          <footer className="auth-footer">
            <p>Need help signing in? Ask your platform administrator.</p>
          </footer>
        </div>
      </section>
    </div>
  );
};

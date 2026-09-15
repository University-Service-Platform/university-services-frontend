import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, ArrowRight, GraduationCap, AlertCircle, Globe } from 'lucide-react';
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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};

    if (!identifier.trim()) {
      errors.identifier = 'Please enter your University ID or Email.';
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginUser({
        identifier: identifier.trim(),
        password,
        rememberMe,
      });

      if (result.success && result.user) {
        setAuthUser(result.user);
        navigate('/');
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

          <div className="brand-portals-group">
            <a href="#student-portal" className="portal-pill" onClick={(e) => e.preventDefault()}>
              Student Portal &gt;
            </a>
            <a href="#staff-portal" className="portal-pill" onClick={(e) => e.preventDefault()}>
              Staff Portal &gt;
            </a>
          </div>
        </div>

        <footer className="brand-panel-footer">
          © 2025 University of Kelaniya • Learn • Belong • Thrive
        </footer>
      </section>

      {/* Right Column: Authentication Form Panel */}
      <section className="auth-form-panel" aria-label="Authentication Form">
        <div className="auth-form-card">
          <header className="auth-header">
            <div className="auth-badge">
              <span className="auth-badge-dot" aria-hidden="true" />
              <span>University of Kelaniya Identity Core</span>
            </div>
            <h2 className="auth-heading">Welcome to University of Kelaniya LMS</h2>
            <p className="auth-subheading">
              Sign in with your University of Kelaniya credentials to access academic portal, student information, email, and campus resources.
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
              placeholder="student@kln.ac.lk"
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
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              autoComplete="current-password"
              disabled={isLoading}
            />

            <div className="auth-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>

              <a href="#forgot-password" className="forgot-link" onClick={(e) => e.preventDefault()}>
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

          {/* Single Sign On Section */}
          <div className="auth-divider">
            <span>SINGLE SIGN ON</span>
          </div>

          <div className="sso-group">
            <Button
              variant="outline"
              fullWidth
              className="sso-btn"
              onClick={() => setFormError('Single Sign-On requires external identity provider connection.')}
              icon={<span className="sso-dot-red" aria-hidden="true" />}
            >
              Campus ID
            </Button>

            <Button
              variant="outline"
              fullWidth
              className="sso-btn"
              onClick={() => setFormError('Single Sign-On requires external identity provider connection.')}
              icon={<Globe size={16} aria-hidden="true" />}
            >
              Google Workspace
            </Button>
          </div>

          {/* Help & Legal Footer */}
          <footer className="auth-footer">
            <p>
              Need help?{' '}
              <a href="#it-support" onClick={(e) => e.preventDefault()}>
                Contact IT Support
              </a>
            </p>
            <div className="auth-legal-links">
              <a href="#acceptable-use" onClick={(e) => e.preventDefault()}>
                Acceptable Use
              </a>{' '}
              •{' '}
              <a href="#privacy" onClick={(e) => e.preventDefault()}>
                Privacy
              </a>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
};

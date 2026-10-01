import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Mail, Send } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { requestPasswordReset } from '@/services/passwordResetService';
import { AuthLayout } from './AuthLayout';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setFormError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError('Enter the email address of your account.');
      return;
    }

    setIsLoading(true);
    const result = await requestPasswordReset(email);
    setIsLoading(false);

    if (result.success) {
      setSentMessage(result.message);
    } else {
      setFormError(result.message);
    }
  };

  return (
    <AuthLayout
      heading="Forgot your password?"
      subheading="Enter the email address of your account and we'll send you a link to set a new password."
    >
      {sentMessage ? (
        <div className="auth-alert auth-alert-success" role="status">
          <CheckCircle2 size={18} className="auth-alert-icon" />
          <span>{sentMessage} The link works once and expires in 30 minutes.</span>
        </div>
      ) : (
        <>
          {formError && (
            <div className="auth-alert" role="alert">
              <AlertCircle size={18} className="auth-alert-icon" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Input
              id="reset-email"
              label="Email address"
              type="email"
              placeholder="name@university.example"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError(undefined);
              }}
              error={fieldError}
              leftIcon={<Mail size={18} />}
              autoComplete="email"
              disabled={isLoading}
              autoFocus
            />

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isLoading} icon={<Send size={18} />}>
              Send reset link
            </Button>
          </form>
        </>
      )}

      <Link to="/auth" className="auth-back-link">
        <ArrowLeft size={16} /> Back to sign in
      </Link>
    </AuthLayout>
  );
};

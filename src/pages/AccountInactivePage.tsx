import React from 'react';
import { UserX, LogOut } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, Badge } from '@/components/ui';
import { useAuth } from '@/auth';

export interface AccountInactivePageProps {
  title?: string;
  description?: string;
}

export const AccountInactivePage: React.FC<AccountInactivePageProps> = ({
  title = 'Account Access Restricted',
  description = 'Your university account is currently inactive or unresolved. Inactive accounts are denied access to protected platform functionality. Please contact your system administrator or the IT Support Helpdesk for assistance.',
}) => {
  const { logout } = useAuth();

  return (
    <div style={{ maxWidth: '40rem', margin: '3rem auto' }}>
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-danger)' }}>
              <UserX size={24} />
              <span>{title}</span>
            </div>
          }
          action={<Badge variant="danger">RESTRICTED</Badge>}
        />
        <CardBody>
          <p style={{ color: 'var(--color-neutral)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            {description}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" icon={<LogOut size={16} />} onClick={logout}>
              Sign Out
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

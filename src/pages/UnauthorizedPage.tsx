import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody, Button } from '@/components/ui';

export interface UnauthorizedPageProps {
  title?: string;
  description?: string;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  title = 'Access Denied',
  description = 'You do not have the required permissions or assigned role to access this section of the platform. Please contact your system administrator if you believe this is an error.',
}) => {
  return (
    <div style={{ maxWidth: '40rem', margin: '3rem auto' }}>
      <Card>
        <CardHeader
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--color-danger)' }}>
              <ShieldAlert size={24} />
              <span>{title}</span>
            </div>
          }
        />
        <CardBody>
          <p style={{ color: 'var(--color-neutral)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            {description}
          </p>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="outline" icon={<ArrowLeft size={16} />}>
              Return to Dashboard
            </Button>
          </Link>
        </CardBody>
      </Card>
    </div>
  );
};

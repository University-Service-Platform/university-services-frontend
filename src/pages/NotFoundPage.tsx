import React from 'react';
import { SearchX, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardBody, Button } from '@/components/ui';

export const NotFoundPage: React.FC = () => (
  <div style={{ maxWidth: '40rem', margin: '3rem auto' }}>
    <Card>
      <CardHeader
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <SearchX size={24} />
            <span>Page not found</span>
          </div>
        }
      />
      <CardBody>
        <p style={{ color: 'var(--color-neutral)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          The page you were looking for doesn’t exist or has moved.
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

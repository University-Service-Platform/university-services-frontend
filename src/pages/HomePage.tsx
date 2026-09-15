import React from 'react';
import { Card, CardHeader, CardBody, Badge } from '@/components/ui';

export const HomePage: React.FC = () => {
  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
      <Card>
        <CardHeader
          title="University Services Management Platform"
          subtitle="Group 5 — University Identity and Directory Foundation"
          action={<Badge variant="info">Sprint 1</Badge>}
        />
        <CardBody>
          <p style={{ color: 'var(--color-neutral)', marginBottom: '1rem' }}>
            Shared UI/UX frontend foundation initialized. Navigation and feature routes will be integrated per Jira task assignments.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-neutral-light)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-neutral-heading)', marginBottom: '0.25rem' }}>Design System</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral)' }}>Figma Tokens Applied (#1E40AF Primary, Inter Font, White Surface)</p>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-neutral-light)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-neutral-heading)', marginBottom: '0.25rem' }}>Router Ready</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral)' }}>React Router setup with extensible AppShell layout</p>
            </div>
            <div style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-neutral-light)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-neutral-heading)', marginBottom: '0.25rem' }}>UI Components</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral)' }}>Reusable Buttons, Inputs, Cards, Badges, Modals, & States</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

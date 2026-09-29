import type { AudienceRule, UserRole } from '@/types';
import { ROLE_LABELS } from './eventRules';

const AUDIENCE_TYPE_LABEL: Record<AudienceRule['type'], string> = {
  ALL: 'Everyone',
  ROLE: 'Roles',
  FACULTY: 'Faculties',
  DEPARTMENT: 'Departments',
  SERVICE_UNIT: 'Service units',
};

export function describeAudience(audience: AudienceRule): string {
  if (audience.type === 'ALL') return 'Everyone';
  const values =
    audience.type === 'ROLE'
      ? audience.values.map((value) => ROLE_LABELS[value as UserRole] ?? value)
      : audience.values;
  return `${AUDIENCE_TYPE_LABEL[audience.type]}: ${values.join(', ')}`;
}

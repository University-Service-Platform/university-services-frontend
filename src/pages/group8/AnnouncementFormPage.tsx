import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Users } from 'lucide-react';
import { Button, Card, CardBody, CardFooter, CardHeader, Input, Modal } from '@/components/ui';
import {
  DemoDataNotice,
  G8Alert,
  G8PageHeader,
  Group8Page,
  ROLE_LABELS,
  describeAudience,
} from '@/components/group8';
import { getFaculties } from '@/services/facultyService';
import { getServiceUnits } from '@/services/serviceUnitService';
import { createAnnouncement, previewAudience } from '@/services/group8';
import { useAppDispatch, userActivityRecorded } from '@/store';
import type { AudiencePreview, AudienceRule, AudienceType, UserRole } from '@/types';
import { cn } from '@/utils';
import './group8Pages.css';

interface Option {
  value: string;
  label: string;
}

const AUDIENCE_TYPES: Array<{ value: AudienceType; label: string; hint: string }> = [
  { value: 'ALL', label: 'All users', hint: 'Every active university member.' },
  { value: 'ROLE', label: 'By role', hint: 'e.g. all students, or all heads of department.' },
  { value: 'FACULTY', label: 'By faculty', hint: 'Members of the selected faculties.' },
  { value: 'DEPARTMENT', label: 'By department', hint: 'Members of the selected departments.' },
  { value: 'SERVICE_UNIT', label: 'By service unit', hint: 'Staff of the selected service units.' },
];

const ROLE_OPTIONS: Option[] = (['STUDENT', 'STAFF', 'HOD', 'DEAN', 'ADMIN'] as UserRole[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

const splitIds = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);

export const AnnouncementFormPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audienceType, setAudienceType] = useState<AudienceType | ''>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [typedIds, setTypedIds] = useState('');
  const [facultyOptions, setFacultyOptions] = useState<Option[] | null>(null);
  const [serviceUnitOptions, setServiceUnitOptions] = useState<Option[] | null>(null);
  const [errors, setErrors] = useState<{ title?: string; content?: string; audience?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [savingMode, setSavingMode] = useState<'draft' | 'publish' | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Directory options come from Group 5; if unavailable, authors can type IDs instead.
  useEffect(() => {
    let active = true;
    getFaculties().then((result) => {
      if (active && result.success && result.data) {
        setFacultyOptions(result.data.map((faculty) => ({ value: faculty.id, label: faculty.name })));
      }
    });
    getServiceUnits().then((result) => {
      if (active && result.success && result.data) {
        setServiceUnitOptions(result.data.map((unit) => ({ value: unit.id, label: unit.name })));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const pickerOptions: Option[] | null =
    audienceType === 'ROLE'
      ? ROLE_OPTIONS
      : audienceType === 'FACULTY'
        ? facultyOptions
        : audienceType === 'SERVICE_UNIT'
          ? serviceUnitOptions
          : null;

  const audience: AudienceRule | null = useMemo(() => {
    if (!audienceType) return null;
    if (audienceType === 'ALL') return { type: 'ALL', values: [] };
    return { type: audienceType, values: pickerOptions ? selectedValues : splitIds(typedIds) };
  }, [audienceType, pickerOptions, selectedValues, typedIds]);

  // Live recipient estimate so authors can confirm the reach before publishing.
  useEffect(() => {
    if (!audience || (audience.type !== 'ALL' && audience.values.length === 0)) return;
    let active = true;
    const timer = setTimeout(async () => {
      const result = await previewAudience(audience);
      if (!active) return;
      if (result.ok) {
        setPreview(result.data);
        setPreviewError(null);
      } else {
        setPreview(null);
        setPreviewError(result.message);
      }
      if (result.demo) setIsDemo(true);
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [audience]);

  const hasAudienceValues = Boolean(audience && (audience.type === 'ALL' || audience.values.length > 0));

  const chooseType = (type: AudienceType) => {
    setAudienceType(type);
    setSelectedValues([]);
    setTypedIds('');
    setPreview(null);
    setPreviewError(null);
    setErrors((prev) => ({ ...prev, audience: undefined }));
  };

  const toggleValue = (value: string) => {
    setSelectedValues((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
    setErrors((prev) => ({ ...prev, audience: undefined }));
  };

  const validate = () => {
    const found: typeof errors = {};
    if (!title.trim()) found.title = 'Enter a title.';
    else if (title.trim().length > 150) found.title = 'Title must be 150 characters or fewer.';
    if (content.trim().length < 10) found.content = 'Write at least a short message (10+ characters).';
    if (!audienceType) found.audience = 'Choose who should receive this announcement.';
    else if (!hasAudienceValues) found.audience = 'Select at least one recipient group.';
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const submit = async (publishNow: boolean) => {
    setSubmitError(null);
    if (!validate() || !audience) {
      setSubmitError('Please fix the highlighted fields.');
      return;
    }
    setSavingMode(publishNow ? 'publish' : 'draft');
    const result = await createAnnouncement({ title: title.trim(), content: content.trim(), audience, publishNow });
    setSavingMode(null);
    setIsConfirmOpen(false);
    if (result.ok) {
      if (publishNow) dispatch(userActivityRecorded());
      navigate('/announcements');
      return;
    }
    setSubmitError(result.message);
  };

  /** Publishing notifies the whole audience, so the author confirms reach first. */
  const requestPublish = () => {
    setSubmitError(null);
    if (!validate() || !audience) {
      setSubmitError('Please fix the highlighted fields.');
      return;
    }
    setIsConfirmOpen(true);
  };

  return (
    <Group8Page>
      <div>
        <Link to="/announcements" className="g8-back-link">
          <ArrowLeft size={16} aria-hidden="true" /> Back to announcements
        </Link>
      </div>

      <G8PageHeader
        title="New Announcement"
        subtitle="Only the audience you choose will see this announcement and receive a notification."
        icon={<Megaphone size={22} />}
      />

      <DemoDataNotice show={isDemo} />

      {submitError && (
        <G8Alert tone="danger" onDismiss={() => setSubmitError(null)}>
          {submitError}
        </G8Alert>
      )}

      <form
        className="g8-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          requestPublish();
        }}
      >
        <Card>
          <CardHeader title="Message" />
          <CardBody>
            <Input
              label="Title"
              value={title}
              maxLength={150}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              error={errors.title}
            />
            <div className="form-group">
              <label htmlFor="g8-ann-content" className="form-label">
                Content
              </label>
              <textarea
                id="g8-ann-content"
                className={cn('form-input g8-textarea', errors.content && 'form-input-error')}
                rows={6}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setErrors((prev) => ({ ...prev, content: undefined }));
                }}
                aria-invalid={Boolean(errors.content)}
                aria-describedby={errors.content ? 'g8-ann-content-error' : undefined}
              />
              {errors.content && (
                <span id="g8-ann-content-error" className="form-error-text" role="alert">
                  {errors.content}
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Audience" subtitle="Targeting uses University Identity & Directory data (Group 5)." />
          <CardBody>
            <fieldset className="g8-fieldset">
              <legend className="g8-sr-only">Audience type</legend>
              <div className="g8-audience-types">
                {AUDIENCE_TYPES.map((option) => (
                  <label key={option.value} className={cn('g8-audience-type', audienceType === option.value && 'active')}>
                    <input
                      type="radio"
                      name="audienceType"
                      value={option.value}
                      checked={audienceType === option.value}
                      onChange={() => chooseType(option.value)}
                    />
                    <span className="g8-audience-type-label">{option.label}</span>
                    <span className="g8-audience-type-hint">{option.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {audienceType && audienceType !== 'ALL' && (
              pickerOptions ? (
                <fieldset className="g8-fieldset">
                  <legend className="form-label">Select recipients</legend>
                  <div className="g8-checkbox-row">
                    {pickerOptions.map((option) => (
                      <label key={option.value} className="g8-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedValues.includes(option.value)}
                          onChange={() => toggleValue(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <Input
                  label="Directory IDs"
                  placeholder={audienceType === 'DEPARTMENT' ? 'e.g. DEP-CS, DEP-MATH' : 'e.g. FAC-SCI or SU-LIB'}
                  value={typedIds}
                  onChange={(e) => {
                    setTypedIds(e.target.value);
                    setErrors((prev) => ({ ...prev, audience: undefined }));
                  }}
                  helperText="Comma-separated Group 5 IDs. The directory list could not be loaded, so enter IDs directly."
                />
              )
            )}

            {errors.audience && (
              <p className="form-error-text" role="alert">
                {errors.audience}
              </p>
            )}

            {hasAudienceValues && audience && (
              <div className="g8-audience-preview" role="status" aria-live="polite">
                <Users size={18} aria-hidden="true" />
                <div>
                  <strong>{describeAudience(audience)}</strong>
                  <div className="g8-muted">
                    {previewError
                      ? previewError
                      : preview
                        ? `About ${preview.estimatedRecipients.toLocaleString()} people will see this announcement.`
                        : 'Estimating recipients...'}
                  </div>
                </div>
              </div>
            )}
          </CardBody>
          <CardFooter className="g8-form-footer">
            <Button type="button" variant="ghost" onClick={() => navigate('/announcements')}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={() => submit(false)} isLoading={savingMode === 'draft'}>
              Save draft
            </Button>
            <Button type="submit" isLoading={savingMode === 'publish'}>
              Publish now
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Publish this announcement?"
        footer={
          <div className="g8-form-footer">
            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={() => submit(true)} isLoading={savingMode === 'publish'}>
              Publish and notify
            </Button>
          </div>
        }
      >
        <p className="g8-modal-text">
          <strong>{title.trim()}</strong> will be visible to{' '}
          <strong>{audience ? describeAudience(audience) : 'the selected audience'}</strong>
          {preview ? ` (about ${preview.estimatedRecipients.toLocaleString()} people)` : ''}, and each of them receives an
          in-app notification. Published announcements cannot be unpublished from this screen.
        </p>
      </Modal>
    </Group8Page>
  );
};

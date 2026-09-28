import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Paperclip, AlertCircle } from 'lucide-react';
import { createServiceRequest, type ServiceRequestCreatePayload } from '@/services/serviceRequestService';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  type SelectOption,
} from '@/components/ui';
import './CreateServiceRequestPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Request contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */

const CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'IT', value: 'IT' },
  { label: 'Facility', value: 'Facility' },
  { label: 'Equipment', value: 'Equipment' },
  { label: 'General', value: 'General' },
];

export const CreateServiceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [description, setDescription] = useState<string>('');
  const [attachmentFileName, setAttachmentFileName] = useState<string>('');

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Validation & Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    category?: string;
    location?: string;
    description?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { category?: string; location?: string; description?: string } = {};

    if (!category.trim()) {
      errors.category = 'Please select a category.';
    }

    if (!location.trim()) {
      errors.location = 'Location is required.';
    }

    if (!description.trim()) {
      errors.description = 'Description is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const payload: ServiceRequestCreatePayload = {
      category: category.trim(),
      location: location.trim(),
      priority,
      description: description.trim(),
      attachmentFileName: attachmentFileName.trim() || undefined,
    };

    const result = await createServiceRequest(payload);

    if (result.success) {
      navigate('/requests/my');
    } else {
      setSubmitError(result.message || 'Failed to submit service request. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/requests/my');
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="create-request-container">
      {/* Search Bar Header */}
      <div className="requests-search-bar-wrap">
        <div className="requests-search-input">
          <Input
            id="create-request-search-input"
            placeholder="Search my requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={18} />}
          />
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <nav className="requests-breadcrumb" aria-label="Breadcrumb">
        <span className="breadcrumb-item">Home</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-item">Service requests</span>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">New request</span>
      </nav>

      {/* Page Title & Main Header */}
      <div className="requests-page-header">
        <div className="requests-header-text">
          <h2 className="requests-title">New service request</h2>
          <p className="requests-subtitle">Report a facility, equipment, IT, or general issue.</p>
        </div>
      </div>

      {/* Form Submission Error Alert */}
      {submitError && (
        <div className="form-alert form-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{submitError}</span>
        </div>
      )}

      {/* Create Service Request Form Card */}
      <Card className="create-request-card">
        <CardBody>
          <form onSubmit={handleSubmit} noValidate className="create-request-form">
            {/* Category Dropdown */}
            <Select
              id="request-category-select"
              label="Category"
              placeholder="Select a category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                if (fieldErrors.category) {
                  setFieldErrors((prev) => ({ ...prev, category: undefined }));
                }
              }}
              options={CATEGORY_OPTIONS}
              error={fieldErrors.category}
              disabled={isSubmitting}
            />

            {/* Location Input */}
            <Input
              id="request-location-input"
              label="Location"
              placeholder="e.g. Engineering Block, Room 204"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (fieldErrors.location) {
                  setFieldErrors((prev) => ({ ...prev, location: undefined }));
                }
              }}
              error={fieldErrors.location}
              disabled={isSubmitting}
            />

            {/* Priority Suggestion Toggle Buttons */}
            <div className="form-group">
              <label className="form-label">Priority suggestion</label>
              <div className="priority-toggle-group" role="radiogroup" aria-label="Priority suggestion">
                {(['Low', 'Medium', 'High'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={priority === p}
                    className={`priority-btn priority-${p.toLowerCase()} ${priority === p ? 'selected' : ''}`}
                    onClick={() => setPriority(p)}
                    disabled={isSubmitting}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="form-group">
              <label htmlFor="request-description-input" className="form-label">
                Description
              </label>
              <textarea
                id="request-description-input"
                className={`form-textarea ${fieldErrors.description ? 'form-textarea-error' : ''}`}
                placeholder="Describe the issue in detail"
                value={description}
                rows={4}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) {
                    setFieldErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                disabled={isSubmitting}
                aria-invalid={Boolean(fieldErrors.description)}
              />
              {fieldErrors.description && (
                <span className="form-error-text" role="alert">
                  {fieldErrors.description}
                </span>
              )}
            </div>

            {/* Attachment Box Placeholder */}
            <div className="form-group">
              <label className="form-label">Attachment</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-label="Upload attachment file"
              />
              <div
                className="attachment-placeholder-box"
                onClick={handleAttachmentClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAttachmentClick();
                  }
                }}
              >
                <Paperclip size={18} className="attachment-box-icon" />
                <span>
                  {attachmentFileName
                    ? `Attached: ${attachmentFileName}`
                    : 'Attach a photo or file (optional)'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="create-request-actions">
              <Button
                variant="outline"
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                isLoading={isSubmitting}
              >
                Submit request
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

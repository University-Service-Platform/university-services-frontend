import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Paperclip, AlertCircle } from 'lucide-react';
import { createServiceRequest } from '@/services/serviceRequestService';
import type { RequestCategory, RequestPriority, CreateServiceRequestRequest } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  type SelectOption,
} from '@/components/ui';
import './CreateServiceRequestPage.css';

const CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Facility', value: 'FACILITY' },
  { label: 'Equipment', value: 'EQUIPMENT' },
  { label: 'IT', value: 'IT' },
  { label: 'General', value: 'GENERAL' },
];

const PRIORITY_OPTIONS: { label: string; value: RequestPriority }[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
];

export const CreateServiceRequestPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [category, setCategory] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [priority, setPriority] = useState<RequestPriority>('MEDIUM');
  const [description, setDescription] = useState<string>('');
  const [attachmentReference, setAttachmentReference] = useState<string>('');

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Validation & Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    category?: string;
    location?: string;
    description?: string;
    attachmentReference?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: {
      category?: string;
      location?: string;
      description?: string;
      attachmentReference?: string;
    } = {};

    if (!category.trim()) {
      errors.category = 'Please select a category.';
    }

    if (!location.trim()) {
      errors.location = 'Location is required.';
    } else if (location.trim().length > 255) {
      errors.location = 'Location must not exceed 255 characters.';
    }

    if (!description.trim()) {
      errors.description = 'Description is required.';
    }

    if (attachmentReference.trim().length > 500) {
      errors.attachmentReference = 'Attachment reference must not exceed 500 characters.';
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

    const payload: CreateServiceRequestRequest = {
      category: category as RequestCategory,
      location: location.trim(),
      priority,
      description: description.trim(),
      attachmentReference: attachmentReference.trim() || undefined,
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
              placeholder="e.g. Block C, Room 302"
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
              <label className="form-label">Priority</label>
              <div className="priority-toggle-group" role="radiogroup" aria-label="Priority">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={priority === opt.value}
                    className={`priority-btn priority-${opt.value.toLowerCase()} ${priority === opt.value ? 'selected' : ''}`}
                    onClick={() => setPriority(opt.value)}
                    disabled={isSubmitting}
                  >
                    {opt.label}
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

            {/* Attachment Reference Input */}
            <Input
              id="request-attachment-input"
              label="Attachment Reference (Optional URL or File Path)"
              placeholder="e.g. https://storage.university.edu/uploads/photo123.jpg"
              value={attachmentReference}
              onChange={(e) => {
                setAttachmentReference(e.target.value);
                if (fieldErrors.attachmentReference) {
                  setFieldErrors((prev) => ({ ...prev, attachmentReference: undefined }));
                }
              }}
              error={fieldErrors.attachmentReference}
              leftIcon={<Paperclip size={18} />}
              disabled={isSubmitting}
            />

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

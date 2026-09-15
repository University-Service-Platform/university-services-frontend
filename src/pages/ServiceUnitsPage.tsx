import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Edit2, Trash2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import {
  getServiceUnits,
  createServiceUnit,
  updateServiceUnit,
  deleteServiceUnit,
  type ServiceUnitCreatePayload,
} from '@/services/serviceUnitService';
import type { ServiceUnit } from '@/types';
import {
  Card,
  CardBody,
  Button,
  Input,
  Badge,
  Modal,
  LoadingState,
  EmptyState,
} from '@/components/ui';
import './ServiceUnitsPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Service Unit management contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
export const ServiceUnitsPage: React.FC = () => {
  const [serviceUnits, setServiceUnits] = useState<ServiceUnit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form Modal State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<ServiceUnit | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; code?: string }>({});

  // Delete Modal State
  const [deletingUnit, setDeletingUnit] = useState<ServiceUnit | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Status Banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchServiceUnitsData = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    getServiceUnits().then((result) => {
      if (result.success && result.data && result.data.length > 0) {
        setServiceUnits(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to Service Unit Management service.');
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    getServiceUnits().then((result) => {
      if (!isMounted) return;
      if (result.success && result.data && result.data.length > 0) {
        setServiceUnits(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to Service Unit Management service.');
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const openCreateModal = () => {
    setEditingUnit(null);
    setName('');
    setCode('');
    setDescription('');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (unit: ServiceUnit) => {
    setEditingUnit(unit);
    setName(unit.name || '');
    setCode(unit.code || '');
    setDescription(unit.description || '');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; code?: string } = {};

    if (!name.trim()) {
      errors.name = 'Service unit name is required.';
    }

    if (!code.trim()) {
      errors.code = 'Service unit code is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveServiceUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    const payload: ServiceUnitCreatePayload = {
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || undefined,
    };

    let result;
    if (editingUnit) {
      result = await updateServiceUnit(editingUnit.id, payload);
    } else {
      result = await createServiceUnit(payload);
    }

    if (result.success) {
      setSuccessMessage(result.message || 'Service unit saved successfully.');
      setIsFormModalOpen(false);
      fetchServiceUnitsData();
    } else {
      setSaveError(result.message || 'Failed to save service unit. Unable to connect to backend.');
    }

    setIsSaving(false);
  };

  const handleDeleteServiceUnit = async () => {
    if (!deletingUnit) return;

    setIsDeleting(true);
    setSuccessMessage(null);

    const result = await deleteServiceUnit(deletingUnit.id);

    if (result.success) {
      setSuccessMessage('Service unit deleted successfully.');
      setDeletingUnit(null);
      fetchServiceUnitsData();
    } else {
      setSaveError(result.message || 'Failed to delete service unit.');
    }

    setIsDeleting(false);
  };

  return (
    <div className="service-units-container">
      {/* Alert Banners */}
      {successMessage && (
        <div className="service-units-alert service-units-alert-success" role="status">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header Card */}
      <Card>
        <div className="service-units-header-card">
          <div className="service-units-header-text">
            <h2 className="service-units-title">Service Unit Management</h2>
            <p className="service-units-subtitle">
              Manage university administrative, academic support, and operational service units.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            Add Service Unit
          </Button>
        </div>
      </Card>

      {/* Content Area: Loading / Empty / Loaded States */}
      {isLoading ? (
        <LoadingState
          title="Loading Service Units..."
          description="Retrieving service unit records from the university directory."
        />
      ) : serviceUnits.length > 0 ? (
        <div className="service-units-grid">
          {serviceUnits.map((unit) => (
            <Card key={unit.id} className="service-unit-card">
              <CardBody>
                <div className="service-unit-card-header">
                  <h3 className="service-unit-name">{unit.name}</h3>
                  <Badge variant="info">{unit.code}</Badge>
                </div>
                <div className="service-unit-meta">
                  {unit.description && (
                    <p style={{ marginTop: '0.25rem', lineHeight: '1.5' }}>
                      {unit.description}
                    </p>
                  )}
                </div>
                <div className="service-unit-card-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={16} />}
                    onClick={() => openEditModal(unit)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-danger"
                    icon={<Trash2 size={16} />}
                    onClick={() => setDeletingUnit(unit)}
                  >
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Service Unit Management API Integration Pending"
          description={
            fetchError ||
            'The official backend Service Unit Management API contract is not yet available in the repository. The service unit management interface and service layer boundary are prepared to connect to backend services.'
          }
          icon={<Layers className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchServiceUnitsData}>
                Retry Connection
              </Button>
              <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                Open Create Modal
              </Button>
            </div>
          }
        />
      )}

      {/* Create / Edit Service Unit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingUnit ? 'Edit Service Unit' : 'Add New Service Unit'}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveServiceUnit}
              isLoading={isSaving}
              icon={<Layers size={16} />}
            >
              {editingUnit ? 'Save Changes' : 'Create Service Unit'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveServiceUnit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {saveError && (
            <div className="service-units-alert service-units-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <Input
            id="service-unit-name-input"
            label="Service Unit Name"
            placeholder="e.g. Information Technology Services"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            error={fieldErrors.name}
            disabled={isSaving}
            required
          />

          <Input
            id="service-unit-code-input"
            label="Service Unit Code"
            placeholder="e.g. ITS"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (fieldErrors.code) {
                setFieldErrors((prev) => ({ ...prev, code: undefined }));
              }
            }}
            error={fieldErrors.code}
            disabled={isSaving}
            required
          />

          <Input
            id="service-unit-description-input"
            label="Description (Optional)"
            placeholder="Brief overview of the service unit..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingUnit)}
        onClose={() => setDeletingUnit(null)}
        title="Delete Service Unit"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingUnit(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteServiceUnit}
              isLoading={isDeleting}
              icon={<Trash2 size={16} />}
            >
              Delete Service Unit
            </Button>
          </>
        }
      >
        <p style={{ color: 'var(--color-neutral)', lineHeight: '1.6' }}>
          Are you sure you want to delete <strong>{deletingUnit?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

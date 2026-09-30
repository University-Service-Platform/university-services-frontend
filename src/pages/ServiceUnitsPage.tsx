import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Layers, Plus, Edit2, Trash2, AlertCircle, CheckCircle, RefreshCw, Search, X } from 'lucide-react';
import {
  getServiceUnits,
  createServiceUnit,
  updateServiceUnit,
  deleteServiceUnit,
  type ServiceUnitCreatePayload,
  type ServiceUnitUpdatePayload,
} from '@/services/serviceUnitService';
import type { ServiceUnit } from '@/types';
import { useAuth } from '@/auth';
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

export const ServiceUnitsPage: React.FC = () => {
  const { isAuthorized, isAccountInactive } = useAuth();
  const canManageServiceUnits = isAuthorized(['ADMIN']) && !isAccountInactive;

  const [serviceUnits, setServiceUnits] = useState<ServiceUnit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingServiceUnit, setEditingServiceUnit] = useState<ServiceUnit | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; code?: string }>({});

  // Delete Modal State
  const [deletingServiceUnit, setDeletingServiceUnit] = useState<ServiceUnit | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // Filter loaded service units by search query
  const filteredServiceUnits = useMemo(() => {
    if (!searchQuery.trim()) return serviceUnits;
    const query = searchQuery.toLowerCase().trim();
    return serviceUnits.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.code.toLowerCase().includes(query) ||
        (u.description && u.description.toLowerCase().includes(query))
    );
  }, [serviceUnits, searchQuery]);

  const openCreateModal = () => {
    setEditingServiceUnit(null);
    setName('');
    setCode('');
    setDescription('');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (unit: ServiceUnit) => {
    setEditingServiceUnit(unit);
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

    if (editingServiceUnit) {
      const payload: ServiceUnitUpdatePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
      };

      const result = await updateServiceUnit(editingServiceUnit.id, payload);

      if (result.success) {
        setSuccessMessage(result.message || 'Service unit updated successfully.');
        setIsFormModalOpen(false);
        fetchServiceUnitsData();
      } else {
        setSaveError(result.message || 'Failed to update service unit.');
      }
    } else {
      const payload: ServiceUnitCreatePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
      };

      const result = await createServiceUnit(payload);

      if (result.success) {
        setSuccessMessage(result.message || 'Service unit created successfully.');
        setIsFormModalOpen(false);
        fetchServiceUnitsData();
      } else {
        setSaveError(result.message || 'Failed to create service unit.');
      }
    }

    setIsSaving(false);
  };

  const handleDeleteServiceUnit = async () => {
    if (!deletingServiceUnit) return;

    setIsDeleting(true);
    setDeleteError(null);
    setSuccessMessage(null);

    const result = await deleteServiceUnit(deletingServiceUnit.id);

    if (result.success) {
      setSuccessMessage('Service unit deleted successfully.');
      setDeletingServiceUnit(null);
      fetchServiceUnitsData();
    } else {
      setDeleteError(result.message || 'Failed to delete service unit.');
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

      {/* Header Card */}
      <Card>
        <div className="service-units-header-card">
          <div className="service-units-header-text">
            <h2 className="service-units-title">Service Units Management</h2>
            <p className="service-units-subtitle">
              Manage administrative units, support centers, and operational divisions.
            </p>
          </div>
          {canManageServiceUnits && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
              Add Service Unit
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Bar */}
      {serviceUnits.length > 0 && (
        <div className="service-units-stats-bar">
          <div className="service-units-stat-pill">
            <div className="service-units-stat-pill-icon">
              <Layers size={18} />
            </div>
            <div className="service-units-stat-pill-content">
              <span className="service-units-stat-pill-count">{serviceUnits.length}</span>
              <span className="service-units-stat-pill-label">Registered Service Units</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Controls */}
      {serviceUnits.length > 0 && (
        <Card className="service-units-controls-card">
          <div className="service-units-search-bar">
            <div className="service-units-search-input">
              <Input
                id="service-unit-search-input"
                placeholder="Search service units by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Content Area */}
      {isLoading ? (
        <LoadingState
          title="Loading Service Units..."
          description="Retrieving service unit records from identity directory."
        />
      ) : serviceUnits.length > 0 ? (
        filteredServiceUnits.length > 0 ? (
          <div className="service-units-grid">
            {filteredServiceUnits.map((unit) => (
              <Card key={unit.id} className="service-unit-card">
                <CardBody>
                  <div className="service-unit-card-header">
                    <h3 className="service-unit-name">{unit.name}</h3>
                    <Badge variant="neutral">{unit.code}</Badge>
                  </div>

                  <div className="service-unit-meta">
                    <p style={{ color: 'var(--color-neutral)', lineHeight: 1.4 }}>
                      {unit.description || 'No description provided.'}
                    </p>
                  </div>

                  {canManageServiceUnits && (
                    <div className="service-unit-card-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 size={15} />}
                        onClick={() => openEditModal(unit)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="btn-danger"
                        icon={<Trash2 size={15} />}
                        onClick={() => setDeletingServiceUnit(unit)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                title="No Matching Service Units"
                description="No administrative service units match your search query."
                icon={<Search className="state-icon" />}
                action={
                  <Button variant="outline" icon={<RefreshCw size={16} />} onClick={() => setSearchQuery('')}>
                    Reset Search
                  </Button>
                }
              />
            </CardBody>
          </Card>
        )
      ) : (
        <EmptyState
          title="Service Unit Management API Integration Pending"
          description={
            fetchError ||
            'The official backend Service Unit Management API contract is not yet available in the repository. Service unit management interfaces and service boundaries are prepared to connect to backend services.'
          }
          icon={<Layers className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchServiceUnitsData}>
                Retry Connection
              </Button>
              {canManageServiceUnits && (
                <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                  Add Service Unit
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Create / Edit Service Unit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingServiceUnit ? 'Edit Service Unit' : 'Add New Service Unit'}
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
              {editingServiceUnit ? 'Save Changes' : 'Create Service Unit'}
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
            id="unit-name-input"
            label="Service Unit Name"
            placeholder="e.g. Information & Communication Technology Centre"
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
            id="unit-code-input"
            label="Service Unit Code"
            placeholder="e.g. ICTC"
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
            id="unit-description-input"
            label="Description (Optional)"
            placeholder="Brief overview of service unit responsibilities"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </form>
      </Modal>

      {/* Delete Service Unit Modal */}
      <Modal
        isOpen={Boolean(deletingServiceUnit)}
        onClose={() => setDeletingServiceUnit(null)}
        title="Confirm Service Unit Deletion"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingServiceUnit(null)}
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
        {deleteError && (
          <div className="service-units-alert service-units-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} />
            <span>{deleteError}</span>
          </div>
        )}
        <p style={{ color: 'var(--color-neutral)', marginBottom: '1rem' }}>
          Are you sure you want to delete the service unit{' '}
          <strong>{deletingServiceUnit?.name}</strong> ({deletingServiceUnit?.code})?
        </p>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: '0.875rem' }}>
          This action will remove the service unit from the directory.
        </div>
      </Modal>
    </div>
  );
};

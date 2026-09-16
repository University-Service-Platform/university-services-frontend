import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GraduationCap, Plus, Edit2, Trash2, AlertCircle, CheckCircle, RefreshCw, Search } from 'lucide-react';
import {
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  type FacultyCreatePayload,
} from '@/services/facultyService';
import type { Faculty } from '@/types';
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
import './FacultiesPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Faculty management contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
export const FacultiesPage: React.FC = () => {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; code?: string }>({});

  // Delete Modal State
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status Banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchFacultiesData = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    getFaculties().then((result) => {
      if (result.success && result.data && result.data.length > 0) {
        setFaculties(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to Faculty Management service.');
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    getFaculties().then((result) => {
      if (!isMounted) return;
      if (result.success && result.data && result.data.length > 0) {
        setFaculties(result.data);
      } else {
        setFetchError(result.message || 'Unable to connect to Faculty Management service.');
      }
      setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter loaded faculties by search query (name or code)
  const filteredFaculties = useMemo(() => {
    if (!searchQuery.trim()) return faculties;
    const query = searchQuery.toLowerCase().trim();
    return faculties.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.code.toLowerCase().includes(query) ||
        (f.description && f.description.toLowerCase().includes(query))
    );
  }, [faculties, searchQuery]);

  const openCreateModal = () => {
    setEditingFaculty(null);
    setName('');
    setCode('');
    setDescription('');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setName(faculty.name || '');
    setCode(faculty.code || '');
    setDescription(faculty.description || '');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; code?: string } = {};

    if (!name.trim()) {
      errors.name = 'Faculty name is required.';
    }

    if (!code.trim()) {
      errors.code = 'Faculty code is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    const payload: FacultyCreatePayload = {
      name: name.trim(),
      code: code.trim(),
      description: description.trim() || undefined,
    };

    let result;
    if (editingFaculty) {
      result = await updateFaculty(editingFaculty.id, payload);
    } else {
      result = await createFaculty(payload);
    }

    if (result.success) {
      setSuccessMessage(result.message || 'Faculty saved successfully.');
      setIsFormModalOpen(false);
      fetchFacultiesData();
    } else {
      setSaveError(result.message || 'Failed to save faculty. Unable to connect to backend.');
    }

    setIsSaving(false);
  };

  const handleDeleteFaculty = async () => {
    if (!deletingFaculty) return;

    setIsDeleting(true);
    setDeleteError(null);
    setSuccessMessage(null);

    const result = await deleteFaculty(deletingFaculty.id);

    if (result.success) {
      setSuccessMessage('Faculty deleted successfully.');
      setDeletingFaculty(null);
      fetchFacultiesData();
    } else {
      setDeleteError(result.message || 'Failed to delete faculty. Unable to connect to backend.');
    }

    setIsDeleting(false);
  };

  return (
    <div className="faculties-container">
      {/* Alert Banners */}
      {successMessage && (
        <div className="faculties-alert faculties-alert-success" role="status">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header Card */}
      <Card>
        <div className="faculties-header-card">
          <div className="faculties-header-text">
            <h2 className="faculties-title">Faculty Management</h2>
            <p className="faculties-subtitle">
              Manage university faculties, organizational codes, and university directory structure.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            Add Faculty
          </Button>
        </div>
      </Card>

      {/* Search & Filter Bar */}
      {faculties.length > 0 && (
        <Card className="faculties-controls-card" style={{ padding: '1rem 1.5rem' }}>
          <div className="faculties-search-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="faculties-search-input" style={{ flex: 1 }}>
              <Input
                id="faculty-search-input"
                placeholder="Search faculties by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Content Area: Loading / Empty / Loaded States */}
      {isLoading ? (
        <LoadingState
          title="Loading University Faculties..."
          description="Retrieving faculty records from the university directory."
        />
      ) : faculties.length > 0 ? (
        <div className="faculties-grid">
          {filteredFaculties.map((faculty) => (
            <Card key={faculty.id} className="faculty-card">
              <CardBody>
                <div className="faculty-card-header">
                  <h3 className="faculty-name">{faculty.name}</h3>
                  <Badge variant="info">{faculty.code}</Badge>
                </div>
                <div className="faculty-meta">
                  {faculty.description && (
                    <p style={{ marginTop: '0.25rem', lineHeight: '1.5' }}>
                      {faculty.description}
                    </p>
                  )}
                </div>
                <div className="faculty-card-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={16} />}
                    onClick={() => openEditModal(faculty)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-danger"
                    icon={<Trash2 size={16} />}
                    onClick={() => {
                      setDeleteError(null);
                      setDeletingFaculty(faculty);
                    }}
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
          title="Faculty Management API Integration Pending"
          description={
            fetchError ||
            'The official backend Faculty Management API contract is not yet available in the repository. The faculty management interface and service layer boundary are prepared to connect to backend services.'
          }
          icon={<GraduationCap className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchFacultiesData}>
                Retry Connection
              </Button>
              <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                Open Create Modal
              </Button>
            </div>
          }
        />
      )}

      {/* Create / Edit Faculty Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
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
              onClick={handleSaveFaculty}
              isLoading={isSaving}
              icon={<GraduationCap size={16} />}
            >
              {editingFaculty ? 'Save Changes' : 'Create Faculty'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveFaculty} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {saveError && (
            <div className="faculties-alert faculties-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <Input
            id="faculty-name-input"
            label="Faculty Name"
            placeholder="e.g. Faculty of Science"
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
            id="faculty-code-input"
            label="Faculty Code"
            placeholder="e.g. FSC"
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
            id="faculty-description-input"
            label="Description (Optional)"
            placeholder="Brief overview of the faculty..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingFaculty)}
        onClose={() => setDeletingFaculty(null)}
        title="Delete Faculty"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingFaculty(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteFaculty}
              isLoading={isDeleting}
              icon={<Trash2 size={16} />}
            >
              Delete Faculty
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {deleteError && (
            <div className="faculties-alert faculties-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{deleteError}</span>
            </div>
          )}
          <p style={{ color: 'var(--color-neutral)', lineHeight: '1.6' }}>
            Are you sure you want to delete <strong>{deletingFaculty?.name}</strong>? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  Building2,
  X,
} from 'lucide-react';
import {
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  type FacultyCreatePayload,
  type FacultyUpdatePayload,
} from '@/services/facultyService';
import type { Faculty } from '@/types';
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
import './FacultiesPage.css';

export const FacultiesPage: React.FC = () => {
  const { isAuthorized, isAccountInactive } = useAuth();
  const canManageFaculties = isAuthorized(['ADMIN']) && !isAccountInactive;

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

  // Filter loaded faculties by search query
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

    if (editingFaculty) {
      const payload: FacultyUpdatePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
      };

      const result = await updateFaculty(editingFaculty.id, payload);

      if (result.success) {
        setSuccessMessage(result.message || 'Faculty updated successfully.');
        setIsFormModalOpen(false);
        fetchFacultiesData();
      } else {
        setSaveError(result.message || 'Failed to update faculty.');
      }
    } else {
      const payload: FacultyCreatePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
      };

      const result = await createFaculty(payload);

      if (result.success) {
        setSuccessMessage(result.message || 'Faculty created successfully.');
        setIsFormModalOpen(false);
        fetchFacultiesData();
      } else {
        setSaveError(result.message || 'Failed to create faculty.');
      }
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
      setDeleteError(result.message || 'Failed to delete faculty.');
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

      {/* Header Card */}
      <Card>
        <div className="faculties-header-card">
          <div className="faculties-header-text">
            <h2 className="faculties-title">Faculties Management</h2>
            <p className="faculties-subtitle">
              Manage university faculties, academic divisions, and departmental hierarchies.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/departments" style={{ textDecoration: 'none' }}>
              <Button variant="outline" icon={<Building2 size={16} />}>
                Manage Departments
              </Button>
            </Link>
            {canManageFaculties && (
              <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                Add Faculty
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Bar */}
      {faculties.length > 0 && (
        <div className="faculties-stats-bar">
          <div className="faculties-stat-pill">
            <div className="faculties-stat-pill-icon">
              <GraduationCap size={18} />
            </div>
            <div className="faculties-stat-pill-content">
              <span className="faculties-stat-pill-count">{faculties.length}</span>
              <span className="faculties-stat-pill-label">Registered Faculties</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Controls */}
      {faculties.length > 0 && (
        <Card className="faculties-controls-card">
          <div className="faculties-search-bar">
            <div className="faculties-search-input">
              <Input
                id="faculty-search-input"
                placeholder="Search faculties by name, code, or description..."
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
          title="Loading Faculties..."
          description="Retrieving faculty records from identity directory."
        />
      ) : faculties.length > 0 ? (
        filteredFaculties.length > 0 ? (
          <div className="faculties-grid">
            {filteredFaculties.map((faculty) => (
              <Card key={faculty.id} className="faculty-card">
                <CardBody>
                  <div className="faculty-card-header">
                    <h3 className="faculty-name">{faculty.name}</h3>
                    <Badge variant="neutral">{faculty.code}</Badge>
                  </div>

                  <div className="faculty-meta">
                    <p style={{ color: 'var(--color-neutral)', lineHeight: 1.4 }}>
                      {faculty.description || 'No description provided.'}
                    </p>
                  </div>

                  {canManageFaculties && (
                    <div className="faculty-card-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 size={15} />}
                        onClick={() => openEditModal(faculty)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="btn-danger"
                        icon={<Trash2 size={15} />}
                        onClick={() => setDeletingFaculty(faculty)}
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
                title="No Matching Faculties"
                description="No academic faculties match your search query."
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
          title="Faculty Management API Integration Pending"
          description={
            fetchError ||
            'The official backend Faculty Management API contract is not yet available in the repository. Faculty management interfaces and service boundaries are prepared to connect to backend services.'
          }
          icon={<GraduationCap className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchFacultiesData}>
                Retry Connection
              </Button>
              {canManageFaculties && (
                <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                  Add Faculty
                </Button>
              )}
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
            placeholder="e.g. FOS"
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
            placeholder="Brief overview of faculty scope"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </form>
      </Modal>

      {/* Delete Faculty Modal */}
      <Modal
        isOpen={Boolean(deletingFaculty)}
        onClose={() => setDeletingFaculty(null)}
        title="Confirm Faculty Deletion"
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
        {deleteError && (
          <div className="faculties-alert faculties-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} />
            <span>{deleteError}</span>
          </div>
        )}
        <p style={{ color: 'var(--color-neutral)', marginBottom: '1rem' }}>
          Are you sure you want to delete the faculty{' '}
          <strong>{deletingFaculty?.name}</strong> ({deletingFaculty?.code})?
        </p>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: '0.875rem' }}>
          This action will remove the faculty from the university directory.
        </div>
      </Modal>
    </div>
  );
};

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Building2, Plus, Edit2, Trash2, AlertCircle, CheckCircle, RefreshCw, Search, GraduationCap } from 'lucide-react';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/services/departmentService';
import { getFaculties } from '@/services/facultyService';
import type { Department, DepartmentCreatePayload, Faculty } from '@/types';
import { useAuth } from '@/auth';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  LoadingState,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import './DepartmentsPage.css';

/**
 * UNCONFIRMED PLACEHOLDER INTEGRATION BOUNDARY PENDING OFFICIAL BACKEND CONTRACT:
 * The official backend Department management contract and DTO schema are not yet documented in the repository.
 * Form fields and API interactions serve strictly as an integration boundary ready for official backend endpoints.
 */
export const DepartmentsPage: React.FC = () => {
  const { isAuthorized } = useAuth();
  const canManageDepartments = isAuthorized(['ADMIN']);

  // Data state
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [facultiesFetchError, setFacultiesFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [facultyId, setFacultyId] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; code?: string; facultyId?: string }>({});

  // Delete Modal State
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status Banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load departments and faculties (single source of truth for fetching data)
  const fetchData = useCallback(async () => {
    const [deptResult, facultyResult] = await Promise.all([
      getDepartments(),
      getFaculties(),
    ]);

    // A successful empty list is a valid empty state, not a connection error.
    if (facultyResult.success && facultyResult.data) {
      setFaculties(facultyResult.data);
      setFacultiesFetchError(null);
    } else {
      setFaculties([]);
      setFacultiesFetchError(
        facultyResult.message || 'Unable to load university faculties. Faculty selection may be restricted.'
      );
    }

    if (deptResult.success && deptResult.data) {
      setDepartments(deptResult.data);
      setFetchError(null);
    } else {
      setFetchError(deptResult.message || 'Unable to connect to Department Management service.');
    }

    setIsLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Map faculties to dropdown select options
  const facultyOptions = useMemo(() => {
    return faculties.map((faculty) => ({
      value: faculty.id,
      label: `${faculty.name} (${faculty.code})`,
    }));
  }, [faculties]);

  // Map of faculty ID to name for quick display lookup
  const facultyMap = useMemo(() => {
    const map = new Map<string, string>();
    faculties.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [faculties]);

  // Filter loaded departments by search query
  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const query = searchQuery.toLowerCase().trim();
    return departments.filter((dept) => {
      const resolvedFacultyName = dept.facultyName || facultyMap.get(dept.facultyId) || '';
      return (
        dept.name.toLowerCase().includes(query) ||
        dept.code.toLowerCase().includes(query) ||
        resolvedFacultyName.toLowerCase().includes(query) ||
        (dept.description && dept.description.toLowerCase().includes(query))
      );
    });
  }, [departments, searchQuery, facultyMap]);

  const openCreateModal = () => {
    if (!canManageDepartments) return;
    setEditingDepartment(null);
    setName('');
    setCode('');
    setFacultyId(faculties.length > 0 ? faculties[0].id : '');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (department: Department) => {
    if (!canManageDepartments) return;
    setEditingDepartment(department);
    setName(department.name || '');
    setCode(department.code || '');
    setFacultyId(department.facultyId || '');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: { name?: string; code?: string; facultyId?: string } = {};

    if (!name.trim()) {
      errors.name = 'Department name is required.';
    }

    if (!code.trim()) {
      errors.code = 'Department code is required.';
    }

    if (!facultyId.trim()) {
      errors.facultyId = 'Associated Faculty selection is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!canManageDepartments) {
      setSaveError('Unauthorized: Administrator permissions are required to perform this action.');
      return;
    }

    setSaveError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    const payload: DepartmentCreatePayload = {
      name: name.trim(),
      code: code.trim(),
      facultyId: facultyId.trim(),
    };

    let result;
    if (editingDepartment) {
      result = await updateDepartment(editingDepartment.id, payload);
    } else {
      result = await createDepartment(payload);
    }

    if (result.success) {
      setSuccessMessage(result.message || 'Department saved successfully.');
      setIsFormModalOpen(false);
      fetchData();
    } else {
      setSaveError(result.message || 'Failed to save department. Unable to connect to backend.');
    }

    setIsSaving(false);
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDepartment || isDeleting) return;
    if (!canManageDepartments) {
      setDeleteError('Unauthorized: Administrator permissions are required to perform this action.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    setSuccessMessage(null);

    const result = await deleteDepartment(deletingDepartment.id);

    if (result.success) {
      setSuccessMessage('Department deleted successfully.');
      setDeletingDepartment(null);
      fetchData();
    } else {
      setDeleteError(result.message || 'Failed to delete department. Unable to connect to backend.');
    }

    setIsDeleting(false);
  };

  return (
    <div className="departments-container">
      {/* Alert Banners */}
      {successMessage && (
        <div className="departments-alert departments-alert-success" role="status">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header Card */}
      <Card>
        <div className="departments-header-card">
          <div className="departments-header-text">
            <h2 className="departments-title">Department Management</h2>
            <p className="departments-subtitle">
              Manage academic departments, faculty affiliations, and organizational structures.
            </p>
          </div>
          {canManageDepartments && (
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={openCreateModal}
            >
              Add Department
            </Button>
          )}
        </div>
      </Card>

      {/* Search & Filter Bar */}
      {departments.length > 0 && (
        <Card className="departments-controls-card" style={{ padding: '1rem 1.5rem' }}>
          <div className="departments-search-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="departments-search-input" style={{ flex: 1 }}>
              <Input
                id="department-search-input"
                placeholder="Search departments by name, code, faculty, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>
          </div>
        </Card>
      )}

      {fetchError && departments.length > 0 && !isLoading && (
        <div className="departments-alert departments-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Content Area: Loading / Error / Empty / Loaded States */}
      {isLoading ? (
        <LoadingState
          title="Loading University Departments..."
          description="Retrieving department records and faculty affiliations from the directory."
        />
      ) : fetchError && departments.length === 0 ? (
        <ErrorState
          title="Unable to Load Departments"
          description={fetchError}
          onRetry={handleRetry}
        />
      ) : departments.length > 0 ? (
        <div className="departments-grid">
          {filteredDepartments.map((dept) => {
            const resolvedFacultyName = dept.facultyName || facultyMap.get(dept.facultyId);
            return (
              <Card key={dept.id} className="department-card">
                <CardBody>
                  <div className="department-card-header">
                    <h3 className="department-name">{dept.name}</h3>
                    <Badge variant="info">{dept.code}</Badge>
                  </div>
                  <div className="department-meta">
                    <div className="department-meta-item">
                      <GraduationCap size={15} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: 500 }}>
                        {resolvedFacultyName ? resolvedFacultyName : `Faculty ID: ${dept.facultyId}`}
                      </span>
                    </div>
                    {dept.description && (
                      <p style={{ marginTop: '0.5rem', lineHeight: '1.5' }}>
                        {dept.description}
                      </p>
                    )}
                  </div>
                  {canManageDepartments && (
                    <div className="department-card-actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit2 size={16} />}
                        onClick={() => openEditModal(dept)}
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
                          setDeletingDepartment(dept);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Departments Found"
          description="The Department Management service returned no records."
          icon={<Building2 className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={handleRetry}>
                Refresh
              </Button>
              {canManageDepartments && (
                <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
                  Add Department
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Create / Edit Department Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => {
          if (!isSaving) setIsFormModalOpen(false);
        }}
        title={editingDepartment ? 'Edit Department' : 'Add New Department'}
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
              onClick={handleSaveDepartment}
              isLoading={isSaving}
              icon={<Building2 size={16} />}
            >
              {editingDepartment ? 'Save Changes' : 'Create Department'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveDepartment} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {saveError && (
            <div className="departments-alert departments-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{saveError}</span>
            </div>
          )}

          <Input
            id="department-name-input"
            label="Department Name"
            placeholder="e.g. Department of Computer Science"
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
            id="department-code-input"
            label="Department Code"
            placeholder="e.g. DCS"
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

          <Select
            id="department-faculty-select"
            label="Associated Faculty"
            options={facultyOptions}
            placeholder={
              facultiesFetchError
                ? 'Faculties API unavailable'
                : facultyOptions.length === 0
                ? 'No faculties available'
                : 'Select associated faculty...'
            }
            value={facultyId}
            onChange={(e) => {
              setFacultyId(e.target.value);
              if (fieldErrors.facultyId) {
                setFieldErrors((prev) => ({ ...prev, facultyId: undefined }));
              }
            }}
            error={fieldErrors.facultyId || (facultiesFetchError ? facultiesFetchError : undefined)}
            disabled={isSaving || facultyOptions.length === 0}
            required
          />
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingDepartment)}
        onClose={() => {
          if (!isDeleting) setDeletingDepartment(null);
        }}
        title="Delete Department"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeletingDepartment(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteDepartment}
              isLoading={isDeleting}
              icon={<Trash2 size={16} />}
            >
              Delete Department
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {deleteError && (
            <div className="departments-alert departments-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{deleteError}</span>
            </div>
          )}
          <p style={{ color: 'var(--color-neutral)', lineHeight: '1.6' }}>
            Are you sure you want to delete <strong>{deletingDepartment?.name}</strong>? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

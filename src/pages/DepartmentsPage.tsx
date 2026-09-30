import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
  GraduationCap,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type DepartmentCreatePayload,
  type DepartmentUpdatePayload,
} from '@/services/departmentService';
import { getFaculties } from '@/services/facultyService';
import type { Department, Faculty } from '@/types';
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
} from '@/components/ui';
import './DepartmentsPage.css';

export const DepartmentsPage: React.FC = () => {
  const { isAuthorized, isAccountInactive } = useAuth();
  const canManageDepartments = isAuthorized(['ADMIN']) && !isAccountInactive;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Form Modal State (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [facultyId, setFacultyId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; code?: string; facultyId?: string }>({});

  // Delete Modal State
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Status Banners
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchDepartmentsData = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);

    Promise.all([getDepartments(), getFaculties()])
      .then(([deptRes, facRes]) => {
        if (deptRes.success && deptRes.data && deptRes.data.length > 0) {
          setDepartments(deptRes.data);
        } else {
          setFetchError(deptRes.message || 'Unable to connect to Department Management service.');
        }

        if (facRes.success && facRes.data) {
          setFaculties(facRes.data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setFetchError('Unable to connect to Department Management service.');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getDepartments(), getFaculties()]).then(([deptRes, facRes]) => {
      if (!isMounted) return;
      if (deptRes.success && deptRes.data && deptRes.data.length > 0) {
        setDepartments(deptRes.data);
      } else {
        setFetchError(deptRes.message || 'Unable to connect to Department Management service.');
      }

      if (facRes.success && facRes.data) {
        setFaculties(facRes.data);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const totalDepartments = departments.length;
    const uniqueFacultiesCount = new Set(departments.map((d) => d.facultyId)).size;
    return { totalDepartments, uniqueFacultiesCount };
  }, [departments]);

  // Client-side filtering
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        dept.name.toLowerCase().includes(query) ||
        dept.code.toLowerCase().includes(query) ||
        (dept.description && dept.description.toLowerCase().includes(query));

      const matchesFaculty =
        selectedFacultyFilter === 'ALL' || dept.facultyId === selectedFacultyFilter;

      return matchesSearch && matchesFaculty;
    });
  }, [departments, searchQuery, selectedFacultyFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedFacultyFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedFacultyFilter('ALL');
  };

  const openCreateModal = () => {
    setEditingDepartment(null);
    setName('');
    setCode('');
    setFacultyId(faculties.length > 0 ? faculties[0].id : '');
    setDescription('');
    setFieldErrors({});
    setSaveError(null);
    setSuccessMessage(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDepartment(dept);
    setName(dept.name || '');
    setCode(dept.code || '');
    setFacultyId(dept.facultyId || (faculties.length > 0 ? faculties[0].id : ''));
    setDescription(dept.description || '');
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

    if (!facultyId) {
      errors.facultyId = 'Parent faculty selection is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    if (editingDepartment) {
      const payload: DepartmentUpdatePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        facultyId,
        description: description.trim() || undefined,
      };

      const result = await updateDepartment(editingDepartment.id, payload);

      if (result.success) {
        setSuccessMessage(result.message || 'Department updated successfully.');
        setIsFormModalOpen(false);
        fetchDepartmentsData();
      } else {
        setSaveError(result.message || 'Failed to update department.');
      }
    } else {
      const payload: DepartmentCreatePayload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        facultyId,
        description: description.trim() || undefined,
      };

      const result = await createDepartment(payload);

      if (result.success) {
        setSuccessMessage(result.message || 'Department created successfully.');
        setIsFormModalOpen(false);
        fetchDepartmentsData();
      } else {
        setSaveError(result.message || 'Failed to create department.');
      }
    }

    setIsSaving(false);
  };

  const handleDeleteDepartment = async () => {
    if (!deletingDepartment) return;

    setIsDeleting(true);
    setDeleteError(null);
    setSuccessMessage(null);

    const result = await deleteDepartment(deletingDepartment.id);

    if (result.success) {
      setSuccessMessage('Department deleted successfully.');
      setDeletingDepartment(null);
      fetchDepartmentsData();
    } else {
      setDeleteError(result.message || 'Failed to delete department.');
    }

    setIsDeleting(false);
  };

  const getFacultyName = (facId: string): string => {
    const fac = faculties.find((f) => f.id === facId);
    return fac ? fac.name : facId;
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

      {/* Header Card */}
      <Card>
        <div className="departments-header-card">
          <div className="departments-header-text">
            <h2 className="departments-title">Academic Departments Management</h2>
            <p className="departments-subtitle">
              Manage academic departments, faculty associations, and departmental organizational directory.
            </p>
          </div>
          {canManageDepartments && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={openCreateModal}>
              Add Department
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Bar */}
      {departments.length > 0 && (
        <div className="departments-stats-bar">
          <div className="departments-stat-pill">
            <div className="departments-stat-pill-icon">
              <Building2 size={18} />
            </div>
            <div className="departments-stat-pill-content">
              <span className="departments-stat-pill-count">{stats.totalDepartments}</span>
              <span className="departments-stat-pill-label">Total Departments</span>
            </div>
          </div>

          <div className="departments-stat-pill">
            <div className="departments-stat-pill-icon" style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
              <GraduationCap size={18} />
            </div>
            <div className="departments-stat-pill-content">
              <span className="departments-stat-pill-count">{faculties.length}</span>
              <span className="departments-stat-pill-label">Affiliated Faculties</span>
            </div>
          </div>
        </div>
      )}

      {/* Search & Faculty Filter Bar */}
      {departments.length > 0 && (
        <Card className="departments-controls-card">
          <div className="departments-search-bar">
            <div className="departments-search-input">
              <Input
                id="department-search-input"
                placeholder="Search departments by name, code, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search size={18} />}
              />
            </div>

            {faculties.length > 0 && (
              <div style={{ minWidth: '200px' }}>
                <Select
                  id="faculty-filter-select"
                  value={selectedFacultyFilter}
                  onChange={(e) => setSelectedFacultyFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Faculties' },
                    ...faculties.map((f) => ({ value: f.id, label: f.name })),
                  ]}
                />
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={resetFilters}>
                Clear
              </Button>
            )}
          </div>

          <div className="departments-results-bar">
            <span>
              Showing <strong>{filteredDepartments.length}</strong> of <strong>{departments.length}</strong> departments
            </span>
            <div className="departments-view-toggle">
              <button
                type="button"
                className={`departments-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                title="Grid Card View"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={`departments-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                title="Table List View"
                onClick={() => setViewMode('table')}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Content Area */}
      {isLoading ? (
        <LoadingState
          title="Loading Departments..."
          description="Retrieving academic department records from identity directory."
        />
      ) : departments.length > 0 ? (
        filteredDepartments.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="departments-grid">
              {filteredDepartments.map((dept) => (
                <Card key={dept.id} className="department-card">
                  <CardBody>
                    <div className="department-card-header">
                      <div className="department-identity">
                        <h3 className="department-name">{dept.name}</h3>
                        <div className="department-faculty-badge">
                          <GraduationCap size={13} />
                          <span>{getFacultyName(dept.facultyId)}</span>
                        </div>
                      </div>
                      <Badge variant="neutral">{dept.code}</Badge>
                    </div>

                    <p className="department-description">
                      {dept.description || 'No description provided for this academic department.'}
                    </p>

                    {canManageDepartments && (
                      <div className="department-card-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 size={15} />}
                          onClick={() => openEditModal(dept)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="btn-danger"
                          icon={<Trash2 size={15} />}
                          onClick={() => setDeletingDepartment(dept)}
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
            <div className="departments-table-wrapper">
              <table className="departments-table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Code</th>
                    <th>Parent Faculty</th>
                    <th>Description</th>
                    {canManageDepartments && <th style={{ textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map((dept) => (
                    <tr key={dept.id}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{dept.name}</span>
                      </td>
                      <td>
                        <Badge variant="neutral">{dept.code}</Badge>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <GraduationCap size={14} color="var(--color-primary)" />
                          <span>{getFacultyName(dept.facultyId)}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--color-neutral)' }}>
                          {dept.description || '—'}
                        </span>
                      </td>
                      {canManageDepartments && (
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.375rem' }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Edit2 size={14} />}
                              onClick={() => openEditModal(dept)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="btn-danger"
                              icon={<Trash2 size={14} />}
                              onClick={() => setDeletingDepartment(dept)}
                            >
                              Del
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                title="No Matching Departments"
                description="No academic departments match your current search criteria."
                icon={<Search className="state-icon" />}
                action={
                  <Button variant="outline" icon={<RefreshCw size={16} />} onClick={resetFilters}>
                    Reset Search Filters
                  </Button>
                }
              />
            </CardBody>
          </Card>
        )
      ) : (
        <EmptyState
          title="Department Management API Integration Pending"
          description={
            fetchError ||
            'The official backend Department Management API contract is not yet available in the repository. Department management interfaces and service boundaries are prepared to connect to backend services.'
          }
          icon={<Building2 className="state-icon" />}
          action={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Button variant="outline" icon={<RefreshCw size={16} />} onClick={fetchDepartmentsData}>
                Retry Connection
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
        onClose={() => setIsFormModalOpen(false)}
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
            label="Parent Faculty"
            value={facultyId}
            onChange={(e) => {
              setFacultyId(e.target.value);
              if (fieldErrors.facultyId) {
                setFieldErrors((prev) => ({ ...prev, facultyId: undefined }));
              }
            }}
            error={fieldErrors.facultyId}
            options={
              faculties.length > 0
                ? faculties.map((f) => ({ value: f.id, label: `${f.name} (${f.code})` }))
                : [{ value: '', label: 'No faculties available' }]
            }
            required
          />

          <Input
            id="department-description-input"
            label="Description (Optional)"
            placeholder="Brief overview of department scope"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
          />
        </form>
      </Modal>

      {/* Delete Department Modal */}
      <Modal
        isOpen={Boolean(deletingDepartment)}
        onClose={() => setDeletingDepartment(null)}
        title="Confirm Department Deletion"
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
        {deleteError && (
          <div className="departments-alert departments-alert-error" role="alert" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={18} />
            <span>{deleteError}</span>
          </div>
        )}
        <p style={{ color: 'var(--color-neutral)', marginBottom: '1rem' }}>
          Are you sure you want to delete the department{' '}
          <strong>{deletingDepartment?.name}</strong> ({deletingDepartment?.code})?
        </p>
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-text)', fontSize: '0.875rem' }}>
          This action will remove the departmental unit from the university directory.
        </div>
      </Modal>
    </div>
  );
};

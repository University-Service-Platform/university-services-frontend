import React, { useEffect, useState, useCallback } from 'react';
import { Building2, Plus, Edit, Check, X, ShieldAlert, Cpu } from 'lucide-react';
import { facilityService } from '@/services/group6/facilityService';
import { resourceService } from '@/services/group6/resourceService';
import type { Facility, Resource, CreateFacilityRequest, CreateResourceRequest } from '@/types/group6';
import { LoadingState, ErrorState, Button, Badge, Modal } from '@/components/ui';
import '@/components/group6/group6.css';

export const ManageFacilitiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'facilities' | 'resources'>('facilities');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Facility Form Modal State
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [facForm, setFacForm] = useState<CreateFacilityRequest>({
    code: '',
    name: '',
    location: '',
    description: '',
    operatingHoursStart: '08:00:00',
    operatingHoursEnd: '22:00:00',
    active: true,
  });

  // Resource Form Modal State
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resForm, setResForm] = useState<CreateResourceRequest>({
    facilityId: 0,
    code: '',
    name: '',
    resourceType: 'LAB',
    location: '',
    capacity: 20,
    active: true,
    available: true,
    approvalRequired: false,
    operatingHoursStart: '08:00:00',
    operatingHoursEnd: '20:00:00',
    rulesDescription: '',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [facRes, resRes] = await Promise.all([
        facilityService.getFacilities(),
        resourceService.getResources(),
      ]);

      if (facRes.error) {
        setError(facRes.error);
        return;
      }
      if (resRes.error) {
        setError(resRes.error);
        return;
      }

      setFacilities(facRes.data || []);
      setResources(resRes.data || []);
    } catch {
      setError('Failed to fetch facilities and resources.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void loadData();
  }, [loadData]);

  // Facility Form Handlers
  const openCreateFacilityModal = () => {
    setEditingFacility(null);
    setFacForm({
      code: '',
      name: '',
      location: '',
      description: '',
      operatingHoursStart: '08:00:00',
      operatingHoursEnd: '22:00:00',
      active: true,
    });
    setFormError(null);
    setIsFacilityModalOpen(true);
  };

  const openEditFacilityModal = (f: Facility) => {
    setEditingFacility(f);
    setFacForm({
      code: f.code,
      name: f.name,
      location: f.location,
      description: f.description || '',
      operatingHoursStart: f.operatingHoursStart,
      operatingHoursEnd: f.operatingHoursEnd,
      active: f.active,
    });
    setFormError(null);
    setIsFacilityModalOpen(true);
  };

  const handleFacilitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingFacility) {
        const res = await facilityService.updateFacility(editingFacility.id, facForm);
        if (res.error) {
          setFormError(res.error);
          return;
        }
      } else {
        const res = await facilityService.createFacility(facForm);
        if (res.error) {
          setFormError(res.error);
          return;
        }
      }
      setIsFacilityModalOpen(false);
      loadData();
    } catch {
      setFormError('Failed to save facility.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleFacilityStatus = async (id: number) => {
    try {
      await facilityService.toggleStatus(id);
      loadData();
    } catch {
      // Best effort reload
      loadData();
    }
  };

  // Resource Form Handlers
  const openCreateResourceModal = () => {
    setEditingResource(null);
    setResForm({
      facilityId: facilities[0]?.id || 1,
      code: '',
      name: '',
      resourceType: 'LAB',
      location: '',
      capacity: 20,
      active: true,
      available: true,
      approvalRequired: false,
      operatingHoursStart: '08:00:00',
      operatingHoursEnd: '20:00:00',
      rulesDescription: '',
    });
    setFormError(null);
    setIsResourceModalOpen(true);
  };

  const openEditResourceModal = (r: Resource) => {
    setEditingResource(r);
    setResForm({
      facilityId: r.facilityId,
      code: r.code,
      name: r.name,
      resourceType: r.resourceType,
      location: r.location,
      capacity: r.capacity,
      active: r.active,
      available: r.available,
      approvalRequired: r.approvalRequired,
      operatingHoursStart: r.operatingHoursStart || '08:00:00',
      operatingHoursEnd: r.operatingHoursEnd || '20:00:00',
      rulesDescription: r.rulesDescription || '',
    });
    setFormError(null);
    setIsResourceModalOpen(true);
  };

  const handleResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingResource) {
        const res = await resourceService.updateResource(editingResource.id, resForm);
        if (res.error) {
          setFormError(res.error);
          return;
        }
      } else {
        const res = await resourceService.createResource(resForm);
        if (res.error) {
          setFormError(res.error);
          return;
        }
      }
      setIsResourceModalOpen(false);
      loadData();
    } catch {
      setFormError('Failed to save resource.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const toggleResourceAvailability = async (id: number) => {
    try {
      await resourceService.toggleAvailability(id);
      loadData();
    } catch {
      loadData();
    }
  };

  const toggleResourceApproval = async (id: number) => {
    try {
      await resourceService.toggleApprovalRequirement(id);
      loadData();
    } catch {
      loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="g6-container">
        <LoadingState title="Loading Management Portal" description="Retrieving facilities and inventory..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="g6-container">
        <ErrorState
          title="Management Error"
          description={error}
          onRetry={loadData}
        />
      </div>
    );
  }

  return (
    <div className="g6-container">
      <div className="g6-header">
        <div>
          <h1 className="g6-title">Facility & Resource Management</h1>
          <p className="g6-subtitle">Configure buildings, rooms, active inventory, and booking rules.</p>
        </div>
        <div className="g6-actions">
          {activeTab === 'facilities' ? (
            <Button icon={<Plus size={16} />} onClick={openCreateFacilityModal}>
              New Facility
            </Button>
          ) : (
            <Button icon={<Plus size={16} />} onClick={openCreateResourceModal}>
              New Resource
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
        <button
          onClick={() => setActiveTab('facilities')}
          style={{
            padding: '0.625rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'facilities' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'facilities' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Building2 size={16} /> Facilities ({facilities.length})
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          style={{
            padding: '0.625rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'resources' ? '2px solid #2563eb' : '2px solid transparent',
            color: activeTab === 'resources' ? '#2563eb' : '#64748b',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Cpu size={16} /> Resources ({resources.length})
        </button>
      </div>

      {/* Facilities Tab Content */}
      {activeTab === 'facilities' && (
        <div className="g6-table-container">
          <table className="g6-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Location</th>
                <th>Operating Hours</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600, color: '#475569' }}>{f.code}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{f.name}</td>
                  <td>{f.location}</td>
                  <td>{f.operatingHoursStart.slice(0, 5)} - {f.operatingHoursEnd.slice(0, 5)}</td>
                  <td>
                    <Badge variant={f.active ? 'success' : 'neutral'}>
                      {f.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFacilityStatus(f.id)}
                      >
                        {f.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => openEditFacilityModal(f)}
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resources Tab Content */}
      {activeTab === 'resources' && (
        <div className="g6-table-container">
          <table className="g6-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Facility</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Available</th>
                <th>Approval Req.</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => {
                const fac = facilities.find((f) => f.id === r.facilityId);

                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: '#475569' }}>{r.code}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{r.name}</td>
                    <td>{fac?.name || `Facility #${r.facilityId}`}</td>
                    <td><Badge variant="neutral">{r.resourceType}</Badge></td>
                    <td>{r.capacity}</td>
                    <td>
                      <Button
                        size="sm"
                        variant={r.available ? 'outline' : 'ghost'}
                        onClick={() => toggleResourceAvailability(r.id)}
                        icon={r.available ? <Check size={14} color="#16a34a" /> : <X size={14} color="#dc2626" />}
                      >
                        {r.available ? 'Yes' : 'No'}
                      </Button>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant={r.approvalRequired ? 'outline' : 'ghost'}
                        onClick={() => toggleResourceApproval(r.id)}
                        icon={r.approvalRequired ? <ShieldAlert size={14} color="#d97706" /> : undefined}
                      >
                        {r.approvalRequired ? 'Required' : 'Direct'}
                      </Button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => openEditResourceModal(r)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Facility Create/Edit Modal */}
      <Modal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
        title={editingFacility ? 'Edit Facility' : 'Create New Facility'}
      >
        <form onSubmit={handleFacilitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Code *</label>
            <input
              type="text"
              required
              value={facForm.code}
              onChange={(e) => setFacForm({ ...facForm, code: e.target.value })}
              placeholder="e.g. ENG-BLDG-A"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Name *</label>
            <input
              type="text"
              required
              value={facForm.name}
              onChange={(e) => setFacForm({ ...facForm, name: e.target.value })}
              placeholder="e.g. Engineering Complex - Block A"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Location *</label>
            <input
              type="text"
              required
              value={facForm.location}
              onChange={(e) => setFacForm({ ...facForm, location: e.target.value })}
              placeholder="e.g. North Campus, Sector 4"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Operating Hours Start *</label>
              <input
                type="text"
                required
                value={facForm.operatingHoursStart}
                onChange={(e) => setFacForm({ ...facForm, operatingHoursStart: e.target.value })}
                placeholder="08:00:00"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Operating Hours End *</label>
              <input
                type="text"
                required
                value={facForm.operatingHoursEnd}
                onChange={(e) => setFacForm({ ...facForm, operatingHoursEnd: e.target.value })}
                placeholder="22:00:00"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Description</label>
            <textarea
              rows={2}
              value={facForm.description || ''}
              onChange={(e) => setFacForm({ ...facForm, description: e.target.value })}
              placeholder="Optional overview of the facility..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontFamily: 'inherit' }}
            />
          </div>

          {formError && (
            <div style={{ padding: '0.5rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="outline" type="button" onClick={() => setIsFacilityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : 'Save Facility'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resource Create/Edit Modal */}
      <Modal
        isOpen={isResourceModalOpen}
        onClose={() => setIsResourceModalOpen(false)}
        title={editingResource ? 'Edit Resource' : 'Create New Resource'}
      >
        <form onSubmit={handleResourceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Facility *</label>
            <select
              value={resForm.facilityId}
              onChange={(e) => setResForm({ ...resForm, facilityId: Number(e.target.value) })}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', background: '#fff' }}
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Code *</label>
              <input
                type="text"
                required
                value={resForm.code}
                onChange={(e) => setResForm({ ...resForm, code: e.target.value })}
                placeholder="e.g. LAB-101"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Type *</label>
              <select
                value={resForm.resourceType}
                onChange={(e) => setResForm({ ...resForm, resourceType: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', background: '#fff' }}
              >
                <option value="LAB">LAB</option>
                <option value="HALL">HALL</option>
                <option value="ROOM">ROOM</option>
                <option value="EQUIPMENT">EQUIPMENT</option>
                <option value="SPORTS">SPORTS</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Name *</label>
            <input
              type="text"
              required
              value={resForm.name}
              onChange={(e) => setResForm({ ...resForm, name: e.target.value })}
              placeholder="e.g. High Performance Computing Lab"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Location *</label>
              <input
                type="text"
                required
                value={resForm.location}
                onChange={(e) => setResForm({ ...resForm, location: e.target.value })}
                placeholder="e.g. Room A-101"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Capacity (≥1) *</label>
              <input
                type="number"
                min="1"
                required
                value={resForm.capacity}
                onChange={(e) => setResForm({ ...resForm, capacity: Number(e.target.value) })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Rules & Policies</label>
            <textarea
              rows={2}
              value={resForm.rulesDescription || ''}
              onChange={(e) => setResForm({ ...resForm, rulesDescription: e.target.value })}
              placeholder="e.g. Requires lab supervisor accompaniment after 18:00"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.375rem', fontFamily: 'inherit' }}
            />
          </div>

          {formError && (
            <div style={{ padding: '0.5rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="outline" type="button" onClick={() => setIsResourceModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={formSubmitting}>
              {formSubmitting ? 'Saving...' : 'Save Resource'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

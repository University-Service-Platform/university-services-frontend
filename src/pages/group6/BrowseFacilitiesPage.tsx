import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Clock, MapPin, Users, CalendarPlus, Search } from 'lucide-react';
import { facilityService } from '@/services/group6/facilityService';
import { resourceService } from '@/services/group6/resourceService';
import type { Facility, Resource } from '@/types/group6';
import { LoadingState, ErrorState, EmptyState, Button, Badge } from '@/components/ui';
import '@/components/group6/group6.css';

export const BrowseFacilitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

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
      setError('Failed to connect to facility services.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    void loadData();
  }, [loadData]);

  // Filter facilities and their resources
  const filteredFacilities = facilities.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.location.toLowerCase().includes(searchQuery.toLowerCase());
    return f.active && matchesSearch;
  });

  const getResourcesForFacility = (facilityId: number) => {
    return resources.filter((r) => {
      if (r.facilityId !== facilityId || !r.active) return false;
      if (selectedType !== 'ALL' && r.resourceType !== selectedType) return false;
      return true;
    });
  };

  const resourceTypes = Array.from(new Set(resources.map((r) => r.resourceType).filter(Boolean)));

  if (isLoading) {
    return (
      <div className="g6-container">
        <LoadingState title="Loading Facilities" description="Fetching campus facilities and resources..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="g6-container">
        <ErrorState
          title="Unable to Load Facilities"
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
          <h1 className="g6-title">Campus Facilities & Resources</h1>
          <p className="g6-subtitle">
            Browse university spaces, view operating hours, and book resources for academic and group use.
          </p>
        </div>
        <div className="g6-actions">
          <Button
            icon={<CalendarPlus size={16} />}
            onClick={() => navigate('/reservations/new')}
          >
            New Reservation
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="g6-filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search facility name, code, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #cbd5e1',
              borderRadius: '0.375rem',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            fontSize: '0.9rem',
            background: '#ffffff',
          }}
        >
          <option value="ALL">All Resource Types</option>
          {resourceTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {filteredFacilities.length === 0 ? (
        <EmptyState
          title="No Facilities Found"
          description="There are currently no active facilities matching your search criteria."
          action={<Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedType('ALL'); }}>Clear Filters</Button>}
        />
      ) : (
        <div className="g6-grid">
          {filteredFacilities.map((facility) => {
            const facResources = getResourcesForFacility(facility.id);

            return (
              <div key={facility.id} className="g6-card">
                <div className="g6-card-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <Building2 size={20} color="#2563eb" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                        {facility.name}
                      </h3>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                      Code: {facility.code}
                    </span>
                  </div>
                  <Badge variant={facility.active ? 'success' : 'neutral'}>
                    {facility.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="g6-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem' }}>
                    <MapPin size={15} color="#64748b" />
                    <span>{facility.location}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.85rem' }}>
                    <Clock size={15} color="#64748b" />
                    <span>
                      Hours: {facility.operatingHoursStart.slice(0, 5)} - {facility.operatingHoursEnd.slice(0, 5)}
                    </span>
                  </div>

                  {facility.description && (
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0' }}>
                      {facility.description}
                    </p>
                  )}

                  <div style={{ marginTop: '0.5rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      Available Resources ({facResources.length})
                    </h4>

                    {facResources.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No matching resources listed under this facility.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {facResources.map((res) => (
                          <div key={res.id} className="g6-resource-item">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                                {res.name}
                              </span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                                <span>{res.resourceType}</span>
                                <span>•</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Users size={12} /> Cap: {res.capacity}
                                </span>
                                {res.approvalRequired && (
                                  <>
                                    <span>•</span>
                                    <span style={{ color: '#d97706', fontWeight: 500 }}>Approval Req.</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant={res.available ? 'primary' : 'outline'}
                              disabled={!res.available}
                              onClick={() => navigate(`/reservations/new?resourceId=${res.id}`)}
                            >
                              {res.available ? 'Book' : 'Unavailable'}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

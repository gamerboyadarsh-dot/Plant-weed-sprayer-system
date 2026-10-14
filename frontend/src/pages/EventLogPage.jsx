import React, { useState, useEffect, useMemo } from 'react';
import { Card, Badge, Button, EmptyState } from '../components/ui/BasicUI';
import { fetchEvents } from '../api/client';
import { Download, Search, ChevronLeft, ChevronRight, ArrowUpDown, X, ExternalLink } from 'lucide-react';
import { BirchLeaf } from '../components/leaves/LeafIcons';

export function EventLogPage({ onNavigatePipeline }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state: default hides NO_CANDIDATE
  const [filter, setFilter] = useState('ALL_VALID'); // 'ALL_VALID' | 'FIRE' | 'SUPPRESS' | 'NO_CANDIDATE' | 'ALL'
  const [search, setSearch] = useState('');

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;
  const [sortField, setSortField] = useState('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  // Selected event side drawer inspection
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents()
      .then(res => {
        if (res && res.events) {
          setEvents(res.events);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load events:', err);
        setLoading(false);
      });
  }, []);

  // Category counts
  const counts = useMemo(() => {
    const fireCount = events.filter(e => e.decision === 'FIRE').length;
    const suppressCount = events.filter(e => e.decision === 'SUPPRESS').length;
    const noCandCount = events.filter(e => e.decision === 'NO_CANDIDATE' || !e.decision).length;
    return {
      allValid: fireCount + suppressCount,
      fire: fireCount,
      suppress: suppressCount,
      noCand: noCandCount,
      total: events.length
    };
  }, [events]);

  // Overall volume delivered
  const totalVolumeMl = useMemo(() => {
    return events.reduce((acc, curr) => acc + (parseFloat(curr.dose_volume_ml) || 0), 0);
  }, [events]);

  // Filtered & Sorted events
  const processedEvents = useMemo(() => {
    let result = events.filter(ev => {
      let matchFilter = true;
      if (filter === 'ALL_VALID') matchFilter = ev.decision === 'FIRE' || ev.decision === 'SUPPRESS';
      else if (filter === 'FIRE') matchFilter = ev.decision === 'FIRE';
      else if (filter === 'SUPPRESS') matchFilter = ev.decision === 'SUPPRESS';
      else if (filter === 'NO_CANDIDATE') matchFilter = ev.decision === 'NO_CANDIDATE' || !ev.decision;

      const matchSearch =
        !search ||
        (ev.image_name && ev.image_name.toLowerCase().includes(search.toLowerCase())) ||
        (ev.timestamp && ev.timestamp.toLowerCase().includes(search.toLowerCase()));

      return matchFilter && matchSearch;
    });

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [events, filter, search, sortField, sortAsc]);

  // Pagination slice
  const totalPages = Math.ceil(processedEvents.length / pageSize) || 1;
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedEvents.slice(start, start + pageSize);
  }, [processedEvents, currentPage]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCSV = () => {
    if (events.length === 0) return;
    const headers = Object.keys(events[0]).join(',');
    const rows = events.map(ev => Object.values(ev).map(val => `"${val}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'telemetry_events.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {/* Summary KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <Card style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Executions</div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {counts.total}
          </div>
        </Card>

        <Card style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fire Actuations</div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--leaf-green)', marginTop: '4px' }}>
            {counts.fire}
          </div>
        </Card>

        <Card style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Suppressed (Crops/Debris)</div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--bark-brown)', marginTop: '4px' }}>
            {counts.suppress}
          </div>
        </Card>

        <Card style={{ padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Volume Delivered</div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {totalVolumeMl.toFixed(3)} mL
          </div>
        </Card>
      </div>

      {/* Controls & Filter Bar */}
      <Card style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Decision Filter Chips with Counts */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            {[
              { id: 'ALL_VALID', label: 'All Candidates', count: counts.allValid },
              { id: 'FIRE', label: 'Fire', count: counts.fire },
              { id: 'SUPPRESS', label: 'Suppress', count: counts.suppress },
              { id: 'NO_CANDIDATE', label: 'No Candidate', count: counts.noCand },
              { id: 'ALL', label: 'All Rows', count: counts.total }
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setFilter(chip.id);
                  setCurrentPage(1);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: filter === chip.id ? 'var(--leaf-green)' : 'var(--border-subtle)',
                  background: filter === chip.id ? 'var(--leaf-green-subtle)' : 'var(--bg-surface-2)',
                  color: filter === chip.id ? 'var(--leaf-green)' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <span>{chip.label}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    opacity: 0.8
                  }}
                >
                  {chip.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search bar & Export */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search frame or time..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 12px 6px 30px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-xs)',
                  width: '180px'
                }}
              />
            </div>

            <Button size="sm" variant="subtle" icon={Download} onClick={handleExportCSV}>
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {/* Events Telemetry Table */}
      <Card header={`Telemetry Events (${processedEvents.length})`}>
        {paginatedEvents.length === 0 ? (
          <EmptyState
            title="No events matching criteria"
            message="Clear search filters or run pipeline detections to record telemetry."
            icon={BirchLeaf}
          />
        ) : (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '10px', cursor: 'pointer' }} onClick={() => toggleSort('timestamp')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Timestamp</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ padding: '10px', cursor: 'pointer' }} onClick={() => toggleSort('image_name')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Frame</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>ID</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Area</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Centroid</th>
                    <th style={{ padding: '10px' }}>Decision</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Burst</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Dose</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Coords (mm)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedEvents.map((ev, i) => {
                    const isFire = ev.decision === 'FIRE';
                    const isSuppress = ev.decision === 'SUPPRESS';
                    const isNoCandidate = !ev.decision || ev.decision === 'NO_CANDIDATE';

                    return (
                      <tr
                        key={i}
                        onClick={() => setSelectedEvent(ev)}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {ev.timestamp ? ev.timestamp.substring(11, 19) : '-'}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {ev.image_name || '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          #{ev.candidate_id ?? 0}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {ev.area ? `${Math.round(ev.area).toLocaleString()} px²` : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {ev.centroid_px || '-'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <Badge
                            variant={isFire ? 'fire' : isSuppress ? 'suppress' : 'neutral'}
                            style={{
                              border: isNoCandidate ? 'none' : undefined,
                              background: isNoCandidate ? 'transparent' : undefined,
                              color: isNoCandidate ? 'var(--text-muted)' : undefined
                            }}
                          >
                            {ev.decision || 'NO_CANDIDATE'}
                          </Badge>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: isFire ? 'var(--leaf-green)' : 'inherit' }}>
                          {ev.burst_duration_ms ? `${Math.round(ev.burst_duration_ms)} ms` : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {ev.dose_volume_ml ? `${Number(ev.dose_volume_ml).toFixed(3)} mL` : '-'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {ev.target_coords_mm || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, processedEvents.length)} of {processedEvents.length}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Button
                  size="sm"
                  variant="subtle"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  icon={ChevronLeft}
                >
                  Prev
                </Button>

                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {currentPage} / {totalPages}
                </span>

                <Button
                  size="sm"
                  variant="subtle"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Side Inspection Drawer when row is clicked */}
      {selectedEvent && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '380px',
            background: 'var(--bg-surface-1)',
            borderLeft: '1px solid var(--border-strong)',
            padding: '24px',
            boxShadow: 'var(--shadow-float)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>Event Details</h3>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ aspectRatio: '4/3', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-surface-2)', marginBottom: '16px' }}>
              <img
                src={`/static/mock_images/${selectedEvent.image_name}`}
                alt={selectedEvent.image_name}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.src = '/static/mock_images/weed_0000.png';
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-xs)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Frame:</span>
                <strong>{selectedEvent.image_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Decision:</span>
                <Badge variant={selectedEvent.decision === 'FIRE' ? 'fire' : 'suppress'}>
                  {selectedEvent.decision}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedEvent.timestamp}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Target Centroid:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedEvent.centroid_px}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Coords (mm):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedEvent.target_coords_mm || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Burst Duration:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedEvent.burst_duration_ms || '-'} ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Chemical Dose:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{selectedEvent.dose_volume_ml || '-'} mL</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Button
              size="md"
              variant="primary"
              icon={ExternalLink}
              style={{ width: '100%' }}
              onClick={() => {
                if (onNavigatePipeline) {
                  onNavigatePipeline(selectedEvent.image_name);
                }
                setSelectedEvent(null);
              }}
            >
              Open in Pipeline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

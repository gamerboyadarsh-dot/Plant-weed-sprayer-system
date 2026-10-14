import React from 'react';
import { Card, Badge, EmptyState } from '../ui/BasicUI';
import { formatNumber, formatArea } from '../../utils/format';

export function CandidateTable({ candidates = [], hoveredId, onHover }) {
  if (!candidates || candidates.length === 0) {
    return (
      <Card header="Detected Plant Candidates">
        <EmptyState
          title="No candidates above threshold"
          message="Adjust ExG or area threshold sliders to capture target plants."
        />
      </Card>
    );
  }

  return (
    <Card header={`Detected Plant Candidates (${candidates.length})`}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '8px 10px' }}>ID</th>
              <th style={{ padding: '8px 10px' }}>Area</th>
              <th style={{ padding: '8px 10px' }}>Centroid (px)</th>
              <th style={{ padding: '8px 10px' }}>Solidity</th>
              <th style={{ padding: '8px 10px' }}>Circularity</th>
              <th style={{ padding: '8px 10px' }}>Mean ExG</th>
              <th style={{ padding: '8px 10px' }}>Decision</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((cand) => {
              const isHovered = hoveredId === cand.id;
              const isFire = cand.decision === 'FIRE';

              return (
                <tr
                  key={cand.id}
                  onMouseEnter={() => onHover && onHover(cand.id)}
                  onMouseLeave={() => onHover && onHover(null)}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isHovered ? 'var(--bg-surface-hover)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background var(--transition-fast)'
                  }}
                >
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    #{cand.id}
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                    {formatArea(cand.area)}
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    ({formatNumber(cand.centroid_px?.[0], 1)}, {formatNumber(cand.centroid_px?.[1], 1)})
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(cand.solidity, 3)}
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(cand.circularity, 3)}
                  </td>
                  <td style={{ padding: '10px', fontFamily: 'var(--font-mono)' }}>
                    {formatNumber(cand.mean_exg, 3)}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <Badge variant={isFire ? 'fire' : 'suppress'}>
                      {cand.decision}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

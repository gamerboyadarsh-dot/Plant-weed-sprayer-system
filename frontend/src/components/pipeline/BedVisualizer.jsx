import React from 'react';
import { Card } from '../ui/BasicUI';

export function BedVisualizer({ targetX = 0, targetY = 0, isFiring = false, bedWidth = 500, bedHeight = 400 }) {
  // SVG Viewbox dimensions
  const svgWidth = 320;
  const svgHeight = 220;

  // Map physical mm to SVG coordinates
  // Margin for boundary visualization
  const margin = 20;
  const plotW = svgWidth - margin * 2;
  const plotH = svgHeight - margin * 2;

  // Clamp target coordinates inside physical bounds
  const clampedX = Math.max(0, Math.min(bedWidth, targetX || 0));
  const clampedY = Math.max(0, Math.min(bedHeight, targetY || 0));

  const nozzleSvgX = margin + (clampedX / bedWidth) * plotW;
  const nozzleSvgY = margin + (clampedY / bedHeight) * plotH;

  return (
    <Card header="Physical Coordinate Gantry & Actuator">
      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{
            width: '100%',
            maxWidth: '340px',
            background: 'var(--bg-surface-2)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
          aria-label="Physical spray bed gantry simulation"
        >
          {/* Bed Grid Pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect x={margin} y={margin} width={plotW} height={plotH} fill="url(#grid)" stroke="var(--border-strong)" strokeWidth="1" />

          {/* Dimension bounds text */}
          <text x={margin} y={margin - 6} fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">
            (0, 0) mm
          </text>
          <text x={margin + plotW} y={margin + plotH + 14} fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">
            ({bedWidth}, {bedHeight}) mm
          </text>

          {/* Gantry Rails (X and Y axis bars) */}
          <line
            x1={nozzleSvgX}
            y1={margin}
            x2={nozzleSvgX}
            y2={margin + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
          <line
            x1={margin}
            y1={nozzleSvgY}
            x2={margin + plotW}
            y2={nozzleSvgY}
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Spray Pulse Droplet Animation when isFiring is true */}
          {isFiring && (
            <g>
              <circle
                cx={nozzleSvgX}
                cy={nozzleSvgY}
                r="16"
                fill="var(--leaf-green)"
                fillOpacity="0.2"
                stroke="var(--leaf-green)"
                strokeWidth="1"
              >
                <animate attributeName="r" values="6;22;28" dur="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0.3;0" dur="1s" repeatCount="indefinite" />
              </circle>
              <circle
                cx={nozzleSvgX}
                cy={nozzleSvgY}
                r="10"
                fill="none"
                stroke="var(--leaf-green)"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* Nozzle Carriage Marker */}
          <circle
            cx={nozzleSvgX}
            cy={nozzleSvgY}
            r="5"
            fill={isFiring ? 'var(--leaf-green)' : 'var(--text-muted)'}
            stroke="var(--text-primary)"
            strokeWidth="1.5"
          />
        </svg>

        {/* Readout coordinates bar */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '12px', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Target X: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{targetX ? `${Number(targetX).toFixed(1)} mm` : '0.0 mm'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Target Y: </span>
            <strong style={{ color: 'var(--text-primary)' }}>{targetY ? `${Number(targetY).toFixed(1)} mm` : '0.0 mm'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Actuator: </span>
            <strong style={{ color: isFiring ? 'var(--leaf-green)' : 'var(--bark-brown)' }}>
              {isFiring ? 'DISCHARGE' : 'STANDBY'}
            </strong>
          </div>
        </div>
      </div>
    </Card>
  );
}

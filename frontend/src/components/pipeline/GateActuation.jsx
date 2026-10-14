import React from 'react';
import { Card, Badge } from '../ui/BasicUI';
import { Check, X, Sparkles, ShieldAlert } from 'lucide-react';
import { formatMs, formatVolume, formatCoordinate } from '../../utils/format';

export function GateMonitor({ colorPass = false, shapePass = false, decision = 'SUPPRESS', primaryCandidate = null }) {
  const isFire = decision === 'FIRE';

  const meanExg = primaryCandidate?.mean_exg ?? 0;
  const circularity = primaryCandidate?.circularity ?? 0;

  // Normalized gauge percent (0-100%)
  const exgPercent = Math.min(100, Math.max(0, (meanExg / 0.8) * 100));
  const circPercent = Math.min(100, Math.max(0, circularity * 100));

  return (
    <Card tier={1} header="Dual-Cue Confirmation Gate">
      {/* 2 Radial Gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Cue 1: Colour ExG Gauge */}
        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Radial SVG Gauge */}
          <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="3.2"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={colorPass ? 'var(--leaf-green)' : 'var(--maple-red)'}
                strokeDasharray={`${exgPercent}, 100`}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {meanExg ? meanExg.toFixed(2) : '0.00'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Cue 1: Colour (ExG)</span>
              <Badge variant={colorPass ? 'fire' : 'suppress'}>{colorPass ? 'PASS' : 'FAIL'}</Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Threshold: &gt; 0.05 index
            </div>
          </div>
        </div>

        {/* Cue 2: Shape Circularity Gauge */}
        <div style={{ padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="3.2"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={shapePass ? 'var(--leaf-green)' : 'var(--bark-brown)'}
                strokeDasharray={`${circPercent}, 100`}
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {circularity ? circularity.toFixed(2) : '0.00'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Cue 2: Shape Geometry</span>
              <Badge variant={shapePass ? 'fire' : 'suppress'}>{shapePass ? 'PASS' : 'FAIL'}</Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Threshold: &gt; 0.45 4πA/P²
            </div>
          </div>
        </div>
      </div>

      {/* Decision Banner */}
      <div
        style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: isFire ? 'var(--leaf-green-subtle)' : 'var(--bark-brown-subtle)',
          border: `1px solid ${isFire ? 'rgba(79, 157, 93, 0.4)' : 'rgba(138, 90, 59, 0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isFire ? (
            <Sparkles size={18} style={{ color: 'var(--leaf-green)' }} />
          ) : (
            <ShieldAlert size={18} style={{ color: 'var(--bark-brown)' }} />
          )}
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: isFire ? 'var(--leaf-green)' : 'var(--bark-brown)' }}>
              {isFire ? 'FIRE ACTUATION' : 'SUPPRESS ACTUATION'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {isFire
                ? 'Target confirmed as broadleaf weed. Micro-dose pulse authorized.'
                : 'Target rejected as non-weed or sub-threshold. Chemical suppressed.'}
            </div>
          </div>
        </div>
        <Badge variant={isFire ? 'fire' : 'suppress'}>
          {decision}
        </Badge>
      </div>
    </Card>
  );
}

export function ActuationPanel({ dosing = null }) {
  return (
    <Card tier={1} header="Micro-Dosing Actuator Telemetry">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        <div style={{ padding: '10px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Coordinate X</div>
          <div style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCoordinate(dosing?.target_mm?.[0])}
          </div>
        </div>

        <div style={{ padding: '10px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Coordinate Y</div>
          <div style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatCoordinate(dosing?.target_mm?.[1])}
          </div>
        </div>

        <div style={{ padding: '10px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Burst Duration (T_spray)</div>
          <div style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--leaf-green)', marginTop: '4px' }}>
            {formatMs(dosing?.t_spray_ms)}
          </div>
        </div>

        <div style={{ padding: '10px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Volume Delivered</div>
          <div style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {formatVolume(dosing?.volume_ml)}
          </div>
        </div>

        <div style={{ padding: '10px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Solenoid Valve</div>
          <div style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)', fontWeight: 600, color: dosing?.valve_state === 'OPEN' ? 'var(--leaf-green)' : 'var(--text-secondary)', marginTop: '4px' }}>
            {dosing?.valve_state || 'CLOSED'}
          </div>
        </div>
      </div>
    </Card>
  );
}

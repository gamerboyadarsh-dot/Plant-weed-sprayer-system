import React, { useRef } from 'react';
import { Card, Button } from '../ui/BasicUI';
import { Slider, AccordionGroup } from '../ui/SliderAccordion';
import { PARAM_CONFIG } from '../../utils/constants';
import { RotateCcw, Upload, Image as ImageIcon } from 'lucide-react';

export function ParameterPanel({
  params,
  onParamChange,
  onReset,
  imagesList = [],
  selectedImage,
  onSelectImage,
  onCustomUpload,
  loading = false
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onCustomUpload(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sparkline generator for Dose duration T_spray curve
  const tMin = params.t_min_ms || 80;
  const tMax = params.t_max_ms || 320;
  const aRef = params.a_ref || 12000;

  // Generate 8 points along Area curve: T(A) = clamp(tMin + (tMax - tMin) * (A / aRef), tMin, tMax)
  const sparkPoints = [1000, 3000, 6000, 9000, 12000, 16000, 20000, 24000].map((area, idx) => {
    const t = Math.min(tMax, Math.max(tMin, tMin + (tMax - tMin) * (area / aRef)));
    const x = idx * 14;
    // Map tMin -> tMax to y=26 -> y=4
    const y = 26 - ((t - tMin) / (tMax - tMin || 1)) * 22;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card tier={2} header="Parameters & Configuration">
      {/* Target Selector Accordion */}
      <AccordionGroup title="Input Target" defaultOpen={true}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Select Benchmark Frame
          </label>
          <select
            value={selectedImage}
            onChange={(e) => onSelectImage(e.target.value)}
            style={{
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer'
            }}
          >
            {imagesList.map((img) => (
              <option key={img.filename} value={img.filename}>
                {img.filename} ({img.class})
              </option>
            ))}
          </select>

          {/* Quick upload trigger */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <Button
            size="sm"
            variant="subtle"
            icon={Upload}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Custom Image
          </Button>
        </div>
      </AccordionGroup>

      {/* Parameter Sliders grouped into accordions with section reset */}
      {PARAM_CONFIG.map((group) => (
        <AccordionGroup
          key={group.category}
          title={group.category}
          defaultOpen={true}
          onReset={onReset}
        >
          {group.category === 'Micro-Dosing Actuation' && (
            <div style={{ marginBottom: '14px', padding: '10px', background: 'var(--bg-surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dose Response Curve (ms vs px²)</span>
                <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--leaf-green)' }}>{tMin}–{tMax} ms</span>
              </div>
              <svg width="100%" height="30" viewBox="0 0 100 30" fill="none">
                <polyline
                  points={sparkPoints}
                  fill="none"
                  stroke="var(--leaf-green)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}

          {group.items.map((item) => (
            <Slider
              key={item.key}
              label={item.label}
              value={params[item.key]}
              min={item.min}
              max={item.max}
              step={item.step}
              unit={item.unit}
              tooltip={item.tooltip}
              onChange={(val) => onParamChange(item.key, val)}
            />
          ))}
        </AccordionGroup>
      ))}

      {/* Global Reset to defaults button */}
      <div style={{ marginTop: '16px' }}>
        <Button
          variant="subtle"
          size="sm"
          icon={RotateCcw}
          onClick={onReset}
          style={{ width: '100%' }}
        >
          Reset All Parameters
        </Button>
      </div>
    </Card>
  );
}

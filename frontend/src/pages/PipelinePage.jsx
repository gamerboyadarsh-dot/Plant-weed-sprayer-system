import React from 'react';
import { usePipeline } from '../context/PipelineContext';
import { StageCards } from '../components/pipeline/StageCards';
import { CandidateTable } from '../components/pipeline/CandidateTable';
import { GateMonitor, ActuationPanel } from '../components/pipeline/GateActuation';
import { BedVisualizer } from '../components/pipeline/BedVisualizer';
import { ParameterPanel } from '../components/pipeline/ParameterPanel';

export function PipelinePage() {
  const {
    params,
    updateParam,
    resetParams,
    imagesList,
    selectedImage,
    selectImageByName,
    handleCustomUpload,
    pipelineData,
    loading,
    hoveredCandidateId,
    setHoveredCandidateId
  } = usePipeline();

  // Backend returns detections array
  const candidatesList = (pipelineData?.detections || pipelineData?.candidates || []).map(d => ({
    id: d.id,
    area: d.area_px || d.area,
    centroid_px: [d.centroid_x ?? d.centroid_px?.[0] ?? 0, d.centroid_y ?? d.centroid_px?.[1] ?? 0],
    solidity: d.solidity,
    circularity: d.circularity,
    mean_exg: d.mean_exg,
    decision: d.decision,
    burst_ms: d.burst_ms,
    volume_ml: d.volume_ml,
    colour_cue: d.colour_cue,
    shape_cue: d.shape_cue
  }));

  const primaryCandidate = candidatesList[0] || null;
  const primaryCoord = pipelineData?.coordinates?.[0] || null;
  const isFire = primaryCandidate?.decision === 'FIRE';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
      {/* Main Content Workspace */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
        {/* 4-Stage Computer Vision Pipeline */}
        <StageCards
          originalUrl={pipelineData?.images?.original}
          exgUrl={pipelineData?.images?.exg_heatmap || pipelineData?.images?.exg}
          maskUrl={pipelineData?.images?.clean_mask || pipelineData?.images?.mask}
          overlayUrl={pipelineData?.images?.annotated || pipelineData?.images?.overlay}
          loading={loading}
        />

        {/* Dual-Cue Confirmation Gate */}
        <GateMonitor
          colorPass={primaryCandidate?.colour_cue ?? pipelineData?.color_cue_pass}
          shapePass={primaryCandidate?.shape_cue ?? pipelineData?.shape_cue_pass}
          decision={primaryCandidate?.decision || pipelineData?.overall_decision || 'SUPPRESS'}
          primaryCandidate={primaryCandidate}
        />

        {/* Actuation Metrics & Bed Visualizer (Side by side) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <ActuationPanel dosing={{
            target_mm: [
              primaryCoord?.bed_x_mm ?? 0,
              primaryCoord?.bed_y_mm ?? 0
            ],
            t_spray_ms: primaryCandidate?.burst_ms || pipelineData?.dosing?.total_burst_ms || 0,
            volume_ml: primaryCandidate?.volume_ml || pipelineData?.dosing?.targeted_volume_ml || 0,
            valve_state: (primaryCandidate?.decision === 'FIRE') ? 'OPEN' : 'CLOSED'
          }} />
          <BedVisualizer
            targetX={primaryCoord?.bed_x_mm ?? 0}
            targetY={primaryCoord?.bed_y_mm ?? 0}
            isFiring={primaryCandidate?.decision === 'FIRE'}
            bedWidth={params.bed_width_mm}
            bedHeight={params.bed_height_mm}
          />
        </div>

        {/* Detected Contours Table */}
        <CandidateTable
          candidates={candidatesList}
          hoveredId={hoveredCandidateId}
          onHover={setHoveredCandidateId}
        />
      </div>

      {/* Right-Hand Parameters Panel */}
      <div style={{ position: 'sticky', top: '80px' }}>
        <ParameterPanel
          params={params}
          onParamChange={updateParam}
          onReset={resetParams}
          imagesList={imagesList}
          selectedImage={selectedImage}
          onSelectImage={selectImageByName}
          onCustomUpload={handleCustomUpload}
          loading={loading}
        />
      </div>
    </div>
  );
}

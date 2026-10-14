import React, { useState, useEffect } from 'react';
import './App.css';
import { 
  Play, 
  RotateCcw, 
  Layers, 
  BarChart3, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Cpu,
  Droplets,
  MapPin,
  Flame,
  ShieldAlert,
  Search,
  Download,
  UploadCloud,
  Info,
  Target,
  Leaf,
  Box
} from 'lucide-react';
import AboutTab from './AboutTab';

import { motion } from 'framer-motion';

export default function App() {
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'pipeline' | 'analytics' | 'events' | 'gallery'

  // Global Mouse Tracking for Background Glow
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [imagesList, setImagesList] = useState([]);
  const [selectedImage, setSelectedImage] = useState('weed_0001.png');
  const [uploadedBase64, setUploadedBase64] = useState(null);
  const [classFilter, setClassFilter] = useState('all');
  const [galleryCategory, setGalleryCategory] = useState('weed');
  
  // Tunable Parameters
  const [params, setParams] = useState({
    exg_threshold: 0.05,
    min_contour_area: 500,
    max_contour_area: 80000,
    min_circularity: 0.15,
    min_solidity: 0.40,
    t_min_ms: 80,
    t_max_ms: 320,
    a_ref: 12000,
    flow_rate_ml_s: 2.0,
    bed_width_mm: 500,
    bed_height_mm: 400,
    nozzle_offset_x_mm: 50,
    nozzle_offset_y_mm: 0,
  });

  // Processing Results
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Events & Analytics
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState('ALL');
  const [eventSearch, setEventSearch] = useState('');
  const [analytics, setAnalytics] = useState(null);

  // 1. Fetch images list on load
  useEffect(() => {
    fetch('/api/images')
      .then(res => res.json())
      .then(data => {
        if (data && data.images) {
          setImagesList(data.images);
        }
      })
      .catch(err => console.error('Failed to load images:', err));

    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setAnalytics(data))
      .catch(err => console.error('Failed to load analytics:', err));

    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        if (data && data.events) {
          setEvents(data.events);
        }
      })
      .catch(err => console.error('Failed to load events:', err));
  }, []);

  // 2. Run pipeline whenever selectedImage or params change
  const runPipeline = (imgName = selectedImage, b64 = uploadedBase64) => {
    setLoading(true);
    setErrorMsg(null);

    const body = {
      image_name: b64 ? "uploaded_custom.png" : imgName,
      image_base64: b64,
      ...params
    };

    fetch('/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        return res.json();
      })
      .then(data => {
        setPipelineData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Pipeline processing error:', err);
        setErrorMsg(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    runPipeline(selectedImage, uploadedBase64);
  }, [selectedImage, uploadedBase64]);

  const handleParamChange = (field, value) => {
    setParams(prev => ({ ...prev, [field]: parseFloat(value) }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setUploadedBase64(uploadEvent.target.result);
        setSelectedImage('Custom Upload');
      };
      reader.readAsDataURL(file);
    }
  };

  // Filtered images for dropdown
  const filteredDropdownImages = imagesList.filter(img => {
    if (classFilter === 'all') return true;
    if (classFilter === 'weed') return img.class === 'weed';
    if (classFilter === 'crop') return img.class === 'crop';
    if (classFilter === 'background') return img.class === 'background';
    return true;
  });

  // Filtered Events
  const filteredEvents = events.filter(ev => {
    if (eventFilter !== 'ALL' && ev.decision !== eventFilter) return false;
    if (eventSearch && !String(ev.image_name).toLowerCase().includes(eventSearch.toLowerCase())) return false;
    return true;
  });

  const activeDecision = pipelineData?.detections?.length > 0 
    ? (pipelineData.detections.some(d => d.decision === 'FIRE') ? 'FIRE' : 'SUPPRESS')
    : 'NO_CANDIDATE';

  return (
    <div className="app-container">
      <div className="cursor-glow"></div>
      
      {/* ======================================================== */}
      {/* SIDEBAR                                                  */}
      {/* ======================================================== */}
      {activeTab !== 'about' && (
        <motion.aside 
        className="sidebar"
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="sidebar-header">
          <div className="brand-title">
            <span style={{ fontSize: '1.4rem', color: 'var(--accent-green-light)', marginRight: '6px' }}><Leaf size={20} style={{ display: 'inline' }} /></span> Weed Sprayer PoC
          </div>
          <div className="brand-badge">BACSE291 Review II · Project 202601383</div>
          <div className="team-credits">
            Akshita Parihar (25BRS1174) · Divyanshi Rai (25BRS1228) · Adarsh Agrawal (25BRS1226)
          </div>
        </div>

        <div className="sidebar-content">
          {/* Section: Image Selection */}
          <div>
            <div className="section-label">1. Input Image Selection</div>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Quick Panel Presets:
              </div>
              <div className="preset-buttons">
                <button 
                  className={`preset-btn ${selectedImage === 'weed_0001.png' && !uploadedBase64 ? 'active' : ''}`}
                  onClick={() => { setUploadedBase64(null); setSelectedImage('weed_0001.png'); }}
                >
                  <Target size={14} style={{ marginRight: '6px' }} /> Weed
                </button>
                <button 
                  className={`preset-btn ${selectedImage === 'crop_0001.png' && !uploadedBase64 ? 'active' : ''}`}
                  onClick={() => { setUploadedBase64(null); setSelectedImage('crop_0001.png'); }}
                >
                  <Leaf size={14} style={{ marginRight: '6px' }} /> Crop
                </button>
                <button 
                  className={`preset-btn ${selectedImage === 'bg_0001.png' && !uploadedBase64 ? 'active' : ''}`}
                  onClick={() => { setUploadedBase64(null); setSelectedImage('bg_0001.png'); }}
                >
                  <Box size={14} style={{ marginRight: '6px' }} /> Soil
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <select 
                value={classFilter} 
                onChange={(e) => setClassFilter(e.target.value)}
                style={{ marginBottom: '6px' }}
              >
                <option value="all">All Synthetic Images (90)</option>
                <option value="weed">Weed Targets (80)</option>
                <option value="crop">Crop Targets (80)</option>
                <option value="background">Soil Backgrounds (40)</option>
              </select>

              <select 
                value={selectedImage} 
                onChange={(e) => { setUploadedBase64(null); setSelectedImage(e.target.value); }}
              >
                {filteredDropdownImages.map(img => (
                  <option key={img.filename} value={img.filename}>
                    {img.filename} ({img.class})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Upload */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              background: '#162234',
              border: '1px dashed var(--border-color)',
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              marginTop: '8px'
            }}>
              <UploadCloud size={16} /> Upload Custom Image
              <input type="file" accept="image/png, image/jpeg" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Section: Vision Parameters */}
          <div className="control-group">
            <div className="section-label">2. Vision Parameters</div>
            
            <div className="control-item">
              <div className="control-label-row">
                <span>ExG Threshold</span>
                <span className="control-val">{params.exg_threshold.toFixed(3)}</span>
              </div>
              <input 
                type="range" min="0.01" max="0.25" step="0.005"
                value={params.exg_threshold}
                onChange={(e) => handleParamChange('exg_threshold', e.target.value)}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>Min Contour Area (px²)</span>
                <span className="control-val">{params.min_contour_area}</span>
              </div>
              <input 
                type="range" min="100" max="3000" step="50"
                value={params.min_contour_area}
                onChange={(e) => handleParamChange('min_contour_area', e.target.value)}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>Max Contour Area (px²)</span>
                <span className="control-val">{params.max_contour_area}</span>
              </div>
              <input 
                type="range" min="5000" max="307200" step="5000"
                value={params.max_contour_area}
                onChange={(e) => handleParamChange('max_contour_area', e.target.value)}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>Min Circularity (4πA/P²)</span>
                <span className="control-val">{params.min_circularity.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.05" max="0.60" step="0.01"
                value={params.min_circularity}
                onChange={(e) => handleParamChange('min_circularity', e.target.value)}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>Min Solidity</span>
                <span className="control-val">{params.min_solidity.toFixed(2)}</span>
              </div>
              <input 
                type="range" min="0.10" max="0.80" step="0.02"
                value={params.min_solidity}
                onChange={(e) => handleParamChange('min_solidity', e.target.value)}
              />
            </div>
          </div>

          {/* Section: Dosing Parameters */}
          <div className="control-group">
            <div className="section-label">3. Dosing Parameters</div>
            
            <div className="control-item">
              <div className="control-label-row">
                <span>T_min (ms)</span>
                <span className="control-val">{params.t_min_ms} ms</span>
              </div>
              <input 
                type="range" min="40" max="150" step="5"
                value={params.t_min_ms}
                onChange={(e) => handleParamChange('t_min_ms', e.target.value)}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>T_max (ms)</span>
                <span className="control-val">{params.t_max_ms} ms</span>
              </div>
              <input 
                type="range" min="150" max="450" step="10"
                value={params.t_max_ms}
                onChange={(e) => handleParamChange('t_max_ms', e.target.value)}
              />
            </div>

            <div className="control-item">
              <div className="control-label-row">
                <span>Assumed Flow Rate (mL/s)</span>
                <span className="control-val">{params.flow_rate_ml_s.toFixed(1)} mL/s</span>
              </div>
              <input 
                type="range" min="0.5" max="5.0" step="0.1"
                value={params.flow_rate_ml_s}
                onChange={(e) => handleParamChange('flow_rate_ml_s', e.target.value)}
              />
              <div style={{ fontSize: '0.68rem', color: 'var(--accent-amber)', marginTop: '4px' }}>
                Placeholder: physical pump calibration pending.
              </div>
            </div>
          </div>

          {/* Section: Coordinate Offsets */}
          <div className="control-group">
            <div className="section-label">4. Coordinate Transform</div>
            <div className="control-item">
              <div className="control-label-row">
                <span>Nozzle Offset X (mm)</span>
                <span className="control-val">{params.nozzle_offset_x_mm} mm</span>
              </div>
              <input 
                type="range" min="-100" max="100" step="5"
                value={params.nozzle_offset_x_mm}
                onChange={(e) => handleParamChange('nozzle_offset_x_mm', e.target.value)}
              />
            </div>
          </div>

          <button 
            className="preset-btn"
            style={{ padding: '12px', background: 'var(--accent-green-dark)', color: '#fff', fontWeight: '700' }}
            onClick={() => runPipeline()}
          >
            <Play size={16} style={{ display: 'inline', marginRight: '6px' }} /> Re-Run Pipeline
          </button>
        </div>
      </motion.aside>
      )}

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA                                        */}
      {/* ======================================================== */}
      <motion.main 
        className="main-content"
        style={{ maxWidth: activeTab === 'about' ? '100vw' : 'calc(100vw - 380px)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        {/* Header Title Banner */}
        {activeTab !== 'about' && (
        <header className="header-banner">
          <div className="hero-title flicker-text" style={{ background: 'linear-gradient(90deg, #fff, var(--accent-green-light), #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
            <span><Leaf size={24} style={{ display: 'inline', marginRight: '8px', color: 'var(--accent-green-light)' }} /></span> Precision Micro-Dosing Weed Sprayer
          </div>
          <div className="hero-subtitle">
            Software-Based Proof-of-Concept & Simulation Before Hardware Integration
          </div>
          
          <div className="disclaimer-alert">
            <AlertTriangle size={18} />
            <span>
              <strong>SIMULATION ONLY</strong>: No physical hardware exists at this stage. Flow rates, burst timings, and coordinates are simulation assumptions for algorithmic validation.
            </span>
          </div>
        </header>
        )}

        {/* Tab Navigation */}
        {activeTab !== 'about' && (
        <nav className="tab-bar">
          <button 
            className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            <Layers size={17} /> Vision & Dosing Pipeline
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart3 size={17} /> Review II Analytics
          </button>
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <FileText size={17} /> Structured Event Log
          </button>
          <button 
            className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            <ImageIcon size={17} /> Synthetic Dataset Gallery (200)
          </button>
        </nav>
        )}

        {/* Tab 0: About & Methodology */}
        {activeTab === 'about' && <AboutTab onEnter={() => setActiveTab('pipeline')} />}

        {/* Tab 1: Single Image Vision Pipeline */}
        {activeTab === 'pipeline' && (
          <div className="tab-content">
            {loading && <div style={{ color: 'var(--accent-green-light)', fontWeight: 600 }}>Processing image through OpenCV pipeline...</div>}
            {errorMsg && <div style={{ color: 'var(--accent-red)' }}>Error: {errorMsg}</div>}

            {pipelineData && (
              <>
                {/* 4-Stage Vision Pipeline Images */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>
                     4-Stage Computer Vision Pipeline ({pipelineData.image_name})
                  </h3>
                  <div className="vision-grid">
                    <div className="vision-card">
                      <div className="vision-img-wrap">
                        <img src={pipelineData.images.original} alt="Original" />
                      </div>
                      <div className="vision-label">① Original Input Frame</div>
                    </div>

                    <div className="vision-card">
                      <div className="vision-img-wrap">
                        <img src={pipelineData.images.exg_heatmap} alt="ExG Heatmap" />
                      </div>
                      <div className="vision-label">② ExG Map (ExG = 2g - r - b)</div>
                    </div>

                    <div className="vision-card">
                      <div className="vision-img-wrap">
                        <img src={pipelineData.images.clean_mask} alt="Clean Mask" />
                      </div>
                      <div className="vision-label">③ Morphological Mask</div>
                    </div>

                    <div className="vision-card">
                      <div className="vision-img-wrap">
                        <img src={pipelineData.images.annotated} alt="Annotated" />
                      </div>
                      <div className="vision-label">④ Dual-Cue Decision Overlay</div>
                    </div>
                  </div>
                </div>

                {/* Split Row: Candidates & Confirmation Gate */}
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
                  {/* Candidate Features Table */}
                  <div className="control-group">
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>
                       Detected Candidate Features ({pipelineData.detections?.length || 0} Found)
                    </h4>
                    {pipelineData.detections?.length === 0 ? (
                      <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        No candidate passed the area & ExG threshold.
                      </div>
                    ) : (
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Area (px²)</th>
                              <th>Centroid</th>
                              <th>Solidity</th>
                              <th>Circularity</th>
                              <th>Mean ExG</th>
                              <th>Decision</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pipelineData.detections.map(d => (
                              <tr key={d.id}>
                                <td>#{d.id}</td>
                                <td>{d.area_px}</td>
                                <td>({d.centroid_x}, {d.centroid_y})</td>
                                <td>{d.solidity}</td>
                                <td>{d.circularity}</td>
                                <td>{d.mean_exg}</td>
                                <td>
                                  <span style={{ 
                                    color: d.decision === 'FIRE' ? 'var(--accent-red)' : 'var(--accent-blue)',
                                    fontWeight: 700 
                                  }}>
                                    {d.decision}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Dual-Cue Confirmation Gate */}
                  <div className="control-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>
                         Dual-Cue Confirmation Gate
                      </h4>
                      <div className="cue-status-grid">
                        <div className="cue-card">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUE 1: COLOUR (ExG)</span>
                          {pipelineData.detections?.some(d => d.colour_cue) ? (
                            <span className="cue-badge-pass"><CheckCircle2 size={16} /> PASS</span>
                          ) : (
                            <span className="cue-badge-fail"><XCircle size={16} /> FAIL</span>
                          )}
                        </div>
                        <div className="cue-card">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUE 2: SHAPE (Geometry)</span>
                          {pipelineData.detections?.some(d => d.shape_cue) ? (
                            <span className="cue-badge-pass"><CheckCircle2 size={16} /> PASS</span>
                          ) : (
                            <span className="cue-badge-fail"><XCircle size={16} /> FAIL</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Prominent Decision Banner */}
                    {activeDecision === 'FIRE' && (
                      <div className="decision-banner decision-fire">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.6rem' }}>
                          <Flame size={28} />  FIRE ACTUATION
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.9 }}>
                          Both Colour & Shape cues confirmed — Spray pulse issued
                        </div>
                      </div>
                    )}

                    {activeDecision === 'SUPPRESS' && (
                      <div className="decision-banner decision-suppress">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.6rem' }}>
                          <ShieldAlert size={28} />  SUPPRESS ACTUATION
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.9 }}>
                          Failed confirmation criteria (e.g. crop blade) — No spray
                        </div>
                      </div>
                    )}

                    {activeDecision === 'NO_CANDIDATE' && (
                      <div className="decision-banner decision-nocand">
                        <div style={{ fontSize: '1.3rem' }}> NO CANDIDATE</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                          Empty soil or sub-threshold patch — Actuator idle
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Split Row: Size-Scaled Dosing & Coordinate Transformation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* Dosing & Liquid Savings */}
                  <div className="control-group">
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Droplets size={18} color="var(--accent-blue)" />  Size-Scaled Dosing & Savings [Simulation]
                    </h4>
                    
                    <div className="metrics-row" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '12px' }}>
                      <div className="metric-box">
                        <div className="metric-title">Burst Duration (T_burst)</div>
                        <div className="metric-num" style={{ color: 'var(--accent-blue)' }}>
                          {pipelineData.dosing.total_burst_ms} ms
                        </div>
                      </div>
                      <div className="metric-box">
                        <div className="metric-title">Targeted Micro-Dose</div>
                        <div className="metric-num" style={{ color: 'var(--accent-green-light)' }}>
                          {pipelineData.dosing.targeted_volume_ml} mL
                        </div>
                      </div>
                    </div>

                    <div style={{ 
                      padding: '12px', 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Blanket Baseline (0.5s virtual window):</span>
                        <strong>{pipelineData.dosing.blanket_volume_ml} mL</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-green-light)', fontWeight: 700 }}>
                        <span>Theoretical Volume Reduction:</span>
                        <span>{pipelineData.dosing.saving_percent}% reduction</span>
                      </div>
                    </div>
                  </div>

                  {/* Bed & Nozzle Coordinate Transform */}
                  <div className="control-group">
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={18} color="var(--accent-amber)" />  Bed & Nozzle Coordinates [Simulation]
                    </h4>
                    
                    {pipelineData.coordinates?.length === 0 ? (
                      <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        No target coordinates to transform.
                      </div>
                    ) : (
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Target</th>
                              <th>Pixel (u, v)</th>
                              <th>Bed (X, Y) mm</th>
                              <th>Nozzle (X, Y) mm</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pipelineData.coordinates.map((c, i) => (
                              <tr key={i}>
                                <td>{c.target_id}</td>
                                <td>({c.pixel_x}, {c.pixel_y})</td>
                                <td>({c.bed_x_mm}, {c.bed_y_mm})</td>
                                <td style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                                  ({c.nozzle_x_mm}, {c.nozzle_y_mm})
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arduino Wokwi Serial Command Output */}
                <div className="control-group">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Cpu size={18} color="var(--accent-green-light)" />  Wokwi / Arduino Serial Actuation Output
                  </h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Validates serial protocol timing logic: Raspberry Pi sends command → Arduino triggers virtual actuator (pin 13 LED) for specified duration.
                  </div>
                  <div style={{
                    background: '#0d1117',
                    padding: '12px 16px',
                    borderRadius: '6px',
                    fontFamily: 'JetBrains Mono, monospace',
                    border: '1px solid var(--border-color)',
                    color: activeDecision === 'FIRE' ? 'var(--accent-green-light)' : 'var(--text-muted)'
                  }}>
                    {pipelineData.arduino.commands.join('\n')}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Review II Simulation Analytics */}
        {activeTab === 'analytics' && (
          <div className="tab-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
               Review II Simulation Metrics & Baseline Comparison
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Quantitative results across the 90-image synthetic benchmark. All metrics are simulation-based.
            </p>

            {/* Metrics Top Row */}
            {analytics?.metrics && (
              <div className="metrics-row">
                <div className="metric-box">
                  <div className="metric-title">Images Processed</div>
                  <div className="metric-num">{analytics.metrics.total_images || 90}</div>
                </div>
                <div className="metric-box">
                  <div className="metric-title"> FIRE Events</div>
                  <div className="metric-num" style={{ color: 'var(--accent-red)' }}>
                    {analytics.metrics.fire_events}
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-title">Theoretical Dose</div>
                  <div className="metric-num" style={{ color: 'var(--accent-blue)' }}>
                    {analytics.metrics.targeted_volume_ml} mL
                  </div>
                </div>
                <div className="metric-box">
                  <div className="metric-title">Volume Reduction</div>
                  <div className="metric-num" style={{ color: 'var(--accent-green-light)' }}>
                    {analytics.metrics.volume_reduction_percent}%
                  </div>
                </div>
              </div>
            )}

            {/* Graphs 2x2 Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="control-group">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Graph 1: Theoretical Targeted Volume vs Blanket Baseline
                </h4>
                <img src="/static/outputs/volume_comparison.png" alt="Volume Comparison" style={{ width: '100%', borderRadius: '6px' }} />
              </div>

              <div className="control-group">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Graph 2: False Positive Reduction via Dual-Cue Confirmation
                </h4>
                <img src="/static/outputs/confusion_matrix.png" alt="Gate Comparison" style={{ width: '100%', borderRadius: '6px' }} />
              </div>

              <div className="control-group">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Graph 3: Size-Scaled Burst Duration Distribution (ms)
                </h4>
                <img src="/static/outputs/dose_distribution.png" alt="Dose Distribution" style={{ width: '100%', borderRadius: '6px' }} />
              </div>

              <div className="control-group">
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  Graph 4: Detection Outcome Counts across Synthetic Dataset
                </h4>
                <img src="/static/outputs/detection_examples.png" alt="Detection Outcomes" style={{ width: '100%', borderRadius: '6px' }} />
              </div>
            </div>

            {/* Graph 5 */}
            <div className="control-group">
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                Graph 5: Coordinate Transformation Model & Nozzle Offset Mapping
              </h4>
              <img src="/static/outputs/coordinate_visualization.png" alt="Coordinate Visualization" style={{ width: '100%', borderRadius: '6px' }} />
            </div>
          </div>
        )}

        {/* Tab 3: Structured Event Log */}
        {activeTab === 'events' && (
          <div className="tab-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                   Structured Event Log (outputs/events.csv)
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Every processed candidate and frame is deterministically logged with spatial and dosing attributes.
                </p>
              </div>

              <a 
                href="/api/events"
                download="events_simulation.json"
                className="preset-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: 'var(--accent-green-dark)', color: '#fff' }}
              >
                <Download size={15} /> Export Events
              </a>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select 
                value={eventFilter} 
                onChange={(e) => setEventFilter(e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="ALL">All Decisions ({events.length})</option>
                <option value="FIRE">FIRE Events</option>
                <option value="SUPPRESS">SUPPRESS Events</option>
                <option value="NO_CANDIDATE">NO_CANDIDATE Events</option>
              </select>

              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="Search image name (e.g. weed_0012, crop_0005)..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                />
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            {/* Events Data Table */}
            <div className="data-table-container" style={{ maxHeight: '550px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Image</th>
                    <th>Decision</th>
                    <th>Area (px²)</th>
                    <th>Centroid (X,Y)</th>
                    <th>Solidity</th>
                    <th>Circularity</th>
                    <th>Burst (ms)</th>
                    <th>Volume (mL)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.slice(0, 100).map((ev, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.timestamp?.split('T')[1]?.slice(0, 8) || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{ev.image_name}</td>
                      <td>
                        <span style={{
                          color: ev.decision === 'FIRE' ? 'var(--accent-red)' : (ev.decision === 'SUPPRESS' ? 'var(--accent-blue)' : 'var(--text-muted)'),
                          fontWeight: 700
                        }}>
                          {ev.decision}
                        </span>
                      </td>
                      <td>{ev.area_px || '0'}</td>
                      <td>({ev.centroid_x || '0'}, {ev.centroid_y || '0'})</td>
                      <td>{ev.solidity || '-'}</td>
                      <td>{ev.circularity || '-'}</td>
                      <td>{ev.burst_ms || '0'} ms</td>
                      <td>{ev.estimated_volume_ml || '0'} mL</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing {filteredEvents.length} events from outputs/events.csv
            </div>
          </div>
        )}

        {/* Tab 4: Synthetic Dataset Gallery */}
        {activeTab === 'gallery' && (
          <div className="tab-content">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
               Synthetic Test Dataset (200 Controlled Images)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              All 90 synthetic images generated for algorithm validation. Click any image to instantly test it in the vision pipeline.
            </p>

            {/* Gallery Categories */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`preset-btn ${galleryCategory === 'weed' ? 'active' : ''}`}
                onClick={() => setGalleryCategory('weed')}
                style={{ padding: '8px 16px' }}
              >
                 Weed Targets (80)
              </button>
              <button 
                className={`preset-btn ${galleryCategory === 'crop' ? 'active' : ''}`}
                onClick={() => setGalleryCategory('crop')}
                style={{ padding: '8px 16px' }}
              >
                 Crop Targets (80)
              </button>
              <button 
                className={`preset-btn ${galleryCategory === 'background' ? 'active' : ''}`}
                onClick={() => setGalleryCategory('background')}
                style={{ padding: '8px 16px' }}
              >
                 Soil Backgrounds (40)
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="gallery-grid">
              {imagesList
                .filter(img => img.class === galleryCategory)
                .map(img => (
                  <div 
                    key={img.filename} 
                    className="gallery-card"
                    onClick={() => {
                      setUploadedBase64(null);
                      setSelectedImage(img.filename);
                      setActiveTab('pipeline');
                    }}
                  >
                    <img src={img.url} alt={img.filename} loading="lazy" />
                    <div className="gallery-info">
                      <span className="gallery-name">{img.filename}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {img.target_present ? `Area: ${img.target_area} px²` : 'Blank Soil'}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </motion.main>
    </div>
  );
}

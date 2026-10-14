import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Lenis from 'lenis';
import { Button, Card, Badge } from '../components/ui/BasicUI';
import { MapleLeaf, OakLeaf, BirchLeaf, ElmLeaf, LeafDropletMark, BotanicalBranch } from '../components/leaves/LeafIcons';
import { FallingLeaves, VineDivider } from '../components/leaves/FallingLeaves';
import { ThemeToggle } from '../components/layout/ThemeToggle';
import { ArrowRight, RotateCcw, Droplets, Target, ShieldCheck } from 'lucide-react';
import { fetchImages } from '../api/client';

export function LandingPage({ onLaunchDashboard, theme, toggleTheme }) {
  // Live stage switcher on preview card: 0 = Original, 1 = Mask, 2 = Overlay
  const [activeStage, setActiveStage] = useState(2);
  const [totalImageCount, setTotalImageCount] = useState(200);

  // Field simulation animation state
  const [fieldSimKey, setFieldSimKey] = useState(0);

  // 3-Way Interactive Gate inspection: 'weed' | 'crop' | 'debris'
  const [gateTarget, setGateTarget] = useState('weed');

  // Initialize Lenis smooth scrolling for landing page
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Load real dataset image count
  useEffect(() => {
    fetchImages()
      .then(res => {
        if (res && res.images) {
          setTotalImageCount(res.images.length);
        }
      })
      .catch(() => {});
  }, []);

  const stageImages = [
    { title: 'Original Frame', src: '/static/mock_images/weed_0000.png' },
    { title: 'Morphology Mask', src: '/static/outputs/masks/weed_0000_mask.png' },
    { title: 'Annotated Overlay', src: '/static/outputs/annotated/weed_0000_annotated.png' }
  ];

  // Gate metrics
  const gateCases = {
    weed: {
      title: 'Broadleaf Weed Rosette',
      exgValue: 0.38,
      exgPass: true,
      shapeValue: 0.74,
      shapePass: true,
      verdict: 'FIRE',
      desc: 'High greenness index and compact circular rosette trigger micro-dose actuation.'
    },
    crop: {
      title: 'Elongated Crop Blade',
      exgValue: 0.32,
      exgPass: true,
      shapeValue: 0.22,
      shapePass: false,
      verdict: 'SUPPRESS',
      desc: 'Green colour index passes, but narrow aspect ratio fails circularity gate. Chemical suppressed.'
    },
    debris: {
      title: 'Soil Patch / Organic Debris',
      exgValue: 0.02,
      exgPass: false,
      shapeValue: 0.15,
      shapePass: false,
      verdict: 'SUPPRESS',
      desc: 'Sub-threshold colour ExG fails both gates. Actuator remains completely idle.'
    }
  };

  const currentGate = gateCases[gateTarget];

  return (
    <div 
      style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        background: 'var(--bg-canvas)', 
        color: 'var(--text-primary)',
        overflowX: 'hidden'
      }}
    >
      {/* Drifting Autumn Leaves Background */}
      <FallingLeaves />

      {/* Decorative corner botanical branches */}
      <BotanicalBranch 
        width={320} 
        height={320} 
        style={{ position: 'absolute', top: -40, right: -40, opacity: 0.35, pointerEvents: 'none' }} 
      />

      {/* Slim Top Navigation */}
      <header
        style={{
          height: '64px',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-canvas)',
          borderBottom: '1px solid var(--border-subtle)',
          zIndex: 30,
          backdropFilter: 'blur(12px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LeafDropletMark size={28} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px' }}>
            Precision Weed Sprayer
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#problem" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Problem</a>
          <a href="#pipeline" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>How It Works</a>
          <a href="#gate" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Confirmation Gate</a>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <Button size="sm" onClick={onLaunchDashboard} icon={ArrowRight}>
            Open Dashboard
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '80px 24px 60px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
          gap: '48px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div>
          <Badge variant="neutral" style={{ marginBottom: '16px', background: 'var(--bg-surface-2)' }}>
            Classical Computer Vision · Edge Agronomy
          </Badge>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 600,
              lineHeight: 1.15,
              marginBottom: '20px',
              color: 'var(--text-primary)'
            }}
          >
            Spray only what needs spraying.
          </h1>
          <p
            style={{
              fontSize: '17px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '32px',
              maxWidth: '520px'
            }}
          >
            Conventional agriculture drenches entire fields in chemicals. Our targeted micro-dosing system uses deterministic color segmentation and dual-cue morphology to eliminate weeds while safeguarding healthy crops.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Button size="md" onClick={onLaunchDashboard} icon={ArrowRight}>
              Open Dashboard
            </Button>
            <a href="#pipeline">
              <Button size="md" variant="subtle">
                See How It Works
              </Button>
            </a>
          </div>
        </div>

        {/* Live-looking interactive preview card */}
        <Card style={{ padding: '18px', background: 'var(--bg-surface-1)', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Vision Feed: {stageImages[activeStage].title}
            </span>
            <Badge variant="fire">FIRE DETECTED</Badge>
          </div>

          <div
            style={{
              aspectRatio: '4/3',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: 'var(--bg-surface-2)',
              position: 'relative'
            }}
          >
            <img
              src={stageImages[activeStage].src}
              alt="Weed target specimen"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                // Fallback to original image if outputs not rendered yet
                e.currentTarget.src = '/static/mock_images/weed_0000.png';
              }}
            />

            {/* Pulsing Target Overlay when on Overlay Stage */}
            {activeStage === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                  position: 'absolute',
                  top: '18%',
                  left: '18%',
                  width: '64%',
                  height: '64%',
                  border: '2px solid var(--leaf-green)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '8px',
                    background: 'var(--leaf-green)',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '3px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600
                  }}
                >
                  TARGET: 120 ms (0.240 mL)
                </div>
              </motion.div>
            )}
          </div>

          {/* Tiny Stage Switcher under Card */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            {['Original', 'Mask', 'Overlay'].map((label, idx) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveStage(idx)}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: activeStage === idx ? 'var(--leaf-green)' : 'var(--border-subtle)',
                  background: activeStage === idx ? 'var(--leaf-green-subtle)' : 'var(--bg-surface-2)',
                  color: activeStage === idx ? 'var(--leaf-green)' : 'var(--text-muted)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Stats Counter Strip */}
      <section
        style={{
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-1)',
          padding: '36px 24px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '32px',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: '38px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--maple-red)' }}>
              80–90%
            </div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Chemical Waste Prevented
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Typical broadcast spraying loss
            </div>
          </div>

          <div>
            <div style={{ fontSize: '38px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--amber)' }}>
              {totalImageCount}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Benchmark Image Catalog
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Balanced weeds, crops, and soils
            </div>
          </div>

          <div>
            <div style={{ fontSize: '38px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--leaf-green)' }}>
              4 Stages
            </div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Classical OpenCV Pipeline
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Edge deterministic segmentation
            </div>
          </div>

          <div>
            <div style={{ fontSize: '38px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--moss-olive)' }}>
              Dual-Cue
            </div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              Safety Confirmation Gate
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Colour & circularity validation
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section: Animated Side-by-Side Field Diagram */}
      <section
        id="problem"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '80px 24px 60px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '12px' }}>
            The Agricultural Dilemma
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', fontSize: 'var(--text-sm)' }}>
            Comparing uniform broadcast chemical coverage with targeted precision micro-dosing.
          </p>
          <div style={{ marginTop: '16px' }}>
            <Button
              size="sm"
              variant="subtle"
              icon={RotateCcw}
              onClick={() => setFieldSimKey(k => k + 1)}
            >
              Replay Field Spray Sweep
            </Button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left: Broadcast Flooding */}
          <Card header="Conventional Broadcast Spraying">
            <div
              key={`broadcast-${fieldSimKey}`}
              style={{
                height: '200px',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Field Rows with crops */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '14px' }}>
                {[0, 1, 2, 3].map(row => (
                  <div key={row} style={{ height: '2px', background: 'var(--border-strong)', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '25%', top: '-8px', fontSize: '12px' }}>🌱</span>
                    <span style={{ position: 'absolute', left: '55%', top: '-8px', fontSize: '12px' }}>🌱</span>
                    <span style={{ position: 'absolute', left: '80%', top: '-8px', fontSize: '12px' }}>🌱</span>
                    {row === 1 && <span style={{ position: 'absolute', left: '40%', top: '-8px', color: 'var(--maple-red)', fontSize: '12px' }}>🌿</span>}
                  </div>
                ))}
              </div>

              {/* Red Flood Spray Wave sweeping across */}
              <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '0%' }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(192, 73, 47, 0.45)',
                  borderRight: '3px solid var(--maple-red)'
                }}
              />
            </div>
            {/* Chemical used bar */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Chemical Consumption</span>
                <strong style={{ color: 'var(--maple-red)' }}>100% (Broadcast Drench)</strong>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: 'var(--maple-red)' }} />
              </div>
            </div>
          </Card>

          {/* Right: Targeted Micro-Dosing */}
          <Card header="Precision Micro-Dosing System">
            <div
              key={`micro-${fieldSimKey}`}
              style={{
                height: '200px',
                background: 'var(--bg-surface-2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Field Rows with crops */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '14px' }}>
                {[0, 1, 2, 3].map(row => (
                  <div key={row} style={{ height: '2px', background: 'var(--border-strong)', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '25%', top: '-8px', fontSize: '12px' }}>🌱</span>
                    <span style={{ position: 'absolute', left: '55%', top: '-8px', fontSize: '12px' }}>🌱</span>
                    <span style={{ position: 'absolute', left: '80%', top: '-8px', fontSize: '12px' }}>🌱</span>
                    {row === 1 && (
                      <span style={{ position: 'absolute', left: '40%', top: '-8px', color: 'var(--leaf-green)', fontSize: '12px' }}>
                        🌿
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Pin-point target burst only over weed */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.4], scale: [0, 1.4, 1] }}
                transition={{ delay: 1.4, duration: 0.8 }}
                style={{
                  position: 'absolute',
                  top: '32%',
                  left: '38%',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(79, 157, 93, 0.3)',
                  border: '2px solid var(--leaf-green)'
                }}
              />
            </div>
            {/* Chemical used bar */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>Chemical Consumption</span>
                <strong style={{ color: 'var(--leaf-green)' }}>12.4% (Pin-Point Only)</strong>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '12.4%', background: 'var(--leaf-green)' }} />
              </div>
            </div>
          </Card>
        </div>
      </section>

      <VineDivider />

      {/* Stepper: How It Works with corner leaf accents */}
      <section
        id="pipeline"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '40px 24px 80px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '12px' }}>
            Four-Stage Vision Pipeline
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', fontSize: 'var(--text-sm)' }}>
            High-speed classical computer vision executing deterministically on low-power edge hardware.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
          {[
            { step: '01', title: 'ExG Color Index', desc: 'Isolates vegetation from soil using 2G - R - B arithmetic.', thumb: '/static/mock_images/weed_0000.png', LeafComp: MapleLeaf, leafColor: 'var(--maple-red)' },
            { step: '02', title: 'Morphology Mask', desc: 'Eliminates optical noise, dirt flecks, and small shadows.', thumb: '/static/outputs/masks/weed_0000_mask.png', LeafComp: OakLeaf, leafColor: 'var(--amber)' },
            { step: '03', title: 'Dual-Cue Gate', desc: 'Validates color greenness and circularity/solidity shape cues.', thumb: '/static/outputs/contours/weed_0000_pipeline.png', LeafComp: BirchLeaf, leafColor: 'var(--bark-brown)' },
            { step: '04', title: 'Millimetric Actuation', desc: 'Calculates spray duration (ms) and pulses the solenoid.', thumb: '/static/outputs/annotated/weed_0000_annotated.png', LeafComp: ElmLeaf, leafColor: 'var(--leaf-green)' },
          ].map((item, i) => {
            const LeafDecor = item.LeafComp;
            return (
              <Card key={i} style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Corner Leaf Decoration */}
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.65 }}>
                  <LeafDecor size={42} color={item.leafColor} />
                </div>

                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: item.leafColor,
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px'
                  }}
                >
                  {item.step}
                </div>

                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: '8px' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {item.desc}
                </p>

                <div style={{ aspectRatio: '16/10', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-surface-2)' }}>
                  <img
                    src={item.thumb}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.src = '/static/mock_images/weed_0000.png';
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Dual-Cue Gate Interactive 3-Way Explainer */}
      <section
        id="gate"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '40px 24px 90px',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Card header="Interactive Dual-Cue Confirmation Gate">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Compare how the gate evaluates broadleaf weeds, elongated crops, and bare soil debris.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '24px' }}>
            {[
              { id: 'weed', label: 'Broadleaf Weed' },
              { id: 'crop', label: 'Elongated Crop Blade' },
              { id: 'debris', label: 'Soil Patch / Debris' },
            ].map(tab => (
              <Button
                key={tab.id}
                size="sm"
                variant={gateTarget === tab.id ? 'primary' : 'subtle'}
                onClick={() => setGateTarget(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <div
            style={{
              padding: '24px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-subtle)',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '28px',
              alignItems: 'center'
            }}
          >
            <div>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: '16px' }}>
                {currentGate.title} Metrics
              </h4>

              {/* Progress Bar Cue 1 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>Cue 1: Colour ExG ({currentGate.exgValue} vs 0.05 min)</span>
                  <Badge variant={currentGate.exgPass ? 'fire' : 'suppress'}>
                    {currentGate.exgPass ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-surface-1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, currentGate.exgValue * 200)}%`,
                      background: currentGate.exgPass ? 'var(--leaf-green)' : 'var(--maple-red)'
                    }}
                  />
                </div>
              </div>

              {/* Progress Bar Cue 2 */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                  <span>Cue 2: Circularity ({currentGate.shapeValue} vs 0.45 min)</span>
                  <Badge variant={currentGate.shapePass ? 'fire' : 'suppress'}>
                    {currentGate.shapePass ? 'PASS' : 'FAIL'}
                  </Badge>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-surface-1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, currentGate.shapeValue * 100)}%`,
                      background: currentGate.shapePass ? 'var(--leaf-green)' : 'var(--bark-brown)'
                    }}
                  />
                </div>
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {currentGate.desc}
              </p>
            </div>

            {/* Verdict Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                background: currentGate.verdict === 'FIRE' ? 'var(--leaf-green-subtle)' : 'var(--bark-brown-subtle)',
                border: `1px solid ${currentGate.verdict === 'FIRE' ? 'var(--leaf-green)' : 'var(--bark-brown)'}`,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Actuation Verdict
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: currentGate.verdict === 'FIRE' ? 'var(--leaf-green)' : 'var(--bark-brown)',
                  margin: '8px 0'
                }}
              >
                {currentGate.verdict}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {currentGate.verdict === 'FIRE' ? 'Micro-Dose Authorized' : 'Chemical Suppressed'}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Closing Call-to-Action Band */}
      <section
        style={{
          background: 'var(--bg-surface-1)',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '60px 24px',
          textAlign: 'center',
          position: 'relative'
        }}
      >
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: '12px' }}>
            Ready to test on custom imagery?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '24px' }}>
            Open the full interactive pipeline to tune vision parameters, inspect candidates, and simulate nozzle gantry coordinates.
          </p>
          <Button size="md" onClick={onLaunchDashboard} icon={ArrowRight}>
            Open Precision Dashboard
          </Button>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer
        style={{
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          position: 'relative'
        }}
      >
        <BotanicalBranch 
          width={240} 
          height={240} 
          style={{ position: 'absolute', bottom: -30, left: -30, opacity: 0.25, pointerEvents: 'none' }} 
        />
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#problem">Problem</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#gate">Confirmation Gate</a>
          <button type="button" onClick={onLaunchDashboard} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' }}>
            Dashboard
          </button>
        </div>
        <div>Precision Micro-Dosing Weed Sprayer · Algorithmic Proof of Concept</div>
      </footer>
    </div>
  );
}

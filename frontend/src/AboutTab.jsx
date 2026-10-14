import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Target, Cpu, Leaf, Crosshair, Droplets, Zap, ChevronDown, Rocket } from 'lucide-react';

export default function AboutTab({ onEnter }) {
  const { scrollYProgress } = useScroll();
  const yOffset = useTransform(scrollYProgress, [0, 1], [0, -50]);

  // Reusable animation config for scroll-in elements
  const scrollAnim = {
    initial: { opacity: 0, y: 80, scale: 0.95 },
    whileInView: { opacity: 1, y: 0, scale: 1 },
    viewport: { once: true, margin: "-15%" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Hero Landing Section (100vh) */}
      <motion.section 
        style={{ 
          minHeight: 'calc(100vh - 100px)', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div style={{ y: yOffset }}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            style={{ 
              display: 'inline-block', 
              padding: '8px 16px', 
              borderRadius: '30px', 
              background: 'rgba(52, 211, 153, 0.1)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              color: 'var(--accent-green-light)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              marginBottom: '24px'
            }}
          >
            REVIEW II · 202601383
          </motion.div>
          <motion.h1 
            className="flicker-text"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ 
              fontSize: '3.5rem', 
              fontWeight: 800, 
              lineHeight: 1.1,
              marginBottom: '24px', 
              background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 50%, var(--accent-green-light) 100%, #fff 200%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em'
            }}
          >
            Precision Micro-Dosing<br/>Weed Sprayer
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ 
              fontSize: '1.25rem', 
              color: 'var(--text-secondary)', 
              lineHeight: 1.6,
              maxWidth: '650px',
              margin: '0 auto'
            }}
          >
            A software-first proof of concept demonstrating how classical computer vision can radically reduce agricultural chemical usage.
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          style={{ position: 'absolute', bottom: '40px', color: 'var(--text-muted)' }}
        >
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
            <ChevronDown size={32} />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* 2. Our Main Aim */}
      <motion.section {...scrollAnim} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', margin: '10vh 0' }}>
        <div className="control-group" style={{ padding: '60px', position: 'relative', overflow: 'hidden', width: '100%' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.03, transform: 'rotate(15deg)' }}>
            <Target size={350} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', position: 'relative' }}>
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <Target size={40} color="var(--accent-red)" style={{ filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.5))' }} />
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>The Problem & Our Aim</h2>
          </div>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px', position: 'relative' }}>
            Modern agriculture relies heavily on <strong style={{ color: '#fff' }}>"blanket spraying"</strong> — indiscriminately dousing entire fields in herbicides. This wastes expensive chemicals, destroys soil health, and causes toxic runoff into water systems.
          </p>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.8, position: 'relative' }}>
            Our aim is to build a smart, targeted micro-dosing system that visually identifies weeds in real-time and actuates a precise micro-burst of herbicide <strong style={{ color: 'var(--accent-green-light)' }}>only</strong> where needed. We prove that classical computer vision is fast, edge-deployable, and highly effective.
          </p>
        </div>
      </motion.section>

      {/* 3. Methodology / Pipeline */}
      <motion.section {...scrollAnim} style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', margin: '10vh 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            How We Do What We Do
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '16px' }}>
            A deterministic 4-stage pipeline operating entirely on pixel mathematics.
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <motion.div whileHover={{ scale: 1.05, translateY: -8 }} className="control-group" style={{ padding: '40px', background: 'rgba(16, 185, 129, 0.03)', borderColor: 'rgba(16, 185, 129, 0.15)' }}>
            <Leaf size={48} color="var(--accent-green-light)" style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 12px rgba(52,211,153,0.6))' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: '#fff', fontWeight: 700 }}>1. The Colour Cue (ExG)</h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              We extract vegetation from soil using the Excess Green (ExG) index. By amplifying the green channel <code>(2G - R - B)</code>, the soil turns dark, and plants pop out as bright white pixels.
            </p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, translateY: -8 }} className="control-group" style={{ padding: '40px', background: 'rgba(59, 130, 246, 0.03)', borderColor: 'rgba(59, 130, 246, 0.15)' }}>
            <Crosshair size={48} color="var(--accent-blue)" style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.6))' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: '#fff', fontWeight: 700 }}>2. Morphological Cleanup</h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Raw color masks are noisy. We use morphological operations to bridge gaps in leaves and remove tiny specks of noise, leaving only solid, contiguous candidate shapes.
            </p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, translateY: -8 }} className="control-group" style={{ padding: '40px', background: 'rgba(245, 158, 11, 0.03)', borderColor: 'rgba(245, 158, 11, 0.15)' }}>
            <Zap size={48} color="var(--accent-amber)" style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 12px rgba(245,158,11,0.6))' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: '#fff', fontWeight: 700 }}>3. The Dual-Cue Gate</h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Not everything green is a weed. We analyze the <strong>shape</strong> (circularity, solidity, aspect ratio). A blob must pass <em>both</em> color AND shape thresholds to trigger a FIRE command.
            </p>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05, translateY: -8 }} className="control-group" style={{ padding: '40px', background: 'rgba(14, 165, 233, 0.03)', borderColor: 'rgba(14, 165, 233, 0.15)' }}>
            <Droplets size={48} color="#0ea5e9" style={{ marginBottom: '24px', filter: 'drop-shadow(0 0 12px rgba(14,165,233,0.6))' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: '#fff', fontWeight: 700 }}>4. Size-Scaled Dosing</h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              Once confirmed, we calculate the area of the weed. The actuator firing time (ms) scales linearly with the weed's pixel footprint, saving massive amounts of liquid.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* 4. Simulation End */}
      <motion.section {...scrollAnim} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', paddingBottom: '10vh' }}>
        <div className="control-group" style={{ padding: '60px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.3)', width: '100%', boxShadow: '0 0 50px rgba(16, 185, 129, 0.1)' }}>
          <div style={{ display: 'inline-block', padding: '24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', marginBottom: '32px' }}>
            <Cpu size={64} color="var(--accent-green-light)" style={{ filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.8))' }} />
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', color: '#fff' }}>Simulation Before Hardware</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '800px', margin: '0 auto 40px' }}>
            This dashboard acts as a software surrogate for our upcoming hardware. By tuning ExG thresholds, testing false-positive rates on synthetic images, and projecting theoretical liquid savings in software, we ensure our logic is flawless before touching a physical Raspberry Pi or Arduino.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: '#000', 
              background: 'var(--accent-green-light)',
              border: 'none',
              padding: '16px 32px',
              borderRadius: '30px',
              fontWeight: 800, 
              fontSize: '1.2rem',
              cursor: 'pointer',
              boxShadow: '0 10px 30px rgba(52, 211, 153, 0.4)'
            }}
          >
            <Rocket size={24} /> Launch Simulation Dashboard
          </motion.button>
        </div>
      </motion.section>

    </div>
  );
}

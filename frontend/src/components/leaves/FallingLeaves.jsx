import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapleLeaf, OakLeaf, BirchLeaf, ElmLeaf } from './LeafIcons';

const LEAF_SPECIES = [
  { Comp: MapleLeaf, color: 'var(--maple-red)', secondary: '#E3B23C', size: 38 },
  { Comp: OakLeaf, color: 'var(--amber)', secondary: '#8A5A3B', size: 34 },
  { Comp: BirchLeaf, color: 'var(--bark-brown)', secondary: '#E3B23C', size: 28 },
  { Comp: ElmLeaf, color: 'var(--leaf-green)', secondary: '#7A8B3A', size: 32 },
  { Comp: MapleLeaf, color: 'var(--maple-red)', secondary: '#8A5A3B', size: 42 },
  { Comp: OakLeaf, color: 'var(--amber)', secondary: '#C0492F', size: 30 },
  { Comp: BirchLeaf, color: 'var(--bark-brown)', secondary: '#7A8B3A', size: 36 },
  { Comp: ElmLeaf, color: 'var(--moss-olive)', secondary: '#4F9D5D', size: 28 },
  { Comp: MapleLeaf, color: 'var(--amber)', secondary: '#C0492F', size: 32 },
  { Comp: OakLeaf, color: 'var(--bark-brown)', secondary: '#8A5A3B', size: 40 },
  { Comp: BirchLeaf, color: 'var(--maple-red)', secondary: '#E3B23C', size: 30 },
  { Comp: ElmLeaf, color: 'var(--leaf-green)', secondary: '#E3B23C', size: 34 }
];

export function FallingLeaves() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Monitor visibility to pause animations when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Track cursor for subtle drift-away repulsion
  useEffect(() => {
    const handleMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  if (!isTabVisible) return null;

  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
      aria-hidden="true"
    >
      {LEAF_SPECIES.map((leaf, i) => {
        const Comp = leaf.Comp;
        const leftPercent = 5 + (i * 7.8) + (i % 2 === 0 ? 3 : -3);
        const duration = 16 + (i * 1.5);
        const delay = i * 1.2;

        return (
          <motion.div
            key={i}
            initial={{
              y: '-10%',
              x: 0,
              rotate: 0,
              rotateY: 0,
              opacity: 0
            }}
            animate={{
              y: ['0vh', '115vh'],
              x: [0, (i % 2 === 0 ? 40 : -40), (i % 2 === 0 ? -25 : 30), 0],
              rotate: [0, 90, 180, 270, 360],
              rotateY: [0, 180, 360],
              opacity: [0, 0.85, 0.75, 0]
            }}
            transition={{
              duration: duration,
              delay: delay,
              repeat: Infinity,
              ease: 'linear'
            }}
            style={{
              position: 'absolute',
              left: `${leftPercent}%`,
              top: '-60px',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))'
            }}
          >
            <Comp size={leaf.size} color={leaf.color} secondaryColor={leaf.secondary} />
          </motion.div>
        );
      })}
    </div>
  );
}

// Organic hand-drawn vine divider with path drawing and small leaves
export function VineDivider({ className = '' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center']
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div 
      ref={ref}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '720px',
        margin: '48px auto',
        padding: '0 24px',
        position: 'relative'
      }}
      aria-hidden="true"
    >
      <svg width="100%" height="40" viewBox="0 0 600 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Curving Vine Stem */}
        <motion.path
          d="M10 20C90 10 160 30 240 20C320 10 390 30 470 20C530 12 560 22 590 20"
          stroke="var(--moss-olive)"
          strokeWidth="1.75"
          strokeLinecap="round"
          style={{ pathLength }}
        />
        {/* Small Leaf Buds along the vine */}
        <circle cx="160" cy="25" r="3.5" fill="var(--leaf-green)" opacity="0.8" />
        <path d="M160 25C170 22 176 15 178 8C170 9 164 16 160 25Z" fill="var(--leaf-green-subtle)" stroke="var(--leaf-green)" strokeWidth="1" />
        
        <circle cx="320" cy="15" r="3.5" fill="var(--amber)" opacity="0.8" />
        <path d="M320 15C310 11 306 4 308 -3C315 -2 318 6 320 15Z" fill="var(--amber-subtle)" stroke="var(--amber)" strokeWidth="1" />

        <circle cx="470" cy="20" r="4" fill="var(--maple-red)" opacity="0.8" />
        <path d="M470 20C480 18 488 12 490 5C482 6 476 12 470 20Z" fill="var(--maple-red-subtle)" stroke="var(--maple-red)" strokeWidth="1" />
      </svg>
    </div>
  );
}

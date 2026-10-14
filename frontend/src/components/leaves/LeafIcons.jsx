import React from 'react';

// Hand-drawn Maple Leaf with lobes and detailed veins
export function MapleLeaf({ size = 28, color = 'var(--maple-red)', secondaryColor = '#E3B23C', className = '', style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color, ...style }}
    >
      <defs>
        <linearGradient id={`mapleGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      {/* Outer Lobes */}
      <path 
        d="M32 6C30 14 26 18 20 16C21 21 16 23 12 21C14 26 10 28 6 29C11 34 8 38 12 42C17 40 19 43 21 47C25 43 27 45 28 50L31 58H33L36 50C37 45 39 43 43 47C45 43 47 40 52 42C56 38 53 34 58 29C54 28 50 26 52 21C48 23 43 21 44 16C38 18 34 14 32 6Z" 
        fill={`url(#mapleGrad-${size})`}
        stroke="currentColor" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Central and radiating veins */}
      <path d="M32 14V56" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 30L20 22M32 30L44 22M32 38L18 34M32 38L46 34M32 46L24 44M32 46L40 44" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Hand-drawn Oak Leaf with undulating lobes
export function OakLeaf({ size = 28, color = 'var(--amber)', secondaryColor = '#8A5A3B', className = '', style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color, ...style }}
    >
      <defs>
        <linearGradient id={`oakGrad-${size}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <path 
        d="M32 6C27 10 22 9 20 15C18 19 22 22 18 26C14 29 16 35 20 38C18 43 21 48 26 50L31 58H33L38 50C43 48 46 43 44 38C48 35 50 29 46 26C42 22 46 19 44 15C42 9 37 10 32 6Z" 
        fill={`url(#oakGrad-${size})`}
        stroke="currentColor" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path d="M32 10V56" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 20C26 19 22 21 20 23M32 28C24 27 20 30 18 32M32 37C26 36 22 39 20 42" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M32 20C38 19 42 21 44 23M32 28C40 27 44 30 46 32M32 37C38 36 42 39 44 42" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Hand-drawn Birch Leaf with pointed spade tip and serrated rim
export function BirchLeaf({ size = 26, color = 'var(--bark-brown)', secondaryColor = '#E3B23C', className = '', style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color, ...style }}
    >
      <defs>
        <linearGradient id={`birchGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <path 
        d="M32 6C23 15 15 25 18 38C20 45 26 50 31 58H33C38 50 44 45 46 38C49 25 41 15 32 6Z" 
        fill={`url(#birchGrad-${size})`}
        stroke="currentColor" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path d="M32 12V56" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 22L22 28M32 29L20 37M32 37L24 44" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M32 22L42 28M32 29L44 37M32 37L40 44" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Hand-drawn Elm / Broadleaf with asymmetrical curved base
export function ElmLeaf({ size = 26, color = 'var(--leaf-green)', secondaryColor = '#7A8B3A', className = '', style = {} }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ color, ...style }}
    >
      <defs>
        <linearGradient id={`elmGrad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.85" />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <path 
        d="M32 6C20 18 16 32 22 44C25 49 29 52 31 58H33C37 54 44 46 44 36C44 22 38 14 32 6Z" 
        fill={`url(#elmGrad-${size})`}
        stroke="currentColor" 
        strokeWidth="1.75" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path d="M32 10V56" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32 22L22 27M32 30L21 37M32 39L25 45" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M32 22L40 27M32 30L42 36M32 39L38 44" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export const FernLeaf = ElmLeaf;


// Organic Leaf + Droplet Brand Mark
export function LeafDropletMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="leafMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F9D5D" />
          <stop offset="100%" stopColor="#7A8B3A" />
        </linearGradient>
        <linearGradient id="dropMarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E3B23C" />
          <stop offset="100%" stopColor="#C0492F" />
        </linearGradient>
      </defs>
      {/* Base Leaf */}
      <path 
        d="M20 5C10 13 8 26 14 33C17 37 20 38 22 38C28 36 33 28 32 18C31 10 25 7 20 5Z" 
        fill="url(#leafMarkGrad)" 
        stroke="#4F9D5D" 
        strokeWidth="1.5"
      />
      <path d="M20 10V36" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" />
      {/* Precision Micro-Dosing Droplet */}
      <path 
        d="M26 18C26 21.5 23.5 24 20.5 24C17.5 24 15 21.5 15 18C15 15 20.5 11 20.5 11C20.5 11 26 15 26 18Z" 
        fill="url(#dropMarkGrad)"
        stroke="#E3B23C"
        strokeWidth="1"
      />
    </svg>
  );
}

// Decorative Corner Branch Illustration
export function BotanicalBranch({ width = 240, height = 240, style = {} }) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 200" fill="none" style={style}>
      <path 
        d="M20 190C40 150 70 110 120 70C150 46 180 30 190 20" 
        stroke="var(--border-strong)" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path d="M75 108C65 95 60 75 70 65C80 55 95 65 95 75C95 85 85 100 75 108Z" fill="var(--leaf-green-subtle)" stroke="var(--leaf-green)" strokeWidth="1.2" />
      <path d="M122 68C115 50 120 35 135 30C150 25 155 40 150 50C145 60 132 65 122 68Z" fill="var(--amber-subtle)" stroke="var(--amber)" strokeWidth="1.2" />
      <path d="M165 35C158 20 168 10 180 8C190 6 195 18 190 26C185 34 175 35 165 35Z" fill="var(--maple-red-subtle)" stroke="var(--maple-red)" strokeWidth="1.2" />
    </svg>
  );
}

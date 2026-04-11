import React from 'react';
import { motion } from 'motion/react';

interface VastuChakraProps {
  heading: number;
  currentZone: string;
}

const ZONES = [
  { name: 'North', angle: 0, color: '#3b82f6' },
  { name: 'North-East', angle: 45, color: '#22d3ee' },
  { name: 'East', angle: 90, color: '#10b981' },
  { name: 'South-East', angle: 135, color: '#f97316' },
  { name: 'South', angle: 180, color: '#f43f5e' },
  { name: 'South-West', angle: 225, color: '#b45309' },
  { name: 'West', angle: 270, color: '#64748b' },
  { name: 'North-West', angle: 315, color: '#a1a1aa' },
];

const VastuChakra: React.FC<VastuChakraProps> = ({ heading, currentZone }) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
      <motion.div
        animate={{ rotate: -heading }}
        transition={{ type: 'spring', stiffness: 50, damping: 20 }}
        className="relative w-[80%] aspect-square max-w-[500px]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {/* Outer Ring */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
          
          {/* Zone Wedges */}
          {ZONES.map((zone, i) => {
            const startAngle = (zone.angle - 22.5) * (Math.PI / 180);
            const endAngle = (zone.angle + 22.5) * (Math.PI / 180);
            const x1 = 50 + 45 * Math.sin(startAngle);
            const y1 = 50 - 45 * Math.cos(startAngle);
            const x2 = 50 + 45 * Math.sin(endAngle);
            const y2 = 50 - 45 * Math.cos(endAngle);
            
            const isCurrent = zone.name === currentZone;
            
            return (
              <g key={zone.name}>
                <path
                  d={`M 50 50 L ${x1} ${y1} A 45 45 0 0 1 ${x2} ${y2} Z`}
                  fill={isCurrent ? zone.color : 'transparent'}
                  fillOpacity={isCurrent ? 0.15 : 0}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="0.2"
                  className="transition-all duration-500"
                />
                {/* Direction Lines */}
                <line 
                  x1="50" y1="50" 
                  x2={50 + 48 * Math.sin(zone.angle * (Math.PI / 180))} 
                  y2={50 - 48 * Math.cos(zone.angle * (Math.PI / 180))}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="0.1"
                />
                {/* Labels */}
                <text
                  x={50 + 38 * Math.sin(zone.angle * (Math.PI / 180))}
                  y={50 - 38 * Math.cos(zone.angle * (Math.PI / 180))}
                  fill={isCurrent ? '#fff' : 'rgba(255,255,255,0.4)'}
                  fontSize="2.5"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${zone.angle}, ${50 + 38 * Math.sin(zone.angle * (Math.PI / 180))}, ${50 - 38 * Math.cos(zone.angle * (Math.PI / 180))})`}
                  className="uppercase tracking-widest transition-all duration-300"
                >
                  {zone.name.split('-').map(s => s[0]).join('')}
                </text>
              </g>
            );
          })}
          
          {/* Inner Circles */}
          <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
          <circle cx="50" cy="50" r="5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.1" />
          
          {/* Center Crosshair */}
          <line x1="48" y1="50" x2="52" y2="50" stroke="rgba(255,255,255,0.5)" strokeWidth="0.2" />
          <line x1="50" y1="48" x2="50" y2="52" stroke="rgba(255,255,255,0.5)" strokeWidth="0.2" />
        </svg>
      </motion.div>
    </div>
  );
};

export default VastuChakra;


import React from 'react';

const VastuChakra: React.FC = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
      <svg className="w-full h-full p-4" viewBox="0 0 100 100">
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-emerald-500/50" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-emerald-500/30" />
        
        {/* Compass Lines */}
        <line x1="50" y1="2" x2="50" y2="98" stroke="currentColor" strokeWidth="0.2" className="text-white/50" />
        <line x1="2" y1="50" x2="98" y2="50" stroke="currentColor" strokeWidth="0.2" className="text-white/50" />
        <line x1="15" y1="15" x2="85" y2="85" stroke="currentColor" strokeWidth="0.2" className="text-white/50" />
        <line x1="85" y1="15" x2="15" y2="85" stroke="currentColor" strokeWidth="0.2" className="text-white/50" />
        
        {/* Directions */}
        <text x="50" y="8" fontSize="4" textAnchor="middle" className="fill-emerald-400 font-bold">N</text>
        <text x="50" y="96" fontSize="4" textAnchor="middle" className="fill-white/70">S</text>
        <text x="96" y="52" fontSize="4" textAnchor="middle" className="fill-white/70">E</text>
        <text x="4" y="52" fontSize="4" textAnchor="middle" className="fill-white/70">W</text>
        
        <text x="82" y="18" fontSize="3" textAnchor="middle" className="fill-white/50">NE</text>
        <text x="82" y="84" fontSize="3" textAnchor="middle" className="fill-white/50">SE</text>
        <text x="18" y="84" fontSize="3" textAnchor="middle" className="fill-white/50">SW</text>
        <text x="18" y="18" fontSize="3" textAnchor="middle" className="fill-white/50">NW</text>
        
        {/* Brahmasthan Center */}
        <circle cx="50" cy="50" r="2" fill="currentColor" className="text-amber-500" />
        <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="0.1" className="text-amber-500/50" strokeDasharray="1 1" />
      </svg>
    </div>
  );
};

export default VastuChakra;

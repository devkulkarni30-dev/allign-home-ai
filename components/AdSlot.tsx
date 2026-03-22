
import React, { useEffect } from 'react';

interface AdSlotProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

const AdSlot: React.FC<AdSlotProps> = ({ slotId = "DEFAULT_SLOT", format = "auto", className = "" }) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn("AdSense push failed", e);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <span className="ad-label">SPONSORED</span>
      {/* Real AdSense Tag */}
      <ins className="adsbygoogle"
           style={{ display: 'block', width: '100%' }}
           data-ad-client="ca-pub-YOUR_CLIENT_ID"
           data-ad-slot={slotId}
           data-ad-format={format}
           data-full-width-responsive="true"></ins>
      
      {/* Development Placeholder UI */}
      <div className="text-slate-600 text-xs font-medium uppercase tracking-widest">
        Space for Advertisement
      </div>
    </div>
  );
};

export default AdSlot;

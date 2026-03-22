
import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('vaastua_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAction = (accepted: boolean) => {
    localStorage.setItem('vaastua_cookie_consent', accepted ? 'accepted' : 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[200] animate-in slide-in-from-bottom-12 duration-700">
      <div className="max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-2xl border border-slate-800 p-6 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 21c4.418 0 8-3.582 8-8V7l-8-4-8 4v4c0 1.24.28 2.415.783 3.463"/></svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Vedic Experience Optimization</h4>
            <p className="text-xs text-slate-400 leading-relaxed">We use essential cookies to maintain your architectural sessions and ensure precise neural analysis. No personal floor plans are shared with unauthorized parties.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => handleAction(false)}
            className="flex-1 md:flex-none px-6 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-all"
          >
            Strictly Necessary
          </button>
          <button 
            onClick={() => handleAction(true)}
            className="flex-1 md:flex-none px-8 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

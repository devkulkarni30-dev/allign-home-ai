
import React, { useMemo } from 'react';
import { VastuResult } from '../types';
import VastuChakra from './VastuChakra';

interface Props {
  data: VastuResult;
  imagePreview?: string;
  hideHeader?: boolean;
}

const ResultReport: React.FC<Props> = ({ data, imagePreview, hideHeader = false }) => {
  if (!data) return null;

  const scoreValue = typeof data.score === 'number' ? data.score : 0;
  const projectedScoreValue = typeof data.projectedScore === 'number' ? data.projectedScore : scoreValue;
  const scannedElementsCount = typeof data.scannedElementsCount === 'number' ? data.scannedElementsCount : 0;
  const complianceTable = Array.isArray(data.complianceTable) ? data.complianceTable : [];
  const remedyObjects = Array.isArray(data.remedyObjects) ? data.remedyObjects : [];
  const furnitureDetections = Array.isArray(data.furnitureDetections) ? data.furnitureDetections : [];

  const getTrafficColor = (score: number) => {
    if (score >= 85) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', accent: 'emerald' };
    if (score >= 60) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', accent: 'amber' };
    return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', glow: 'shadow-rose-500/20', accent: 'rose' };
  };

  const style = getTrafficColor(scoreValue);

  const stats = useMemo(() => {
    const compliant = complianceTable.filter(r => !r.status.includes('❌') && !r.status.toLowerCase().includes('conflict')).length;
    const total = complianceTable.length;
    const percentage = total > 0 ? Math.round((compliant / total) * 100) : 0;
    return { compliant, total, percentage };
  }, [complianceTable]);

  const elementBalance = useMemo(() => {
    const balance: Record<string, { score: number; total: number; zones: string[] }> = {
      Water: { score: 0, total: 0, zones: ['N', 'NE'] },
      Air: { score: 0, total: 0, zones: ['E'] },
      Fire: { score: 0, total: 0, zones: ['SE'] },
      Earth: { score: 0, total: 0, zones: ['S', 'SW'] },
      Space: { score: 0, total: 0, zones: ['W', 'NW'] }
    };

    complianceTable.forEach(row => {
      Object.entries(balance).forEach(([element, data]) => {
        if (data.zones.includes(row.currentZone)) {
          data.total++;
          if (!row.status.includes('❌') && !row.status.toLowerCase().includes('conflict')) data.score++;
        }
      });
    });

    return balance;
  }, [complianceTable]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [saveName, setSaveName] = React.useState(`Audit - ${new Date().toLocaleDateString()}`);
  const [saveCategory, setSaveCategory] = React.useState('Residential');

  const handleSaveToProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result: data,
          preview: imagePreview,
          name: saveName,
          category: saveCategory
        })
      });
      if (res.ok) {
        setSaveSuccess(true);
        setShowSaveModal(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save report:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareWhatsApp = () => {
    const reportId = `VAI-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    let auditSummary = `🏛️ *ALIGNHOME.AI NEURAL AUDIT*\n`;
    auditSummary += `🆔 *Report ID:* ${reportId}\n`;
    auditSummary += `━━━━━━━━━━━━━━━━━━━━\n`;
    auditSummary += `🏆 *Current Score:* ${scoreValue}%\n`;
    auditSummary += `✨ *Projected Score:* ${projectedScoreValue}%\n`;
    auditSummary += `📋 *Vedic Status:* ${data.status}\n\n`;
    
    auditSummary += `📍 *KEY FINDINGS:*\n`;
    complianceTable.slice(0, 4).forEach(row => {
      const icon = row.status.includes('❌') ? '🚩' : '✅';
      auditSummary += `${icon} *${row.area}*: ${row.currentZone}\n`;
    });
    
    auditSummary += `\n🔗 Analyze your layout at AlignHome.ai`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(auditSummary)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = new Date().toISOString().split('T')[0];
    document.title = `AlignHome_Audit_Report_${dateStr}`;
    window.print();
    document.title = originalTitle;
  };

  const getNorthRotationClass = (dir?: string) => {
    switch(dir) {
      case 'UP': return 'rotate-0';
      case 'DOWN': return 'rotate-180';
      case 'LEFT': return '-rotate-90';
      case 'RIGHT': return 'rotate-90';
      case 'TILTED_CLOCKWISE': return 'rotate-45';
      case 'TILTED_ANTICLOCKWISE': return '-rotate-45';
      default: return 'rotate-0';
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-32 text-slate-100 print:text-slate-950 print:pb-0 print:space-y-10">
      
      {/* 1. Header Section */}
      {!hideHeader && (
        <div className="bg-slate-900 border border-slate-800 p-5 md:p-12 rounded-2xl md:rounded-[3.5rem] shadow-2xl relative overflow-hidden print:border-none print:p-0 print:bg-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[120px] pointer-events-none print:hidden" />
          <div className="relative z-10 flex flex-col items-center text-center gap-4 md:gap-6">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-emerald-500 rounded-xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 print:shadow-none">
              <svg className="w-8 h-8 md:w-12 md:h-12 text-slate-950" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="space-y-1 md:space-y-2">
              <h1 className="text-2xl md:text-6xl font-serif font-bold tracking-tight text-white print:text-slate-950">Neural Vastu Audit</h1>
              <p className="text-[8px] md:text-xs text-slate-500 uppercase tracking-[0.3em] md:tracking-[0.4em] font-black print:text-slate-500">Architectural Precision • Vedic Intelligence</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 mt-4 no-print">
              <button 
                onClick={() => setShowSaveModal(true)} 
                disabled={isSaving || saveSuccess}
                className={`px-6 py-3 md:px-8 md:py-4 ${saveSuccess ? 'bg-emerald-500' : 'bg-slate-800 hover:bg-slate-700'} text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all flex items-center gap-2 md:gap-3 shadow-xl active:scale-95 disabled:opacity-50`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                ) : (
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
                )}
                {saveSuccess ? 'Saved' : 'Save'}
              </button>
              <button onClick={handleShareWhatsApp} className="px-6 py-3 md:px-8 md:py-4 bg-[#25D366] hover:bg-[#128C7E] text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all flex items-center gap-2 md:gap-3 shadow-xl active:scale-95">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share
              </button>
              <button onClick={handlePrint} className="px-6 py-3 md:px-8 md:py-4 bg-white hover:bg-slate-100 text-slate-950 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all flex items-center gap-2 md:gap-3 shadow-xl active:scale-95">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Calibration Section */}
      <section className="bg-slate-900 border border-slate-800 p-5 md:p-8 rounded-2xl md:rounded-[3rem] shadow-2xl relative overflow-hidden group print:bg-white print:border-slate-200">
         <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
            <div className="relative w-28 h-28 md:w-44 md:h-44 shrink-0 flex items-center justify-center">
               <div className={`w-full h-full transition-transform duration-[1500ms] ${getNorthRotationClass(data.inferredNorth)}`}>
                  <svg className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] print:drop-shadow-none" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-700 print:text-slate-300" />
                     <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" className="text-emerald-500/20 print:text-slate-100" />
                     <path d="M50 8 L58 50 L50 92 L42 50 Z" fill="currentColor" className="text-emerald-500" />
                     <g transform="translate(50, 18)">
                        <rect x="-7" y="-7" width="14" height="14" rx="3" fill="currentColor" className="text-slate-950 print:fill-slate-100" />
                        <text x="0" y="4" fontSize="10" textAnchor="middle" fontWeight="900" fill="currentColor" className="text-emerald-400 print:fill-slate-950">N</text>
                     </g>
                  </svg>
               </div>
            </div>

            <div className="space-y-4 text-center md:text-left flex-1">
               <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 print:bg-slate-50 print:border-slate-200">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 print:bg-slate-400" />
                     <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400 print:text-slate-600">Locked Directional Vector</span>
                  </div>
                  {data.shapeType && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 print:bg-slate-50 print:border-slate-200">
                       <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 print:text-slate-600">Shape: {data.shapeType}</span>
                    </div>
                  )}
                  {data.layoutComplexity && (
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 print:bg-slate-50 print:border-slate-200">
                       <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 print:text-slate-600">Complexity: {data.layoutComplexity}</span>
                    </div>
                  )}
               </div>
               <div className="space-y-3">
                  <h3 className="text-2xl md:text-4xl font-serif font-bold text-white leading-tight print:text-slate-950">
                    {data.inferredNorthDescription || "North Alignment Locked"}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xl font-medium print:text-slate-600">
                    Neural analysis has synchronized the 16-zone Vedic grid to the detected North axis. All spatial audits are calibrated to this geometric baseline.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Vedic Verdict Section */}
      {data.verdict && (
        <section className={`p-5 md:p-12 rounded-2xl md:rounded-[3.5rem] border ${
          data.verdict === 'EXCELLENT' || data.verdict === 'GOOD' ? 'border-emerald-500/30 bg-emerald-500/5' :
          data.verdict === 'AVERAGE' ? 'border-amber-500/30 bg-amber-500/5' :
          'border-rose-500/30 bg-rose-500/5'
        } shadow-2xl relative overflow-hidden print:bg-white print:border-slate-200`}>
          <div className="flex flex-col md:flex-row items-center gap-5 md:gap-8 relative z-10">
            <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center shrink-0 border-2 md:border-4 ${
              data.verdict === 'EXCELLENT' || data.verdict === 'GOOD' ? 'border-emerald-500 text-emerald-500' :
              data.verdict === 'AVERAGE' ? 'border-amber-500 text-amber-500' :
              'border-rose-500 text-rose-500'
            }`}>
              <span className="text-2xl md:text-4xl font-black">{data.verdict[0]}</span>
            </div>
            <div className="space-y-2 md:space-y-3 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3">
                <h2 className="text-lg md:text-3xl font-serif font-bold text-white print:text-slate-950">Vedic Verdict: {data.verdict}</h2>
                <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse hidden md:block ${
                  data.verdict === 'EXCELLENT' || data.verdict === 'GOOD' ? 'bg-emerald-500' :
                  data.verdict === 'AVERAGE' ? 'bg-amber-500' :
                  'bg-rose-500'
                }`} />
              </div>
              <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium print:text-slate-700">
                {data.verdictDescription}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 3. Summary Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6 print:grid-cols-5">
        <div className={`p-4 md:p-10 rounded-2xl md:rounded-[3rem] border ${style.border} ${style.bg} flex flex-col items-center justify-center text-center space-y-1 md:space-y-2 print:border-slate-200 print:bg-slate-50`}>
           <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-black text-slate-500">Compliance</p>
           <div className={`text-3xl md:text-8xl font-serif font-bold ${style.text} print:text-slate-950`}>{scoreValue}%</div>
        </div>

        <div className="p-4 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-center space-y-2 md:space-y-4 print:bg-white print:border-slate-200">
           <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-black text-slate-500">Neural Status</p>
           <div className="text-sm md:text-2xl font-serif font-bold text-white leading-tight print:text-slate-950">
             {data.status}
           </div>
           <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden print:bg-slate-100">
             <div className="h-full bg-emerald-500" style={{ width: `${scoreValue}%` }} />
           </div>
        </div>

        {data.verdict && (
          <div className={`p-4 md:p-10 rounded-2xl md:rounded-[3rem] border ${
            data.verdict === 'EXCELLENT' || data.verdict === 'GOOD' ? 'border-emerald-500/30 bg-emerald-500/10' :
            data.verdict === 'AVERAGE' ? 'border-amber-500/30 bg-amber-500/10' :
            'border-rose-500/30 bg-rose-500/10'
          } flex flex-col items-center justify-center text-center space-y-2 md:space-y-4 print:bg-white print:border-slate-200`}>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-black text-slate-500">AI Verdict</p>
            <div className={`text-sm md:text-2xl font-serif font-bold ${
              data.verdict === 'EXCELLENT' || data.verdict === 'GOOD' ? 'text-emerald-400' :
              data.verdict === 'AVERAGE' ? 'text-amber-400' :
              'text-rose-400'
            } leading-tight print:text-slate-950`}>
              {data.verdict}
            </div>
            <div className={`w-2 h-2 md:w-4 md:h-4 rounded-full ${
              data.verdict === 'EXCELLENT' || data.verdict === 'GOOD' ? 'bg-emerald-500' :
              data.verdict === 'AVERAGE' ? 'bg-amber-500' :
              'bg-rose-500'
            }`} />
          </div>
        )}

        <div className="p-4 md:p-10 rounded-2xl md:rounded-[3rem] border border-emerald-500/20 bg-emerald-500/[0.03] flex flex-col items-center justify-center text-center space-y-2 md:space-y-4 relative overflow-hidden group print:bg-emerald-50 print:border-emerald-200">
           <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-black text-slate-400">Projected</p>
           <div className="text-3xl md:text-8xl font-serif font-bold text-emerald-400 print:text-emerald-700">{projectedScoreValue}%</div>
           <p className="text-[7px] md:text-[9px] text-emerald-500/60 font-black uppercase tracking-widest print:text-emerald-600">Post-Remedy</p>
        </div>

        <div className="p-4 md:p-10 rounded-2xl md:rounded-[3rem] border border-slate-800 bg-slate-900/40 flex flex-col items-center justify-center text-center space-y-2 md:space-y-4 print:bg-white print:border-slate-200 col-span-2 lg:col-span-1">
           <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-black text-slate-500">Scan Coverage</p>
           <div className="text-2xl md:text-4xl font-serif font-bold text-white print:text-slate-950">{scannedElementsCount}</div>
           <p className="text-[7px] md:text-[9px] text-slate-500 font-black uppercase tracking-widest">Architectural Elements</p>
           <div className="flex gap-1">
              {Array.from({ length: Math.min(10, scannedElementsCount) }).map((_, i) => (
                <div key={i} className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500/40" />
              ))}
           </div>
        </div>
      </section>

      {/* Pancha Bhoota (Five Elements) Analysis */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[3.5rem] p-5 md:p-10 space-y-6 md:space-y-8 relative overflow-hidden print:border-slate-300 print:bg-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
        <div className="space-y-1 md:space-y-2 relative">
          <h2 className="text-xl md:text-3xl font-serif font-bold text-white print:text-slate-950">Pancha Bhoota Analysis</h2>
          <p className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-black">Five Elements Equilibrium Audit</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-6 relative">
          {(Object.entries(elementBalance) as [string, { score: number; total: number; zones: string[] }][]).map(([element, data]) => {
            const percentage = data.total === 0 ? 100 : Math.round((data.score / data.total) * 100);
            const colorClass = percentage > 70 ? 'text-emerald-400' : percentage > 40 ? 'text-amber-400' : 'text-rose-400';
            const bgClass = percentage > 70 ? 'bg-emerald-500/10' : percentage > 40 ? 'bg-amber-500/10' : 'bg-rose-500/10';
            
            return (
              <div key={element} className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-800 flex flex-col items-center text-center space-y-3 md:space-y-4 transition-all hover:border-slate-700 ${bgClass}`}>
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-950 flex items-center justify-center shadow-inner">
                  <span className={`text-base md:text-lg font-black ${colorClass}`}>{element[0]}</span>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  <h4 className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest">{element}</h4>
                  <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase">{data.zones.join(', ')}</p>
                </div>
                <div className="w-full space-y-1.5 md:space-y-2">
                  <div className="flex justify-between text-[7px] md:text-[8px] font-black uppercase tracking-tighter">
                    <span className="text-slate-500">Balance</span>
                    <span className={colorClass}>{percentage}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${percentage > 70 ? 'bg-emerald-500' : percentage > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                      style={{ width: `${percentage}%` }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 md:p-6 bg-slate-950/50 rounded-2xl md:rounded-3xl border border-slate-800/50">
          <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed italic">
            <span className="text-emerald-500 font-bold">Insight:</span> The Five Elements must be in harmony for optimal spatial energy. 
            {Object.values(elementBalance).some((d: any) => d.total > 0 && d.score / d.total < 0.5) 
              ? " Significant imbalances detected in your spatial elements."
              : " Your spatial elements are largely in equilibrium."}
          </p>
        </div>
      </section>

      {/* 4. Overlay Map */}
      {imagePreview && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[3.5rem] overflow-hidden shadow-2xl relative print:border-slate-300 print:shadow-none print-break-inside-avoid">
           <div className="relative w-full">
             <img src={imagePreview} className="w-full h-auto block p-4 md:p-12 z-10 print:p-6" alt="Analysis Visualization" />
             
             {/* Conflict Highlighting Overlay */}
             <div className="absolute inset-0 z-20 pointer-events-none p-4 md:p-12 print:p-6">
               <div className="relative w-full h-full">
                 {data.roomDetections?.map((det, i) => {
                   const matchedRow = complianceTable.find(row => 
                     (row.area.toLowerCase().includes(det.name.toLowerCase()) || det.name.toLowerCase().includes(row.area.toLowerCase())) &&
                     (row.status.includes('❌') || row.status.toLowerCase().includes('conflict'))
                   );
                   
                   if (!matchedRow) return null;
                   
                   const [ymin, xmin, ymax, xmax] = det.box2d;
                   const isHighConflict = matchedRow.status.toLowerCase().includes('high');
                   
                   return (
                     <div 
                       key={`room-${i}`}
                       className={`absolute border-2 rounded-2xl transition-all duration-1000 ${
                         isHighConflict 
                           ? 'border-rose-600 bg-rose-600/20 shadow-[0_0_40px_rgba(225,29,72,0.5)] animate-pulse print:animate-none' 
                           : 'border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                       }`}
                       style={{
                         top: `${ymin / 10}%`,
                         left: `${xmin / 10}%`,
                         height: `${(ymax - ymin) / 10}%`,
                         width: `${(xmax - xmin) / 10}%`,
                       }}
                     >
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-1 whitespace-nowrap">
                          <span className={`${isHighConflict ? 'bg-rose-600' : 'bg-amber-600'} text-white text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 border border-white/20`}>
                             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                               <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                             </svg>
                             {isHighConflict ? 'High Conflict' : 'Zonal Dosha'}
                          </span>
                       </div>
                     </div>
                   );
                 })}

                 {furnitureDetections.map((fur, i) => {
                   const [ymin, xmin, ymax, xmax] = fur.box2d;
                   return (
                     <div 
                       key={`fur-${i}`}
                       className={`absolute border rounded-lg transition-all duration-1000 ${
                         fur.isCompliant 
                           ? 'border-emerald-500 bg-emerald-500/10' 
                           : 'border-amber-500 bg-amber-500/20'
                       }`}
                       style={{
                         top: `${ymin / 10}%`,
                         left: `${xmin / 10}%`,
                         height: `${(ymax - ymin) / 10}%`,
                         width: `${(xmax - xmin) / 10}%`,
                       }}
                     >
                       <div className="absolute bottom-0 left-0 bg-slate-900/80 px-1 rounded text-[6px] text-white font-bold uppercase truncate max-w-full">
                         {fur.name}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>

             <div className="absolute inset-0 opacity-10 pointer-events-none z-0 print:opacity-20"><VastuChakra /></div>
           </div>
        </div>
      )}

      {/* 5. Breakdown Table */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-2xl md:rounded-[3rem] overflow-hidden print:bg-white print:border-slate-200 print-break-inside-avoid">
        <div className="p-5 md:p-8 border-b border-slate-800 flex items-center justify-between print:border-slate-100 print:p-6">
           <div className="space-y-0.5 md:space-y-1">
              <h2 className="text-lg md:text-2xl font-serif font-bold text-white print:text-slate-950">Architectural Breakdown</h2>
              <p className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Detailed Zonal Compliance Audit</p>
           </div>
           <div className="flex gap-2 md:gap-4">
              <div className="text-center">
                 <p className="text-[8px] md:text-[10px] text-emerald-400 font-black">{stats.compliant}</p>
                 <p className="text-[7px] md:text-[8px] text-slate-500 uppercase font-bold">Compliant</p>
              </div>
              <div className="text-center">
                 <p className="text-[8px] md:text-[10px] text-rose-400 font-black">{stats.total - stats.compliant}</p>
                 <p className="text-[7px] md:text-[8px] text-slate-500 uppercase font-bold">Conflicts</p>
              </div>
           </div>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left min-w-[500px] md:min-w-full">
            <thead className="bg-slate-800/50 text-[8px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-black text-slate-400 print:bg-slate-50 print:text-slate-600">
              <tr>
                <th className="px-4 md:px-10 py-3 md:py-6 print:px-6">Element</th>
                <th className="px-4 md:px-10 py-3 md:py-6 print:px-6">Zone</th>
                <th className="px-4 md:px-10 py-3 md:py-6 print:px-6">Status</th>
                <th className="px-4 md:px-10 py-3 md:py-6 print:px-6">Ideal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30 text-[10px] md:text-sm print:divide-slate-100">
              {complianceTable.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] print:hover:bg-transparent transition-colors">
                  <td className="px-4 md:px-10 py-3 md:py-6 font-bold text-slate-200 print:text-slate-900 print:px-6">{row.area}</td>
                  <td className="px-4 md:px-10 py-3 md:py-6 text-slate-400 print:text-slate-600 print:px-6">{row.currentZone}</td>
                  <td className="px-4 md:px-10 py-3 md:py-6 print:px-6">
                    <span className={`px-2 md:px-4 py-0.5 md:py-1.5 rounded-md md:rounded-xl text-[7px] md:text-[10px] font-black uppercase tracking-wider ${
                      row.status.toLowerCase().includes('high conflict') 
                        ? 'bg-rose-600/20 text-rose-500 border border-rose-500/20' 
                        : row.status.includes('❌') 
                          ? 'bg-rose-500/10 text-rose-400' 
                          : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {row.status.toLowerCase().includes('high conflict') ? 'High' : row.status.includes('❌') ? 'Conflict' : 'OK'}
                    </span>
                  </td>
                  <td className="px-4 md:px-10 py-3 md:py-6 text-slate-500 print:text-slate-400 print:px-6">{row.idealZone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Room-by-Room Detailed Insights */}
      {data.roomDetections && data.roomDetections.length > 0 && (
        <section className="space-y-6 md:space-y-8">
          <div className="flex items-center gap-3 md:gap-4">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-white">Spatial Node Insights</h2>
            <div className="h-[1px] flex-1 bg-slate-800" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {data.roomDetections.map((det, i) => {
              const matchedRow = complianceTable.find(row => 
                (row.area.toLowerCase().includes(det.name.toLowerCase()) || det.name.toLowerCase().includes(row.area.toLowerCase()))
              );
              
              const isCompliant = matchedRow ? !matchedRow.status.includes('❌') : true;
              const zone = matchedRow?.currentZone || 'Unknown';
              const idealZone = matchedRow?.idealZone || 'N/A';

              return (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 space-y-3 md:space-y-4 hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5 md:space-y-1">
                      <h4 className="text-lg md:text-xl font-bold text-white">{det.name}</h4>
                      <p className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-black">Zone: {zone}</p>
                    </div>
                    <div className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest ${isCompliant ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {isCompliant ? 'Harmonized' : 'Dosha'}
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:space-y-3">
                    <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed">
                      {isCompliant 
                        ? `The ${det.name} is perfectly aligned with the ${zone} zone.`
                        : `The ${det.name} in the ${zone} zone creates a spatial conflict. Ideally, it should be in the ${idealZone} zone.`}
                    </p>
                    
                    {!isCompliant && (
                      <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                        <svg className="w-2.5 h-2.5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Remediation Required
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Furniture Vastu Audit */}
      {furnitureDetections.length > 0 && (
        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl md:rounded-[3rem] overflow-hidden print:bg-white print:border-slate-200 print-break-inside-avoid">
          <div className="p-5 md:p-8 border-b border-slate-800 flex items-center justify-between print:border-slate-100 print:p-6">
            <div className="space-y-0.5 md:space-y-1">
              <h2 className="text-lg md:text-2xl font-serif font-bold text-white print:text-slate-950">Furniture Vastu Audit</h2>
              <p className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest font-bold">Placement & Orientation Analysis</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 p-5 md:p-8">
            {furnitureDetections.map((fur, i) => (
              <div key={i} className={`p-4 md:p-6 rounded-xl md:rounded-2xl border ${fur.isCompliant ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'} space-y-2 md:space-y-3`}>
                <div className="flex justify-between items-start">
                  <h4 className="text-base md:text-lg font-bold text-white">{fur.name}</h4>
                  <span className={`px-2 py-0.5 md:py-1 rounded text-[7px] md:text-[8px] font-black uppercase ${fur.isCompliant ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}`}>
                    {fur.zone}
                  </span>
                </div>
                <p className="text-[10px] md:text-xs text-slate-400">{fur.message}</p>
                {fur.remedy && (
                  <div className="p-2 md:p-3 bg-slate-950/50 rounded-lg md:rounded-xl border border-slate-800">
                    <p className="text-[7px] md:text-[8px] font-black uppercase text-amber-500 mb-0.5 md:mb-1">Remedy</p>
                    <p className="text-[9px] md:text-[10px] text-slate-300 italic">{fur.remedy}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Remediation Roadmap */}
      <section className="space-y-6 md:space-y-8 print-break-before-page">
        <div className="flex items-center gap-4 md:gap-5 border-l-[8px] md:border-l-[12px] border-emerald-500 pl-5 md:pl-8 print:border-slate-400">
           <div>
              <h2 className="text-xl md:text-4xl font-serif font-bold text-white print:text-slate-950">Remediation Roadmap</h2>
              <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5 md:mt-1 print:text-slate-400">Strategic Interventions for Equilibrium</p>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 print:grid-cols-1">
          {remedyObjects.length > 0 ? remedyObjects.map((obj, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl md:rounded-[3rem] p-6 md:p-10 space-y-4 md:space-y-6 hover:border-emerald-500/30 transition-all shadow-2xl relative print:border-slate-200 print:bg-white print:p-8 print-break-inside-avoid">
              <div className="space-y-1.5 md:space-y-3">
                <span className="text-[8px] md:text-[10px] font-black uppercase text-rose-500 tracking-[0.2em] md:tracking-[0.3em]">Detected Conflict</span>
                <p className="text-base md:text-xl font-bold text-white leading-tight print:text-slate-950">{obj.conflict}</p>
              </div>
              <div className="space-y-2 md:space-y-3 bg-emerald-500/5 p-4 md:p-6 rounded-xl md:rounded-2xl border border-emerald-500/10 print:bg-slate-50 print:border-slate-100">
                <span className="text-[8px] md:text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em] md:tracking-[0.3em] print:text-emerald-700">Recommended Correction</span>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium print:text-slate-700">{obj.remedy}</p>
              </div>
              <div className="pt-4 md:pt-6 border-t border-slate-800/50 flex items-center justify-between print:border-slate-100">
                <div className="space-y-1">
                   <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-600 tracking-widest block">Impact</span>
                   <div className="flex items-center gap-2">
                      <div className="w-16 md:w-24 h-1 md:h-1.5 bg-slate-800 rounded-full overflow-hidden print:bg-slate-100">
                         <div className="h-full bg-emerald-500" style={{ width: obj.impact.includes('%') ? obj.impact : '85%' }} />
                      </div>
                      <span className="text-[10px] md:text-xs font-bold text-emerald-400 print:text-emerald-700">{obj.impact}</span>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-[8px] md:text-[9px] font-black uppercase text-slate-600 tracking-widest block">Projected</span>
                   <span className="text-sm md:text-lg font-serif font-bold text-white print:text-slate-950">+{Math.round((projectedScoreValue - scoreValue) / (remedyObjects.length || 1))}%</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 md:py-20 text-center border-2 md:border-4 border-dashed border-slate-800 rounded-2xl md:rounded-[4rem] print:border-slate-200">
               <p className="font-serif italic text-slate-500 text-base md:text-xl">Perfect flow identified. No structural intervention necessary.</p>
            </div>
          )}
        </div>
      </section>

      {/* 7. Verification Seal */}
      <section className="bg-slate-950 border border-slate-800 p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-2xl print:border-slate-200 print:bg-white print:mt-12">
          <div className="shrink-0 flex items-center justify-center w-20 h-20 md:w-28 md:h-28 bg-slate-900 border border-slate-800 rounded-xl md:rounded-[2.5rem] relative overflow-hidden print:border-slate-100">
             {data.generatedSymbolUrl && (
               <img src={data.generatedSymbolUrl} className="w-12 h-12 md:w-16 md:h-16 grayscale brightness-125 opacity-70 relative z-10 print:opacity-40" alt="Vedic Seal" />
             )}
          </div>
          <div className="flex-1 space-y-2 md:space-y-4 text-center md:text-left">
            <h4 className="text-[8px] md:text-xs font-black text-white print:text-slate-900 uppercase tracking-[0.3em] md:tracking-[0.4em]">Audit Fingerprint: {Math.random().toString(36).substr(2, 10).toUpperCase()}</h4>
            <p className="text-[8px] md:text-[10px] text-slate-500 leading-relaxed italic font-medium max-w-2xl print:text-slate-400">
              This report utilizes high-precision neural vision to evaluate architectural spatial energy. Final structural changes should be validated by on-site civil consultants.
            </p>
          </div>
          <div className="shrink-0 text-center md:text-right">
             <div className="px-3 py-1 md:px-4 md:py-2 bg-emerald-500/10 rounded-full border border-emerald-500/30 mb-1 md:mb-2 print:border-slate-200 print:bg-slate-50">
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500 print:text-slate-600">Authenticity Verified</span>
             </div>
             <p className="text-[8px] md:text-[10px] text-slate-600 font-bold uppercase">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
      </section>
      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 no-print">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowSaveModal(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-serif font-bold text-white mb-8">Save Neural Audit</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Audit Name</label>
                <input 
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Dream Home Layout"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                <select 
                  value={saveCategory}
                  onChange={(e) => setSaveCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white appearance-none"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Villa">Villa</option>
                  <option value="Office">Office</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                >Cancel</button>
                <button 
                  onClick={handleSaveToProfile}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center"
                >
                  {isSaving ? <div className="w-5 h-5 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" /> : 'Save Audit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultReport;

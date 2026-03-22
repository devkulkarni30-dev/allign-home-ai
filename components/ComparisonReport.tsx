
import React, { useMemo } from 'react';
import { ComparisonData } from '../types';
import ResultReport from './ResultReport';

interface Props {
  data: ComparisonData;
  onReset: () => void;
  onHome: () => void;
}

const ComparisonReport: React.FC<Props> = ({ data, onReset, onHome }) => {
  const { resultA, resultB, previewA, previewB } = data;
  
  const { winner, verdict } = useMemo(() => {
    const tie = resultA.score === resultB.score;
    const win = resultA.score > resultB.score ? 'A' : 'B';
    const lose = win === 'A' ? 'B' : 'A';
    
    if (tie) return { winner: null, verdict: "Both layouts achieve equal Vedic resonance. Selection may be based on secondary functional preferences." };
    
    const diff = Math.abs(resultA.score - resultB.score);
    const msg = `Layout ${win} is the superior architectural choice with a ${diff}% higher compliance margin. It resolves critical conflicts found in Layout ${lose}.`;
    
    return { winner: win, verdict: msg };
  }, [resultA.score, resultB.score]);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
      
      {/* 🏆 Superior Verdict Banner */}
      <section className="bg-slate-900 border-2 border-emerald-500/30 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            Superior Layout Identified
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">The Architectural Verdict</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">{verdict}</p>
        </div>
      </section>

      {/* Side-by-Side Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className={`relative flex flex-col space-y-8 p-10 rounded-[3rem] border-2 transition-all ${winner === 'A' ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-slate-800'}`}>
          {winner === 'A' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Best Energy Flow</div>}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl font-bold border border-slate-700">A</div>
            <div>
              <h3 className="text-xl font-serif font-bold">Variation A</h3>
              <p className="text-xs text-slate-500 uppercase font-black">Score: {resultA.score}%</p>
            </div>
          </div>
          <ResultReport data={resultA} imagePreview={previewA} hideHeader />
        </div>

        <div className={`relative flex flex-col space-y-8 p-10 rounded-[3rem] border-2 transition-all ${winner === 'B' ? 'border-emerald-500/40 bg-emerald-500/[0.02]' : 'border-slate-800'}`}>
          {winner === 'B' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Best Energy Flow</div>}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl font-bold border border-slate-700">B</div>
            <div>
              <h3 className="text-xl font-serif font-bold">Variation B</h3>
              <p className="text-xs text-slate-500 uppercase font-black">Score: {resultB.score}%</p>
            </div>
          </div>
          <ResultReport data={resultB} imagePreview={previewB} hideHeader />
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-8">
        <button onClick={onHome} className="px-10 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold transition-all text-white border border-slate-700">Back to Home</button>
        <button onClick={onReset} className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold transition-all border border-emerald-400">Start New Comparison</button>
      </div>
    </div>
  );
};

export default ComparisonReport;

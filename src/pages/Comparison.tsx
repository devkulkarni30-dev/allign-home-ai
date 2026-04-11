import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import Layout from '../components/Layout';
import { analyzeFloorPlan, detectUnits } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Download, RefreshCw, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ComparisonProps {
  user: User | null;
  onLogout: () => void;
}

const Comparison: React.FC<ComparisonProps> = ({ user, onLogout }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [layout1, setLayout1] = useState<string | null>(null);
  const [layout2, setLayout2] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{ r1: any; r2: any } | null>(null);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'detecting' | 'selecting' | 'analyzing'>('idle');
  const [detectedUnits1, setDetectedUnits1] = useState<string[]>([]);
  const [detectedUnits2, setDetectedUnits2] = useState<string[]>([]);
  const [selectedUnit1, setSelectedUnit1] = useState<string>('');
  const [selectedUnit2, setSelectedUnit2] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (slot === 1) setLayout1(reader.result as string);
        else setLayout2(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompare = async () => {
    if (!layout1 || !layout2) return;
    setIsAnalyzing(true);
    setAnalysisStep('analyzing');
    try {
      const [r1, r2] = await Promise.all([
        analyzeFloorPlan(layout1, selectedUnit1),
        analyzeFloorPlan(layout2, selectedUnit2)
      ]);
      setResults({ r1, r2 });
    } catch (err) {
      alert('Comparison failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('idle');
    }
  };

  const startComparisonFlow = async () => {
    if (!layout1 || !layout2) return;
    setIsAnalyzing(true);
    setAnalysisStep('detecting');
    try {
      const [d1, d2] = await Promise.all([
        detectUnits(layout1),
        detectUnits(layout2)
      ]);

      const hasUnits1 = d1.hasMultipleUnits && d1.units.length > 1;
      const hasUnits2 = d2.hasMultipleUnits && d2.units.length > 1;

      if (hasUnits1 || hasUnits2) {
        if (hasUnits1) setDetectedUnits1(d1.units);
        if (hasUnits2) setDetectedUnits2(d2.units);
        setAnalysisStep('selecting');
        setIsAnalyzing(false);
      } else {
        await handleCompare();
      }
    } catch (err) {
      console.error('Detection failed:', err);
      await handleCompare();
    }
  };

  const downloadReport = async () => {
    if (!resultsRef.current || !results) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#020617',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const width = imgWidth * ratio;
      const height = imgHeight * ratio;
      
      pdf.setFillColor(2, 6, 23);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('Vastu Comparison Report', 20, 20);
      pdf.setFontSize(10);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 28);
      
      pdf.addImage(imgData, 'PNG', (pdfWidth - width) / 2, 40, width, height);
      
      pdf.save(`Vastu-Comparison-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} setShowTutorial={setShowTutorial}>
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif font-bold text-white">Vastu Comparison Tool</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Upload two layout variations to find the most compliant architectural dwelling.</p>
        </div>

        {!results ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[1, 2].map((slot) => (
              <div key={slot} className="space-y-6">
                <h3 className="text-lg font-serif font-bold text-white text-center uppercase tracking-widest text-[10px]">Variation 0{slot}</h3>
                <div className="relative group aspect-video rounded-[3rem] border-2 border-dashed border-slate-800 bg-slate-900 hover:border-slate-700 transition-all flex flex-col items-center justify-center p-8 text-center overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, slot as 1 | 2)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {(slot === 1 ? layout1 : layout2) ? (
                    <img src={(slot === 1 ? layout1 : layout2)!} alt={`Slot ${slot}`} className="max-h-full rounded-2xl shadow-2xl" />
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Select Layout</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div ref={resultsRef} className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-700">
            {[results.r1, results.r2].map((res, i) => (
              <div key={i} className={`p-12 bg-slate-900 border rounded-[3rem] space-y-8 relative overflow-hidden ${
                (i === 0 ? results.r1.score > results.r2.score : results.r2.score > results.r1.score) ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-800'
              }`}>
                {(i === 0 ? results.r1.score > results.r2.score : results.r2.score > results.r1.score) && (
                  <div className="absolute top-6 right-6 px-4 py-1.5 bg-emerald-500 text-slate-950 text-[8px] font-black uppercase tracking-widest rounded-full">Recommended</div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-white">Variation 0{i+1}</h3>
                    <p className="text-emerald-400 font-serif italic text-sm mt-1">{res.verdict}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-serif font-bold text-emerald-500 leading-none">{res.score}%</div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mt-1">Current Score</p>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Potential Score</p>
                  <p className="text-lg font-serif font-bold text-white">
                    <span className="text-emerald-400">{res.potentialScore}%</span> after remedies
                  </p>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed">{res.summary}</p>
                <div className="space-y-4">
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest">Key Zones</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {res.zones.slice(0, 4).map((zone: any, j: number) => (
                      <div key={j} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                        <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{zone.direction}</p>
                        <p className="text-white font-bold text-xs mt-1">{zone.room}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col items-center gap-8 pt-12">
          {analysisStep === 'selecting' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl bg-slate-900 border border-emerald-500/30 rounded-[3rem] p-12 space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Unit Selection Required</h3>
                <p className="text-slate-400 text-sm">One or both layouts contain multiple units. Please select which ones to compare.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {[1, 2].map((slot) => (
                  <div key={slot} className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 text-center">Variation 0{slot}</h4>
                    {(slot === 1 ? detectedUnits1 : detectedUnits2).length > 0 ? (
                      <div className="space-y-2">
                        {(slot === 1 ? detectedUnits1 : detectedUnits2).map((unit, j) => (
                          <button
                            key={j}
                            onClick={() => slot === 1 ? setSelectedUnit1(unit) : setSelectedUnit2(unit)}
                            className={`w-full p-4 rounded-xl border text-left text-xs transition-all ${
                              (slot === 1 ? selectedUnit1 : selectedUnit2) === unit ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500 italic">
                        Single Unit Detected
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  onClick={handleCompare}
                  className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-[0.2em] text-xs"
                >
                  Confirm & Compare
                </button>
              </div>
            </motion.div>
          )}

          {results ? (
            <div className="flex gap-4">
              <button 
                onClick={() => { setResults(null); setAnalysisStep('idle'); }} 
                className="px-12 py-5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all flex items-center gap-3"
              >
                <RefreshCw className="w-4 h-4" />
                New Comparison
              </button>
              <button 
                onClick={downloadReport}
                disabled={isDownloading}
                className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-widest text-xs flex items-center gap-3 disabled:opacity-50"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download Report
              </button>
            </div>
          ) : analysisStep !== 'selecting' && (
            <button
              onClick={startComparisonFlow}
              disabled={!layout1 || !layout2 || isAnalyzing}
              className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center gap-4"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  {analysisStep === 'detecting' ? 'Scanning Layouts...' : 'Neural Comparison...'}
                </>
              ) : (
                'Compare Layouts'
              )}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Comparison;

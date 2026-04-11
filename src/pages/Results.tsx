import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { User, SavedReport } from '../types';
import Layout from '../components/Layout';
import TutorialGuide from '../components/TutorialGuide';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ResultsProps {
  user: User | null;
  onLogout: () => void;
}

const Results: React.FC<ResultsProps> = ({ user, onLogout }) => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<SavedReport | null>(location.state?.report || null);
  const [loading, setLoading] = useState(!report);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'error'>('idle');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!report && id) {
      fetchReport();
    }
  }, [id, user]);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        const found = data.find((r: SavedReport) => r._id === id);
        if (found) setReport(found);
      }
    } catch (err) {
      console.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !report) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617', // slate-950
        onclone: (clonedDoc) => {
          // Fix for html2canvas not supporting oklch colors in Tailwind v4
          // 1. Replace oklch in all style tags
          const styleTags = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styleTags.length; i++) {
            try {
              if (styleTags[i].innerHTML.includes('oklch')) {
                styleTags[i].innerHTML = styleTags[i].innerHTML.replace(/oklch\([^)]+\)/g, '#10b981');
              }
            } catch (e) {
              console.warn('Failed to patch style tag:', e);
            }
          }

          // 2. Replace oklch in all element style attributes and common properties
          const elements = clonedDoc.getElementsByTagName('*');
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            
            // Fix inline styles
            const styleAttr = el.getAttribute('style');
            if (styleAttr && styleAttr.includes('oklch')) {
              el.setAttribute('style', styleAttr.replace(/oklch\([^)]+\)/g, '#10b981'));
            }

            // Fix computed styles that html2canvas might pick up
            const props = ['backgroundColor', 'color', 'borderColor', 'fill', 'stroke'];
            const style = window.getComputedStyle(el);
            
            props.forEach(prop => {
              const val = (style as any)[prop];
              if (val && typeof val === 'string' && val.includes('oklch')) {
                if (prop === 'backgroundColor') {
                  if (el.classList.contains('bg-slate-950')) el.style.backgroundColor = '#020617';
                  else if (el.classList.contains('bg-emerald-500')) el.style.backgroundColor = '#10b981';
                  else el.style.backgroundColor = '#0f172a';
                } else if (prop === 'color') {
                  if (el.classList.contains('text-emerald-500')) el.style.color = '#10b981';
                  else el.style.color = '#f8fafc';
                } else {
                  el.style.setProperty(prop, 'currentColor', 'important');
                }
              }
            });
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`AlignHome-Audit-${report.name.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareReport = async () => {
    setShareStatus('sharing');
    const shareData = {
      title: `Vastu Audit: ${report?.name}`,
      text: `Check out my Vastu Audit report for ${report?.name} on AlignHome.ai`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareStatus('idle');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 3000);
      }
    } catch (err) {
      console.error('Sharing failed:', err);
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!report) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Report not found</div>;

  const { result } = report;

  return (
    <Layout user={user} onLogout={onLogout} setShowTutorial={setShowTutorial}>
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12" ref={reportRef}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => navigate('/dashboard')} className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors no-print" data-html2canvas-ignore>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              </button>
              <h1 className="text-4xl font-serif font-bold text-white">{report.name}</h1>
            </div>
            <p className="text-slate-400 ml-14">Neural Vastu Audit Results • {new Date(report.timestamp).toLocaleString()}</p>
          </div>
          <div className="flex gap-4 no-print" data-html2canvas-ignore>
            <button 
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-6 py-3 bg-slate-900 border border-slate-800 text-white font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button 
              onClick={handleShareReport}
              className="px-6 py-3 bg-emerald-500 text-slate-950 font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-emerald-400 transition-colors"
            >
              {shareStatus === 'copied' ? 'Link Copied!' : shareStatus === 'error' ? 'Failed to Share' : 'Share Report'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl" />
              <div className="flex flex-col md:flex-row items-center gap-12">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="88" className="stroke-slate-800 fill-none" strokeWidth="12" />
                    <circle cx="96" cy="96" r="88" className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - result.score / 100)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-serif font-bold text-white">{result.score}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vastu Score</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col gap-2 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">Vastu Verdict</h3>
                    <p className="text-3xl font-serif font-bold text-emerald-400 leading-tight">{result.verdict}</p>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{result.summary}</p>
                  <div className="flex gap-4 pt-4">
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Status</p>
                      <p className="text-white font-bold">{result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : 'Needs Correction'}</p>
                    </div>
                    <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Remedies</p>
                      <p className="text-white font-bold">{result.remedies.length} Suggested</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h2 className="text-2xl font-serif font-bold text-white">Zone Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {result.zones.map((zone, i) => (
                  <div key={i} className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-slate-700 transition-all">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400 font-serif font-bold border border-slate-800">{zone.direction}</div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        zone.status === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' : 
                        zone.status === 'Neutral' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>{zone.status}</div>
                    </div>
                    <h4 className="text-white font-bold mb-2">{zone.room}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{zone.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8">
              <h3 className="text-lg font-serif font-bold text-white mb-6">Remedies & Corrections</h3>
              <div className="space-y-6">
                {result.remedies.map((remedy, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{remedy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8">
              <h3 className="text-lg font-serif font-bold text-white mb-6">Layout Preview</h3>
              <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800">
                <img src={report.preview} alt="Layout" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] -z-10" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-3xl font-serif font-bold text-white">Final Conclusion</h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                Based on our neural analysis, your current layout has a Vastu compliance score of <span className="text-white font-bold">{result.score}%</span>. 
                By implementing the suggested remedies, you can significantly enhance the positive energy flow.
              </p>
              <div className="flex items-center gap-4 p-6 bg-slate-950 rounded-3xl border border-slate-800">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Projected Compliance</p>
                  <p className="text-2xl font-serif font-bold text-white">
                    After applying remedies, compliance will reach <span className="text-emerald-400">{result.potentialScore}%</span>
                  </p>
                </div>
              </div>
            </div>
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="96" cy="96" r="88" className="stroke-slate-800 fill-none" strokeWidth="8" />
                <circle cx="96" cy="96" r="88" className="stroke-emerald-500/20 fill-none" strokeWidth="8" strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - result.potentialScore / 100)} strokeLinecap="round" />
                <circle cx="96" cy="96" r="88" className="stroke-emerald-500 fill-none transition-all duration-1000 ease-out" strokeWidth="12" strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - result.score / 100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-serif font-bold text-white">{result.score}%</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Current</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTutorial && <TutorialGuide onClose={() => setShowTutorial(false)} />}
    </Layout>
  );
};

export default Results;

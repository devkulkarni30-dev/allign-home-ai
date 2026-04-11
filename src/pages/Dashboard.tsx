import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Property, SavedReport } from '../types';
import Layout from '../components/Layout';
import TutorialGuide from '../components/TutorialGuide';
import CameraCapture from '../components/CameraCapture';
import { analyzeFloorPlan, detectUnits } from '../services/geminiService';
import { motion } from 'motion/react';

interface DashboardProps {
  user: User | null;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'scan' | 'live'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'detecting' | 'selecting' | 'analyzing'>('idle');
  const [detectedUnits, setDetectedUnits] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [showNewPropertyModal, setShowNewPropertyModal] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProperties();
  }, [user]);

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error('Failed to fetch properties');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateProperty = async () => {
    if (!newPropertyName) return;
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPropertyName, type: 'Residential' }),
      });
      if (res.ok) {
        const data = await res.json();
        setProperties([...properties, data]);
        setSelectedPropertyId(data._id);
        setShowNewPropertyModal(false);
        setNewPropertyName('');
      }
    } catch (err) {
      console.error('Failed to create property');
    }
  };

  const handleAnalyze = async (unit?: string) => {
    if (!previewUrl) return;
    setIsAnalyzing(true);
    setAnalysisStep('analyzing');
    try {
      const result = await analyzeFloorPlan(previewUrl, unit);
      
      // Save report
      const reportRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Audit - ${new Date().toLocaleDateString()}${unit ? ` (${unit})` : ''}`,
          propertyId: selectedPropertyId || undefined,
          result,
          preview: previewUrl
        }),
      });

      if (reportRes.ok) {
        const savedReport = await reportRes.json();
        navigate(`/results/${savedReport._id}`, { state: { report: savedReport } });
      }
    } catch (err) {
      alert('Analysis failed. Please try again.');
      setAnalysisStep('idle');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startAnalysisFlow = async () => {
    if (!previewUrl) return;
    setIsAnalyzing(true);
    setAnalysisStep('detecting');
    try {
      const detection = await detectUnits(previewUrl);
      if (detection.hasMultipleUnits && detection.units.length > 1) {
        setDetectedUnits(detection.units);
        setAnalysisStep('selecting');
        setIsAnalyzing(false);
      } else {
        await handleAnalyze();
      }
    } catch (err) {
      console.error('Detection failed:', err);
      // Fallback to direct analysis
      await handleAnalyze();
    }
  };

  const handleTabChange = (tab: 'upload' | 'scan' | 'live') => {
    if (tab === 'live') {
      navigate('/live-audit');
    } else {
      setActiveTab(tab);
    }
  };

  const handleCapture = (blob: Blob) => {
    const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setActiveTab('upload'); // Switch back to upload to show preview and analyze button
    };
    reader.readAsDataURL(file);
  };

  return (
    <Layout user={user} onLogout={onLogout} setShowTutorial={setShowTutorial}>
      {activeTab === 'scan' && (
        <CameraCapture 
          onCapture={handleCapture}
          onClose={() => setActiveTab('upload')}
        />
      )}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-serif font-bold text-white">Neural Vastu Audit</h1>
            <p className="text-slate-400 mt-2">Upload your layout for a 16-zone architectural analysis.</p>
          </div>
          <div className="flex gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            {(['upload', 'scan', 'live'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`aspect-video rounded-[3rem] border-2 border-dashed transition-all flex flex-col items-center justify-center p-12 text-center relative overflow-hidden ${
                previewUrl ? 'border-emerald-500/50 bg-slate-900/50' : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}>
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="max-h-full rounded-2xl shadow-2xl" />
                    {isAnalyzing && (
                      <motion.div 
                        initial={{ top: '-10%' }}
                        animate={{ top: '110%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)] z-20"
                      />
                    )}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] z-10 animate-pulse" />
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-slate-500 mb-6 group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white mb-2">Drop layout here</h3>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">Supports JPG, PNG, and PDF blueprints up to 10MB.</p>
                  </>
                )}
              </div>
            </div>

            {previewUrl && analysisStep !== 'selecting' && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={startAnalysisFlow}
                  disabled={isAnalyzing}
                  className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-[0.2em] text-xs flex items-center gap-4"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      {analysisStep === 'detecting' ? 'Scanning Units...' : 'Neural Processing...'}
                    </>
                  ) : (
                    'Run Vastu Audit'
                  )}
                </button>
              </div>
            )}

            {analysisStep === 'selecting' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-emerald-500/30 rounded-[3rem] p-12 space-y-8"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">Multiple Units Detected</h3>
                  <p className="text-slate-400 text-sm">Please select the specific unit you want to audit.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detectedUnits.map((unit, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnalyze(unit)}
                      className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-left hover:border-emerald-500 transition-all group"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white font-bold">{unit}</span>
                        <svg className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-center">
                  <button 
                    onClick={() => handleAnalyze()}
                    className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    Audit Entire Layout Instead
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-serif font-bold text-white">Property Context</h3>
                <button onClick={() => setShowNewPropertyModal(true)} className="text-emerald-400 hover:text-emerald-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                </button>
              </div>
              
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {properties.map((prop) => (
                  <button
                    key={prop._id}
                    onClick={() => setSelectedPropertyId(prop._id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      selectedPropertyId === prop._id ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-white font-bold text-sm">{prop.name}</p>
                    <p className="text-slate-500 text-[10px] uppercase font-black mt-1">{prop.type}</p>
                  </button>
                ))}
                {properties.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-600 text-xs font-bold uppercase">No properties found</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8">
              <h3 className="text-lg font-serif font-bold text-white mb-6">Audit Guidelines</h3>
              <ul className="space-y-4">
                {[
                  'Ensure North direction is clearly marked',
                  'High contrast images yield better results',
                  'Include all room labels if possible',
                  'Multiple units? Audit them individually'
                ].map((tip, i) => (
                  <li key={i} className="flex gap-4 text-sm text-slate-400">
                    <span className="text-emerald-500 font-black">0{i+1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feedback CTA */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[3rem] p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                </svg>
              </div>
              <h3 className="text-lg font-serif font-bold text-white">Help us improve</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Your feedback helps us refine our AI for better architectural accuracy.</p>
              <Link to="/feedback" className="w-full py-4 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded-2xl hover:bg-emerald-400 transition-all tracking-widest">Share Thoughts</Link>
            </div>
          </div>
        </div>
      </div>

      {showNewPropertyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-serif font-bold text-white mb-6">New Property</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Property Name</label>
                <input
                  type="text"
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all"
                  placeholder="e.g. My Dream Home"
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowNewPropertyModal(false)} className="flex-1 py-4 bg-slate-800 text-white font-black rounded-2xl uppercase tracking-widest text-[10px]">Cancel</button>
                <button onClick={handleCreateProperty} className="flex-1 py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-[10px]">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTutorial && <TutorialGuide onClose={() => setShowTutorial(false)} />}
    </Layout>
  );
};

export default Dashboard;

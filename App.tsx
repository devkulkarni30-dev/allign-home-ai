
import React, { useState, useRef, useEffect } from 'react';
import { analyzeFloorPlan } from './services/geminiService';
import { AppState, VastuResult, ThreeDModelData, ComparisonData, User, SavedSession, SubscriptionPlan, SavedReport } from './types';
import ResultReport from './components/ResultReport';
import ComparisonReport from './components/ComparisonReport';
import VastuChakra from './components/VastuChakra';
import CameraCapture from './components/CameraCapture';
import ThreeDViewer from './components/ThreeDViewer';
import LoginPage from './components/LoginPage';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import CookieConsent from './components/CookieConsent';
import LiveAudit from './components/LiveAudit';
import SubscriptionPage from './components/SubscriptionPage';
import ErrorModal from './components/ErrorModal';
import TutorialGuide from './components/TutorialGuide';
import UserProfile from './components/UserProfile';
import BoundaryEditor from './components/BoundaryEditor';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>('LOGIN');
  const [mode, setMode] = useState<'single' | 'compare' | 'live'>('single');
  const [error, setError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const validateFile = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return "Invalid file format. Please upload a JPG, PNG, or WEBP image.";
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return "File is too large. Please upload an image smaller than 5MB.";
    }
    return null;
  };
  const [scanPhase, setScanPhase] = useState(0); // 0: Walls, 1: Rooms, 2: Zonal, 3: Final
  const [showTutorial, setShowTutorial] = useState(false);
  const [historyReport, setHistoryReport] = useState<SavedReport | null>(null);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<VastuResult | null>(null);

  const resizeImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    });
  };
  
  const [compPreviewA, setCompPreviewA] = useState<string | null>(null);
  const [compPreviewB, setCompPreviewB] = useState<string | null>(null);
  const [compResults, setCompResults] = useState<ComparisonData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const compInputRefA = useRef<HTMLInputElement>(null);
  const compInputRefB = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setState('IDLE');
        } else {
          // Fallback to local storage if not logged in or server error
          const savedUser = localStorage.getItem('vaastua_current_user');
          if (savedUser) {
            const parsedUser: User = JSON.parse(savedUser);
            setUser(parsedUser);
            setState('IDLE');
          }
        }
      } catch (err) {
        console.warn('Session check API unreachable, falling back to local storage:', err);
        const savedUser = localStorage.getItem('vaastua_current_user');
        if (savedUser) {
          try {
            const parsedUser: User = JSON.parse(savedUser);
            setUser(parsedUser);
            setState('IDLE');
          } catch (e) {
            console.error('Failed to parse saved user:', e);
          }
        }
      } finally {
        setIsAuthReady(true);
      }
    };

    checkSession();

    const hasSeenTutorial = localStorage.getItem('vaastua_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem('vaastua_current_user');
      setState('LOGIN');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleViewSavedReport = (report: SavedReport) => {
    setAnalysisResult(report.result);
    setImagePreview(report.preview);
    setHistoryReport(report);
    setState('RESULTS');
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem('vaastua_tutorial_seen', 'true');
  };

  // Update scan phases automatically when scanning starts
  useEffect(() => {
    let phaseTimer: number | undefined;
    if (state === 'SCANNING' || state === 'COMPARE_SCANNING') {
      phaseTimer = window.setInterval(() => {
        setScanPhase((prev) => (prev < 3 ? prev + 1 : prev));
      }, 400);
    } else {
      setScanPhase(0);
    }
    return () => clearInterval(phaseTimer);
  }, [state]);

  const handleLogin = (rawUser: any) => {
    const newUser: User = { ...rawUser };
    setUser(newUser);
    localStorage.setItem('vaastua_current_user', JSON.stringify(newUser));
    setState('IDLE');
  };

  const updateUsage = (modeToUpdate: 'single' | 'compare' | 'live') => {
    if (!user) return;
    const newUser = {
      ...user,
      subscription: {
        ...user.subscription,
        usage: {
          ...user.subscription.usage,
          [modeToUpdate]: user.subscription.usage[modeToUpdate] + 1
        }
      }
    };
    setUser(newUser);
    localStorage.setItem('vaastua_current_user', JSON.stringify(newUser));
  };

  const checkAndHandleQuota = (modeToCheck: 'single' | 'compare' | 'live'): boolean => {
    if (!user) return false;
    if (user.isAdmin) return false;

    const { plan, usage } = user.subscription;
    let exceeded = false;

    if (plan === 'basic') {
      if (modeToCheck === 'single' && usage.single >= 1) exceeded = true;
      if (modeToCheck === 'compare' && usage.compare >= 1) exceeded = true;
      if (modeToCheck === 'live') exceeded = true;
    } else if (plan === 'daily') {
      if (modeToCheck === 'single' && usage.single >= 20) exceeded = true;
      if (modeToCheck === 'compare' && usage.compare >= 20) exceeded = true;
      if (modeToCheck === 'live' && usage.live >= 1) exceeded = true;
    }

    if (exceeded) {
      setError("Usage limit reached. Upgrade your Plan to continue your Vedic architectural journey.");
      setState('SUBSCRIPTION');
      return true;
    }
    return false;
  };

  const processSingle = async (base64: string, selectedUnit?: string, skipSymbol = false) => {
    if (checkAndHandleQuota('single')) return;

    setState('SCANNING');
    setScanPhase(0);
    setError(null);
    abortControllerRef.current = new AbortController();

    try {
      const result = await analyzeFloorPlan(base64, selectedUnit, abortControllerRef.current.signal, skipSymbol);
      
      if (!result.isValidFloorPlan) {
        setError(result.validationError || "Architectural pattern not recognized. Please ensure the N-direction mark is visible and the layout is clear.");
        setState('IDLE');
        return;
      }

      if (result.multipleUnitsDetected && !selectedUnit) {
        setAnalysisResult(result);
        setState('UNIT_SELECTION');
        return;
      }

      updateUsage('single');
      setAnalysisResult(result);
      setState('RESULTS');
      
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        resultsRef.current?.focus();
      }, 100);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error("Analysis Error:", err);
      setError(err?.message || "Analysis module failed to initialize. Please ensure your image is clear and contains a North mark.");
      setState('IDLE');
    }
  };

  const startComparison = async () => {
    if (!compPreviewA || !compPreviewB) return;
    if (checkAndHandleQuota('compare')) return;

    setState('COMPARE_SCANNING');
    setScanPhase(0);
    setError(null);

    try {
      // Use skipSymbol=true for comparison to get results faster
      const [resA, resB] = await Promise.all([
        analyzeFloorPlan(compPreviewA.split(',')[1], undefined, undefined, true),
        analyzeFloorPlan(compPreviewB.split(',')[1], undefined, undefined, true)
      ]);

      if (!resA.isValidFloorPlan) {
        setError(`Layout A: ${resA.validationError || "Architectural pattern not recognized."}`);
        setState('IDLE');
        return;
      }
      if (!resB.isValidFloorPlan) {
        setError(`Layout B: ${resB.validationError || "Architectural pattern not recognized."}`);
        setState('IDLE');
        return;
      }

      updateUsage('compare');
      setCompResults({ resultA: resA, resultB: resB, previewA: compPreviewA, previewB: compPreviewB });
      setState('COMPARE_RESULTS');
    } catch (err: any) {
      console.error("Comparison Error:", err);
      setError(err?.message || "Comparison engine encountered an error. Check layout quality and North marks on both plans.");
      setState('IDLE');
    }
  };

  const handleUnitSelect = (unitName: string) => {
    if (!imagePreview) return;
    const base64 = imagePreview.split(',')[1];
    // Skip symbol on second pass for maximum speed
    processSingle(base64, unitName, true);
  };

  const reset = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setState('IDLE');
    setAnalysisResult(null);
    setImagePreview(null);
    setCompPreviewA(null);
    setCompPreviewB(null);
    setCompResults(null);
    setMode('single');
    setScanPhase(0);
    setHistoryReport(null);
  };

  const renderScanningOverlay = () => {
    const messages = [
      "EXTRACTING STRUCTURAL NODES...",
      "IDENTIFYING SPATIAL BOUNDARIES...",
      "MAPPING VASTU ENERGY ZONES...",
      "CALIBRATING FINAL AUDIT..."
    ];

    return (
      <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 scan-grid scan-grid-active opacity-20" />
        <div className="scan-line" />
        
        <div className="corner-marker corner-tl" />
        <div className="corner-marker corner-tr" />
        <div className="corner-marker corner-bl" />
        <div className="corner-marker corner-br" />

        <svg className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${scanPhase >= 0 ? 'opacity-40' : 'opacity-0'}`} viewBox="0 0 100 100">
          <path d="M10,10 L90,10 L90,90 L10,90 Z" fill="none" stroke="#10b981" strokeWidth="0.8" className="boundary-path" />
          <path d="M30,10 L30,90 M70,10 L70,90 M10,40 L90,40 M10,70 L90,70" fill="none" stroke="#10b981" strokeWidth="0.3" className="boundary-path" style={{ animationDelay: '0.5s' }} />
        </svg>

        <div className={`transition-opacity duration-500 ${scanPhase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="node-pulse" style={{ top: '25%', left: '30%' }} />
          <div className="node-pulse" style={{ top: '25%', left: '70%' }} />
          <div className="node-pulse" style={{ top: '55%', left: '50%' }} />
          <div className="node-pulse" style={{ top: '80%', left: '20%' }} />
          <div className="node-pulse" style={{ top: '80%', left: '80%' }} />
        </div>

        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ease-out ${scanPhase >= 2 ? 'opacity-40 scale-100' : 'opacity-0 scale-150'}`}>
          <VastuChakra />
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-950/90 backdrop-blur border border-emerald-500/30 px-8 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em] whitespace-nowrap">
            {messages[scanPhase] || "PROCESSING..."}
          </p>
        </div>
      </div>
    );
  };

  const ArchitecturalHero = () => (
    <div className="relative w-full h-48 md:h-64 rounded-[3rem] bg-slate-900 overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group mb-12">
      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
        <div className="scan-grid w-full h-full" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
        <svg className="w-16 h-16 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Ready for Neural Audit</h3>
          <p className="text-xs text-slate-600 mt-1">Upload or Scan your architectural layout to begin</p>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-emerald-500/10 rounded-tr-[3rem] -mt-8 -mr-8" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-emerald-500/10 rounded-bl-[3rem] -mb-8 -ml-8" />
    </div>
  );

  if (state === 'LOGIN') return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <h1 className="text-xl font-serif font-bold text-white uppercase cursor-pointer" onClick={reset}>AlignHome<span className="text-emerald-400">.ai</span></h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowTutorial(true)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Help & Tutorial">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </button>
          <button onClick={() => setState('PROFILE')} className="p-2 text-slate-400 hover:text-white transition-colors" title="My Profile">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          </button>
          <button onClick={() => setState('SUBSCRIPTION')} className="px-4 py-2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-transform">Upgrade Plan</button>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors" title="Logout">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-12 flex-1 pb-32">
        {state === 'IDLE' && mode === 'single' && (
          <div className="space-y-16 animate-in fade-in duration-700">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight">
                AlignHome.ai: The Future of <span className="text-emerald-400">Vastu Shastra</span> for Home
              </h1>
              <p className="text-slate-400 font-medium leading-relaxed text-lg">
                Welcome to <strong>AlignHome.ai</strong>, the ultimate AI Vastu app designed for the modern homeowner. Whether you are moving into a north-facing house, looking for Vastu tips for apartments, or seeking a Vastu-compliant home layout, our platform provides an instant, data-driven virtual Vastu audit.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <ArchitecturalHero />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button onClick={() => fileInputRef.current?.click()} className="group p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-emerald-500 transition-all text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10" />
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Upload Layout</h3>
                <p className="text-slate-400 text-sm font-medium">Analyze a digital floor plan image or blueprint with 16-zone precision.</p>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const validationError = validateFile(file);
                    if (validationError) {
                      setError(validationError);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const rawBase64 = reader.result as string;
                      const optimizedBase64 = await resizeImage(rawBase64);
                      setImagePreview(optimizedBase64);
                      processSingle(optimizedBase64.split(',')[1]);
                    };
                    reader.readAsDataURL(file);
                  }
                }} />
              </button>

              <button onClick={() => setState('CAMERA_CAPTURE')} className="group p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-emerald-500 transition-all text-left relative overflow-hidden">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Scan Blueprint</h3>
                <p className="text-slate-400 text-sm font-medium">Use your camera to capture physical drawings and perform an instant Vastu audit.</p>
              </button>

              <button onClick={() => { if (!checkAndHandleQuota('live')) setState('LIVE_AUDIT'); }} className="group p-10 bg-slate-900 border border-emerald-500/30 rounded-[3rem] hover:border-emerald-500 transition-all text-left relative overflow-hidden ring-4 ring-emerald-500/5">
                <div className="absolute top-4 right-6 px-3 py-1 bg-emerald-500 rounded-full text-[8px] font-black uppercase text-slate-950 tracking-widest animate-pulse">Vision Pro</div>
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Live Site Audit</h3>
                <p className="text-slate-400 text-sm font-medium">Perform real-time Vastu checks using augmented vision and compass synchronization.</p>
              </button>

              <button onClick={() => setMode('compare')} className="group p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-amber-500 transition-all text-left relative overflow-hidden">
                <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-8 border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Comparison</h3>
                <p className="text-slate-400 text-sm font-medium">Upload two variations to find the most compliant architectural dwelling.</p>
              </button>
            </div>

            <section className="max-w-4xl mx-auto space-y-12 py-12 border-t border-slate-800">
              <div className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-white">Why Choose Our AI-Powered Vastu Compliance Checker?</h2>
                <p className="text-slate-400 leading-relaxed">
                  Unlike traditional methods, AlignHome.ai utilizes a cutting-edge floor plan Vastu scanner and live camera technology to analyze your space with laser precision. Our automated Vastu report gives you an immediate 0-100 score, helping you understand the energy flow of your main entrance, master bedroom, and kitchen as per Vastu.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-xs">Vastu App with Live Camera</h3>
                  <p className="text-slate-300 text-sm">Walk through any property and get real-time feedback on furniture placement, mandir position, and toilet in north-east conflicts.</p>
                </div>
                <div className="space-y-4 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-xs">Vastu for Small Spaces</h3>
                  <p className="text-slate-300 text-sm">Specialized Vastu interior design tips tailored for modern urban apartments where structural changes aren't always possible.</p>
                </div>
                <div className="space-y-4 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-xs">Practical Vastu Remedies</h3>
                  <p className="text-slate-300 text-sm">Discover Vastu correction methods that require no structural changes, including color therapy, crystal guides, and metal strips.</p>
                </div>
                <div className="space-y-4 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
                  <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-xs">Expert Consultation</h3>
                  <p className="text-slate-300 text-sm">Need deeper insights? Connect with a Vastu specialist in India or an online Vastu expert for a personalized 1-on-1 session.</p>
                </div>
              </div>

              <div className="text-center space-y-4 py-12">
                <h2 className="text-3xl font-serif font-bold text-white">Stop Searching for "Vastu Consultant Near Me"</h2>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  Get professional-grade Vastu shastra tips instantly. Our SaaS Vastu compliance platform is the preferred choice for new home buyers and real estate professionals who want to validate south-facing plot Vastu or east-facing house plans before they commit.
                </p>
                <div className="pt-6">
                  <p className="text-lg font-serif italic text-emerald-400">Make 2026 your year of peace and prosperity. Don’t just move in—Align in with AlignHome.ai.</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {state === 'IDLE' && mode === 'compare' && (
          <div className="max-w-5xl mx-auto space-y-12 py-12 animate-in slide-in-from-bottom-12 duration-1000">
            <div className="text-center space-y-4">
               <h2 className="text-4xl font-serif font-bold text-white">Compare Layout <span className="text-emerald-400">Variations</span></h2>
               <p className="text-slate-400">Upload two different floor plan options to find the one with highest Vedic harmony.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div 
                 onClick={() => compInputRefA.current?.click()} 
                 className={`h-80 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${compPreviewA ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 hover:border-emerald-500 bg-slate-900/50'}`}
               >
                  {compPreviewA ? (
                    <img src={compPreviewA} className="w-full h-full object-cover p-4 rounded-[2.5rem]" />
                  ) : (
                    <div className="text-center space-y-4">
                       <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500 group-hover:text-emerald-400 transition-colors">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                       </div>
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select Layout A</p>
                    </div>
                  )}
                  <input type="file" ref={compInputRefA} className="hidden" accept="image/*" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const validationError = validateFile(file);
                       if (validationError) {
                         setError(validationError);
                         return;
                       }
                       const reader = new FileReader();
                       reader.onload = async () => {
                         const optimized = await resizeImage(reader.result as string);
                         setCompPreviewA(optimized);
                       };
                       reader.readAsDataURL(file);
                     }
                  }} />
               </div>

               <div 
                 onClick={() => compInputRefB.current?.click()} 
                 className={`h-80 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group ${compPreviewB ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 hover:border-emerald-500 bg-slate-900/50'}`}
               >
                  {compPreviewB ? (
                    <img src={compPreviewB} className="w-full h-full object-cover p-4 rounded-[2.5rem]" />
                  ) : (
                    <div className="text-center space-y-4">
                       <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500 group-hover:text-emerald-400 transition-colors">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                       </div>
                       <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Select Layout B</p>
                    </div>
                  )}
                  <input type="file" ref={compInputRefB} className="hidden" accept="image/*" onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) {
                       const validationError = validateFile(file);
                       if (validationError) {
                         setError(validationError);
                         return;
                       }
                       const reader = new FileReader();
                       reader.onload = async () => {
                         const optimized = await resizeImage(reader.result as string);
                         setCompPreviewB(optimized);
                       };
                       reader.readAsDataURL(file);
                     }
                  }} />
               </div>
            </div>

            <div className="flex flex-col items-center gap-6">
               <button 
                 onClick={startComparison}
                 disabled={!compPreviewA || !compPreviewB}
                 className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-[0.2em] text-xs"
               >
                 Run Neural Comparison
               </button>
               <button onClick={reset} className="text-slate-500 hover:text-white uppercase font-black text-[10px] tracking-widest">Back to Modules</button>
            </div>
          </div>
        )}

        {state === 'SCANNING' && (
          <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-6 gap-8 overflow-hidden">
            <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-[3rem] border border-slate-800 overflow-hidden shadow-2xl">
              <img src={imagePreview!} className="w-full h-full object-contain p-12 opacity-30 brightness-50 grayscale" />
              {renderScanningOverlay()}
            </div>
            <div className="flex flex-col items-center gap-4 text-center">
              <h3 className="text-2xl font-serif font-bold text-white animate-pulse uppercase tracking-widest">Neural Scan Active</h3>
              <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">Identifying Structures & Energy Nodes</p>
              <button onClick={reset} className="px-6 py-2 bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-rose-500/30 mt-4 pointer-events-auto hover:bg-rose-500/20 transition-colors">Cancel Audit</button>
            </div>
          </div>
        )}

        {state === 'COMPARE_SCANNING' && (
           <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-12 gap-12 overflow-hidden">
              <div className="grid grid-cols-2 gap-12 w-full max-w-6xl h-80">
                 <div className="bg-slate-900 rounded-[3rem] border border-emerald-500/30 relative overflow-hidden">
                    <img src={compPreviewA!} className="w-full h-full object-contain p-8 opacity-20 grayscale" />
                    <div className="scan-line" />
                    <div className="absolute inset-0 scan-grid opacity-10" />
                 </div>
                 <div className="bg-slate-900 rounded-[3rem] border border-emerald-500/30 relative overflow-hidden">
                    <img src={compPreviewB!} className="w-full h-full object-contain p-8 opacity-20 grayscale" />
                    <div className="scan-line" />
                    <div className="absolute inset-0 scan-grid opacity-10" />
                 </div>
              </div>
              <div className="text-center space-y-4">
                 <h3 className="text-3xl font-serif font-bold text-white animate-pulse uppercase tracking-[0.4em]">Parallel Neural Comparison</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Synchronizing 16-Zone Grid Calibration</p>
              </div>
           </div>
        )}

        {state === 'UNIT_SELECTION' && (
          <div className="max-w-4xl mx-auto space-y-12 py-12 animate-in fade-in zoom-in-95 duration-700">
            <div className="text-center space-y-4">
               <h2 className="text-4xl font-serif font-bold">Multiple Layouts Detected</h2>
               <p className="text-slate-400">Which flat or unit would you like to analyze from this drawing?</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {analysisResult?.detectedUnits?.map((unit, i) => (
                 <button key={i} onClick={() => handleUnitSelect(unit)} className="p-8 bg-slate-900 border border-slate-800 rounded-3xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left group">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 group-hover:text-emerald-400 mb-2">Architectural Unit</p>
                    <h4 className="text-xl font-bold text-white">{unit}</h4>
                 </button>
               ))}
            </div>
            <button onClick={reset} className="w-full py-4 text-slate-500 hover:text-white transition-colors uppercase font-black text-[10px] tracking-widest">Go Back</button>
          </div>
        )}

      {state === 'PROFILE' && user && (
        <UserProfile 
          user={user} 
          onBack={() => setState('IDLE')} 
          onViewReport={handleViewSavedReport}
          onUpdateUser={setUser}
        />
      )}

      {state === 'RESULTS' && analysisResult && (
        <div ref={resultsRef} tabIndex={-1} className="max-w-4xl mx-auto outline-none py-12">
          <div className="flex justify-between items-center mb-12 no-print">
            <button 
              onClick={() => {
                if (historyReport) {
                  setState('PROFILE');
                  setHistoryReport(null);
                } else {
                  setState('IDLE');
                }
                setAnalysisResult(null);
                setImagePreview(null);
              }} 
              className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group"
            >
              <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center group-hover:bg-slate-800 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
              </div>
              <span className="text-xs font-black uppercase tracking-widest">{historyReport ? 'Back to Profile' : 'New Analysis'}</span>
            </button>
            <div className="flex gap-4">
              <button onClick={() => setState('EDITING_BOUNDARIES')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-emerald-500/20">Refine Boundaries</button>
              <button onClick={() => setState('VIEWING_3D')} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Spatial 3D View</button>
            </div>
          </div>
          <ResultReport data={analysisResult} imagePreview={imagePreview!} />
          <div className="flex justify-center mt-12 pb-24">
             <button onClick={reset} className="px-12 py-4 bg-slate-900 border border-slate-800 text-slate-400 font-bold rounded-2xl hover:text-white hover:border-emerald-500 transition-all uppercase tracking-widest text-[10px]">Start New Audit</button>
          </div>
        </div>
      )}

        {state === 'COMPARE_RESULTS' && compResults && (
           <ComparisonReport data={compResults} onReset={() => { setCompPreviewA(null); setCompPreviewB(null); setState('IDLE'); setMode('compare'); }} onHome={reset} />
        )}

        {state === 'CAMERA_CAPTURE' && (
           <CameraCapture onCapture={(base64) => { setImagePreview(`data:image/jpeg;base64,${base64}`); processSingle(base64); }} onClose={reset} />
        )}

        {state === 'LIVE_AUDIT' && (
           <LiveAudit onClose={reset} onComplete={() => updateUsage('live')} />
        )}

        {state === 'EDITING_BOUNDARIES' && analysisResult && imagePreview && (
          <BoundaryEditor 
            imagePreview={imagePreview}
            data={analysisResult}
            onSave={(updated) => {
              setAnalysisResult(updated);
              setState('RESULTS');
            }}
            onCancel={() => setState('RESULTS')}
          />
        )}

        {state === 'SUBSCRIPTION' && user && (
           <SubscriptionPage user={user} onClose={reset} onUpgrade={(plan) => {
              const updated = { ...user, subscription: { ...user.subscription, plan } };
              setUser(updated);
              localStorage.setItem('vaastua_current_user', JSON.stringify(updated));
              reset();
           }} />
        )}
      </main>

      <ErrorModal isOpen={!!error} message={error} onClose={() => setError(null)} />
      <TutorialGuide isOpen={showTutorial} onClose={handleTutorialClose} />
      <CookieConsent />
    </div>
  );
};

export default App;


import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import React, { useEffect, useRef, useState } from 'react';
import { VASTU_RULES_DATABASE } from '../data/vastuRules';
import { LiveAnalysisFeedback } from '../types';

interface ExtendedFeedback extends LiveAnalysisFeedback {
  timestamp: number;
}

interface LiveAuditProps {
  onClose: () => void;
  onComplete?: () => void;
}

// Fixed typo: Changed LiveAuditAuditProps to LiveAuditProps
const LiveAudit: React.FC<LiveAuditProps> = ({ onClose, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [heading, setHeading] = useState(0);
  const [tilt, setTilt] = useState({ beta: 0, gamma: 0 });
  const [isOriented, setIsOriented] = useState(true);
  const [referenceNorth, setReferenceNorth] = useState<number | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [feedback, setFeedback] = useState<ExtendedFeedback | null>(null);
  const [tourHistory, setTourHistory] = useState<ExtendedFeedback[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [isTourFinished, setIsTourFinished] = useState(false);

  const analysisIntervalRef = useRef<number | null>(null);
  const headingBuffer = useRef<number[]>([]);

  useEffect(() => {
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err) {
        setPermError("Camera access denied. Please enable camera in browser settings.");
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach(t => t.stop());
  }, []);

  const smoothHeading = (newHeading: number) => {
    headingBuffer.current.push(newHeading);
    if (headingBuffer.current.length > 5) headingBuffer.current.shift();
    const sum = headingBuffer.current.reduce((a, b) => a + b, 0);
    return sum / headingBuffer.current.length;
  };

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let rawH = 0;
      if ((e as any).webkitCompassHeading !== undefined) {
        rawH = (e as any).webkitCompassHeading;
      } else if (e.alpha !== null) {
        rawH = 360 - e.alpha;
      }
      setHeading(smoothHeading(rawH));
      
      const b = e.beta || 0; // Pitch
      const g = e.gamma || 0; // Roll
      setTilt({ beta: b, gamma: g });
      
      const isLevel = Math.abs(g) < 20 && b > 60 && b < 120;
      setIsOriented(isLevel);
    };

    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const res = await (DeviceOrientationEvent as any).requestPermission();
          if (res === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          } else {
            setPermError("Compass access required for spatial audit.");
          }
        } catch (e) {
          setPermError("Sensor initialization failed.");
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    requestPermission();
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const calibrate = () => {
    setReferenceNorth(heading);
    setIsCalibrated(true);
    speak(
      "North axis synchronized. Spatial tour initiated.",
      "उत्तर दिशा संरेखित। स्थानिक भ्रमण शुरू।"
    );
  };

  const getEffectiveZone = (h: number) => {
    if (referenceNorth === null) return "N";
    const relativeHeading = (h - referenceNorth + 360) % 360;
    if (relativeHeading >= 337.5 || relativeHeading < 22.5) return "N";
    if (relativeHeading >= 22.5 && relativeHeading < 67.5) return "NE";
    if (relativeHeading >= 67.5 && relativeHeading < 112.5) return "E";
    if (relativeHeading >= 112.5 && relativeHeading < 157.5) return "SE";
    if (relativeHeading >= 157.5 && relativeHeading < 202.5) return "S";
    if (relativeHeading >= 202.5 && relativeHeading < 247.5) return "SW";
    if (relativeHeading >= 247.5 && relativeHeading < 292.5) return "W";
    if (relativeHeading >= 292.5 && relativeHeading < 337.5) return "NW";
    return "N";
  };

  const currentZoneKey = getEffectiveZone(heading);
  const zoneInfo = VASTU_RULES_DATABASE.zones[currentZoneKey as keyof typeof VASTU_RULES_DATABASE.zones];

  const speak = (englishText: string, hindiText?: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const indianEngVoice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en_IN'));
    const hindiVoice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('hi_IN'));

    const engUtterance = new SpeechSynthesisUtterance(englishText);
    if (indianEngVoice) engUtterance.voice = indianEngVoice;
    engUtterance.rate = 1.05;
    
    engUtterance.onend = () => {
      if (hindiText) {
        const hiUtterance = new SpeechSynthesisUtterance(hindiText);
        if (hindiVoice) hiUtterance.voice = hindiVoice;
        hiUtterance.lang = 'hi-IN';
        hiUtterance.rate = 1.0;
        window.speechSynthesis.speak(hiUtterance);
      }
    };
    window.speechSynthesis.speak(engUtterance);
  };

  useEffect(() => {
    if (isCalibrated && !isTourFinished && !showConfirmFinish && isOriented) {
      analysisIntervalRef.current = window.setInterval(performVisionAnalysis, 2500);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [isCalibrated, isTourFinished, showConfirmFinish, isOriented, currentZoneKey]);

  const performVisionAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;
    
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `Act as a Vastu Architect Master. 
      Zone: ${zoneInfo.name}.
      Analyze camera view for: Architectural Element (Kitchen, Entrance, Living, Bedroom, Toilet, Balcony, Pooja Room, Open Space).
      Provide a detailed architectural audit for this specific view.
      Return JSON:
      {
        "object": "Detected Room/Element Type",
        "zone": "${zoneInfo.name}",
        "isCompliant": boolean,
        "remedy": "Specific practical remedy if non-compliant (e.g., use of mirrors, colors, or Vastu strips)",
        "message": "Detailed architectural feedback explaining the Vastu implication of this placement",
        "hindiMessage": "Detailed feedback in Hindi"
      }`;
      
      const res = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64 } },
            { text: prompt }
          ]
        },
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const data: ExtendedFeedback = { ...JSON.parse(res.text || '{}'), timestamp: Date.now() };
      
      if (data.object !== "Unknown" && data.object !== "None") {
        setTourHistory(prev => {
          const alreadyFound = prev.find(p => p.object === data.object && p.zone === data.zone);
          if (!alreadyFound) return [data, ...prev];
          return prev;
        });
        setFeedback(data);
        
        // Speak the result
        speak(data.message, data.hindiMessage);
      }
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFinish = () => {
    setIsTourFinished(true);
    if (onComplete) onComplete();
  };

  if (isTourFinished) {
    const score = tourHistory.length === 0 ? 100 : Math.round((tourHistory.filter(h => h.isCompliant).length / tourHistory.length) * 100);
    
    const getVerdict = (s: number) => {
      if (s >= 90) return { label: 'EXCELLENT', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', desc: 'The property exhibits exceptional Vedic harmony. The spatial energy flow is highly supportive of prosperity and well-being.' };
      if (s >= 75) return { label: 'GOOD', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', desc: 'The property has a strong Vastu foundation with minor zonal conflicts that can be easily remediated.' };
      if (s >= 50) return { label: 'AVERAGE', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5', desc: 'The property shows moderate compliance. Several key spatial nodes require energetic correction to balance the flow.' };
      if (s >= 30) return { label: 'POOR', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/5', desc: 'Significant Vastu conflicts detected. Immediate remediation is recommended to prevent energetic stagnation.' };
      return { label: 'CRITICAL', color: 'text-rose-500', border: 'border-rose-500/50', bg: 'bg-rose-500/10', desc: 'Severe architectural conflicts identified. Major Vastu corrections are required to restore spatial harmony.' };
    };

    const verdict = getVerdict(score);

    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col p-6 overflow-y-auto animate-in fade-in duration-700">
        <div className="max-w-4xl mx-auto w-full space-y-10 py-12">
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
                 <svg className="w-10 h-10 text-slate-950" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
              </div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">Live Audit <span className="text-emerald-400">Complete</span></h1>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Axis Locked: {referenceNorth ? Math.round(referenceNorth) : 0}° True North
              </div>
           </div>
           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] p-12 text-center space-y-2 relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em]">Aggregate Vastu Score</p>
                <h2 className="text-8xl font-serif font-bold text-white">{score}%</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mt-4">Overall architectural alignment detected during your live audit.</p>
              </div>

              <div className={`p-10 rounded-[3.5rem] border ${verdict.border} ${verdict.bg} flex flex-col items-center justify-center text-center space-y-4`}>
                <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-500">AI Verdict</p>
                <div className={`text-4xl font-serif font-bold ${verdict.color} leading-tight`}>
                  {verdict.label}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  {verdict.desc}
                </p>
              </div>
            </div>

           {/* Neural Insights Summary */}
           <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">Neural Insights</h3>
                </div>
                <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${verdict.bg} ${verdict.color} border ${verdict.border}`}>
                  Verdict: {verdict.label}
                </div>
              </div>
              
              <p className="text-slate-400 text-sm leading-relaxed italic border-l-4 border-emerald-500 pl-6">
                {verdict.desc}
              </p>

              <p className="text-xs text-slate-400 leading-relaxed">
                Based on your {tourHistory.length} spatial node detections, the property shows 
                {score > 80 ? ' exceptional' : score > 50 ? ' moderate' : ' critical'} alignment with the 16-zone Vedic grid. 
                {tourHistory.some(h => !h.isCompliant) 
                  ? " We've identified specific zonal conflicts that can be mitigated using the suggested remedies below."
                  : " No major spatial conflicts were detected during this scan session."}
              </p>
           </div>

           {/* Vedic Energy Grid Explanation */}
           <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Vedic Energy Grid (16 Zones)</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Geometric Calibration Baseline</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'].map(z => (
                  <div key={z} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center gap-2">
                    <span className="text-xs font-black text-emerald-400">{z}</span>
                    <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">
                      {z === 'NE' ? 'Spiritual' : z === 'E' ? 'Social' : z === 'SE' ? 'Cash Flow' : z === 'S' ? 'Relaxation' : z === 'SW' ? 'Stability' : z === 'W' ? 'Gains' : z === 'NW' ? 'Support' : 'Opportunities'}
                    </span>
                  </div>
                ))}
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 ml-4">Detected Spatial Nodes</h3>
              {tourHistory.map((h, i) => (
                <div key={i} className={`p-8 rounded-[2.5rem] border ${h.isCompliant ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'} space-y-4 relative overflow-hidden group`}>
                  <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[8px] font-black uppercase tracking-widest ${h.isCompliant ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                    {h.isCompliant ? 'Compliant' : 'Conflict'}
                  </div>
                  <div className="flex items-start gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${h.isCompliant ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold text-white">{h.object} in {h.zone}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{h.message}</p>
                      {h.remedy && (
                        <div className="mt-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                          <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Remedy</p>
                          <p className="text-xs text-slate-300 italic">{h.remedy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
           </div>
           <button onClick={onClose} className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all">Close Audit Module</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden">
      {/* HUD OVERLAY */}
      <div className="absolute inset-0 z-50 pointer-events-none p-6 flex flex-col justify-between">
        {/* TOP BAR */}
        <div className="flex justify-between items-start pointer-events-auto">
          <button onClick={onClose} className="w-12 h-12 bg-slate-900/60 backdrop-blur border border-slate-700 rounded-2xl text-white flex items-center justify-center hover:bg-slate-800 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
          </button>
          
          <div className="flex flex-col items-end gap-2">
            <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                {isAnalyzing ? 'Neural Analysis Active' : 'System Standby'}
              </span>
            </div>
            {isCalibrated && (
              <div className="bg-emerald-500/10 backdrop-blur px-4 py-2 rounded-xl border border-emerald-500/30 flex items-center gap-3">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                  Zone: {zoneInfo.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER HUD */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* SCANNING GRID */}
          <div className="absolute inset-0 opacity-10">
            <div className="w-full h-full scan-grid" />
          </div>
          
          {/* COMPASS OVERLAY */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <div className="absolute inset-0 border border-white/10 rounded-full" />
            <div className="absolute inset-4 border border-white/5 rounded-full" />
            
            {/* COMPASS RING */}
            <div 
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${-heading}deg)` }}
            >
              {['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map((z, i) => (
                <div 
                  key={z} 
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-full flex flex-col items-center pt-2"
                  style={{ transform: `rotate(${i * 45}deg)` }}
                >
                  <span className={`text-[10px] font-black tracking-tighter ${z === 'N' ? 'text-emerald-500' : 'text-white/40'}`}>{z}</span>
                  <div className={`w-0.5 h-2 mt-1 ${z === 'N' ? 'bg-emerald-500' : 'bg-white/20'}`} />
                </div>
              ))}
            </div>

            {/* CENTER INDICATOR */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="text-4xl font-serif font-bold text-white tracking-tighter">
                {Math.round(heading)}°
              </div>
              <div className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-1">
                {zoneInfo.name}
              </div>
            </div>

            {/* TILT INDICATOR */}
            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, Math.abs(tilt.beta - 90) * 2)}%` }} />
                </div>
                <span className="text-[6px] font-black text-white/30 uppercase mt-1">Pitch</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, Math.abs(tilt.gamma) * 2)}%` }} />
                </div>
                <span className="text-[6px] font-black text-white/30 uppercase mt-1">Roll</span>
              </div>
            </div>
          </div>

          {/* REAL-TIME FEEDBACK CARD */}
          {feedback && !isAnalyzing && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-sm animate-in slide-in-from-bottom-4 duration-500">
              <div className={`p-6 rounded-[2rem] backdrop-blur-xl border shadow-2xl ${feedback.isCompliant ? 'bg-emerald-950/40 border-emerald-500/30' : 'bg-rose-950/40 border-rose-500/30'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${feedback.isCompliant ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                    {feedback.isCompliant ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">{feedback.object} Detected</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{feedback.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CONTROLS */}
        <div className="pointer-events-auto flex flex-col items-center gap-6">
          {!isCalibrated ? (
             <div className="bg-slate-900/90 backdrop-blur-xl p-10 rounded-[3rem] w-full max-w-sm text-center space-y-8 border border-emerald-500/30 shadow-2xl animate-in zoom-in-95">
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif font-bold text-white">Axis Calibration</h3>
                  <p className="text-slate-400 text-sm">Point your device directly North and tap to synchronize the Vedic grid.</p>
                </div>
                <button 
                  onClick={calibrate} 
                  className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-500/20"
                >
                  Sync North Axis
                </button>
             </div>
          ) : (
            <>
              {!isOriented && !showConfirmFinish && (
                <div className="bg-amber-500/90 backdrop-blur px-6 py-3 rounded-2xl border border-amber-400/50 flex items-center gap-3 animate-bounce">
                  <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span className="text-[10px] font-black text-slate-950 uppercase tracking-widest">Hold Device Level for Scan</span>
                </div>
              )}
              
              {!showConfirmFinish && (
                <button 
                  onClick={() => setShowConfirmFinish(true)} 
                  className="px-12 py-5 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-full uppercase tracking-widest text-xs border-4 border-emerald-500/20 transition-all shadow-2xl"
                >
                  End Site Tour
                </button>
              )}
            </>
          )}

          {showConfirmFinish && (
            <div className="bg-slate-900/95 backdrop-blur-xl p-10 rounded-[3rem] w-full max-w-sm text-center space-y-8 border border-emerald-500/30 shadow-2xl animate-in slide-in-from-bottom-8">
               <div className="space-y-2">
                 <h3 className="text-2xl font-serif font-bold text-white">Audit Complete?</h3>
                 <p className="text-slate-400 text-sm">Review your spatial Vedic compliance report.</p>
               </div>
               <div className="flex flex-col gap-3">
                  <button onClick={handleFinish} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all">Generate Final Report</button>
                  <button onClick={() => setShowConfirmFinish(false)} className="w-full py-5 bg-slate-800 hover:bg-slate-700 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all">Resume Scan</button>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 bg-black">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
        {/* SCAN LINE ANIMATION */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-full h-1 bg-emerald-500/30 blur-sm animate-scan-line" />
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LiveAudit;

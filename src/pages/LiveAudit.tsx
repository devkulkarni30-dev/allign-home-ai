import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import Layout from '../components/Layout';
import VastuChakra from '../components/VastuChakra';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Camera, Volume2, VolumeX, Info, ArrowLeft, Scan, FileText } from 'lucide-react';
import { analyzeFloorPlan, detectUnits } from '../services/geminiService';
import { Property, VastuResult } from '../types';

interface LiveAuditProps {
  user: User | null;
  onLogout: () => void;
}

interface VastuZone {
  name: string;
  shortCode: string;
  hindiName: string;
  element: string;
  ruler: string;
  bestFor: string[];
  hindiBestFor: string[];
  avoid: string[];
  hindiAvoid: string[];
  color: string;
  description: string;
  hindiDescription: string;
}

const VASTU_ZONES: Record<string, VastuZone> = {
  'North': {
    name: 'North',
    shortCode: 'N',
    hindiName: 'उत्तर',
    element: 'Water',
    ruler: 'Kubera',
    bestFor: ['Entrance', 'Living Room', 'Study', 'Treasury'],
    hindiBestFor: ['प्रवेश द्वार', 'बैठक कक्ष', 'अध्ययन कक्ष', 'तिजोरी'],
    avoid: ['Kitchen', 'Toilet', 'Heavy Storage'],
    hindiAvoid: ['रसोई', 'शौचालय', 'भारी सामान'],
    color: 'bg-blue-500',
    description: 'Zone of Wealth and Career. Keep it open and light.',
    hindiDescription: 'धन और करियर का क्षेत्र। इसे खुला और हल्का रखें।'
  },
  'North-East': {
    name: 'North-East',
    shortCode: 'NE',
    hindiName: 'ईशान',
    element: 'Water/Space',
    ruler: 'Shiva',
    bestFor: ['Pooja Room', 'Meditation', 'Entrance', 'Balcony'],
    hindiBestFor: ['पूजा घर', 'ध्यान कक्ष', 'प्रवेश द्वार', 'बालकनी'],
    avoid: ['Toilet', 'Kitchen', 'Bedroom', 'Heavy items'],
    hindiAvoid: ['शौचालय', 'रसोई', 'शयनकक्ष', 'भारी सामान'],
    color: 'bg-cyan-400',
    description: 'Most sacred zone. Ideal for spiritual growth.',
    hindiDescription: 'सबसे पवित्र क्षेत्र। आध्यात्मिक विकास के लिए आदर्श।'
  },
  'East': {
    name: 'East',
    shortCode: 'E',
    hindiName: 'पूर्व',
    element: 'Air',
    ruler: 'Indra/Surya',
    bestFor: ['Entrance', 'Living Room', 'Study', 'Socializing'],
    hindiBestFor: ['प्रवेश द्वार', 'बैठक कक्ष', 'अध्ययन कक्ष', 'सामाजिक मेलजोल'],
    avoid: ['Toilet', 'Heavy Storage'],
    hindiAvoid: ['शौचालय', 'भारी सामान'],
    color: 'bg-emerald-500',
    description: 'Zone of Health and Social Connections.',
    hindiDescription: 'स्वास्थ्य और सामाजिक संबंधों का क्षेत्र।'
  },
  'South-East': {
    name: 'South-East',
    shortCode: 'SE',
    hindiName: 'आग्नेय',
    element: 'Fire',
    ruler: 'Agni',
    bestFor: ['Kitchen', 'Electricals', 'Inverters', 'Boilers'],
    hindiBestFor: ['रसोई', 'बिजली के उपकरण', 'इनवर्टर', 'बॉयलर'],
    avoid: ['Bedroom', 'Toilet', 'Water Tank'],
    hindiAvoid: ['शयनकक्ष', 'शौचालय', 'पानी की टंकी'],
    color: 'bg-orange-500',
    description: 'Zone of Cash Flow and Energy. Fire element dominates.',
    hindiDescription: 'नकदी प्रवाह और ऊर्जा का क्षेत्र। अग्नि तत्व का प्रभुत्व।'
  },
  'South': {
    name: 'South',
    shortCode: 'S',
    hindiName: 'दक्षिण',
    element: 'Fire/Earth',
    ruler: 'Yama',
    bestFor: ['Master Bedroom', 'Relaxation', 'Storage'],
    hindiBestFor: ['मुख्य शयनकक्ष', 'विश्राम', 'भंडारण'],
    avoid: ['Entrance', 'Kitchen', 'Water Features'],
    hindiAvoid: ['प्रवेश द्वार', 'रसोई', 'पानी के फव्वारे'],
    color: 'bg-rose-500',
    description: 'Zone of Fame and Relaxation. Keep it heavy and closed.',
    hindiDescription: 'प्रसिद्धि और विश्राम का क्षेत्र। इसे भारी और बंद रखें।'
  },
  'South-West': {
    name: 'South-West',
    shortCode: 'SW',
    hindiName: 'नैऋत्य',
    element: 'Earth',
    ruler: 'Nirriti',
    bestFor: ['Master Bedroom', 'Heavy Storage', 'Overhead Tank'],
    hindiBestFor: ['मुख्य शयनकक्ष', 'भारी भंडारण', 'ओवरहेड टैंक'],
    avoid: ['Entrance', 'Kitchen', 'Toilet', 'Pooja Room'],
    hindiAvoid: ['प्रवेश द्वार', 'रसोई', 'शौचालय', 'पूजा घर'],
    color: 'bg-amber-700',
    description: 'Zone of Stability and Strength. Heaviest part of the house.',
    hindiDescription: 'स्थिरता और शक्ति का क्षेत्र। घर का सबसे भारी हिस्सा।'
  },
  'West': {
    name: 'West',
    shortCode: 'W',
    hindiName: 'पश्चिम',
    element: 'Space',
    ruler: 'Varuna',
    bestFor: ['Children Room', 'Dining', 'Study', 'Overhead Tank'],
    hindiBestFor: ['बच्चों का कमरा', 'भोजन कक्ष', 'अध्ययन कक्ष', 'ओवरहेड टैंक'],
    avoid: ['Entrance', 'Kitchen'],
    hindiAvoid: ['प्रवेश द्वार', 'रसोई'],
    color: 'bg-slate-500',
    description: 'Zone of Profits and Gains.',
    hindiDescription: 'लाभ और प्राप्ति का क्षेत्र।'
  },
  'North-West': {
    name: 'North-West',
    shortCode: 'NW',
    hindiName: 'वायव्य',
    element: 'Air',
    ruler: 'Vayu',
    bestFor: ['Guest Room', 'Storage', 'Garage', 'Finished Goods'],
    hindiBestFor: ['अतिथि कक्ष', 'भंडारण', 'गैरेज', 'तैयार माल'],
    avoid: ['Master Bedroom', 'Heavy Construction'],
    hindiAvoid: ['मुख्य शयनकक्ष', 'भारी निर्माण'],
    color: 'bg-zinc-400',
    description: 'Zone of Support and Travel.',
    hindiDescription: 'सहायता और यात्रा का क्षेत्र।'
  }
};

const LiveAudit: React.FC<LiveAuditProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [heading, setHeading] = useState<number>(0);
  const [calibratedHeading, setCalibratedHeading] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const [roll, setRoll] = useState<number>(0);
  const [isShaky, setIsShaky] = useState(false);
  const [calibrationOffset, setCalibrationOffset] = useState<number>(0);
  const [showCalibrationPulse, setShowCalibrationPulse] = useState(false);
  const [currentZone, setCurrentZone] = useState<string>('North');
  const [isMuted, setIsMuted] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<'idle' | 'detecting' | 'selecting' | 'analyzing'>('idle');
  const [detectedUnits, setDetectedUnits] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<VastuResult | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportName, setReportName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const lastSpokenZone = useRef<string>('');

  useEffect(() => {
    startCamera();
    setupOrientation();
    fetchProperties();
    return () => stopCamera();
  }, []);

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access denied:', err);
      setCameraError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const lastHeading = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);

  const setupOrientation = () => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let alpha = event.alpha || 0;
      const beta = event.beta || 0; // Pitch
      const gamma = event.gamma || 0; // Roll

      // Handle iOS webkitCompassHeading
      if ((event as any).webkitCompassHeading !== undefined) {
        alpha = (event as any).webkitCompassHeading;
      }
      
      const now = Date.now();
      const dt = now - lastUpdateTime.current;
      
      if (dt > 100) {
        const diff = Math.abs(alpha - lastHeading.current);
        // Handle wrap around
        const normalizedDiff = diff > 180 ? 360 - diff : diff;
        
        setIsShaky(normalizedDiff > 15); // If moved more than 15 degrees in 100ms
        lastHeading.current = alpha;
        lastUpdateTime.current = now;
      }

      setHeading(Math.round(alpha));
      setPitch(Math.round(beta));
      setRoll(Math.round(gamma));
      const adjusted = (alpha - calibrationOffset + 360) % 360;
      setCalibratedHeading(Math.round(adjusted));
      updateZone(alpha, calibrationOffset);
    };

    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // iOS 13+ requires explicit permission
      setPermissionGranted(false);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
      setPermissionGranted(true);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation);
  };

  const requestOrientationPermission = async () => {
    try {
      const response = await (DeviceOrientationEvent as any).requestPermission();
      if (response === 'granted') {
        window.addEventListener('deviceorientation', (event) => {
          const alpha = (event as any).webkitCompassHeading || event.alpha || 0;
          const beta = event.beta || 0;
          const gamma = event.gamma || 0;
          
          setHeading(Math.round(alpha));
          setPitch(Math.round(beta));
          setRoll(Math.round(gamma));
          const adjusted = (alpha - calibrationOffset + 360) % 360;
          setCalibratedHeading(Math.round(adjusted));
          updateZone(alpha, calibrationOffset);
        });
        setPermissionGranted(true);
      }
    } catch (err) {
      console.error('Orientation permission denied:', err);
    }
  };

  const updateZone = (alpha: number, offset: number) => {
    const adjustedAlpha = (alpha - offset + 360) % 360;
    let zone = 'North';
    if (adjustedAlpha >= 22.5 && adjustedAlpha < 67.5) zone = 'North-East';
    else if (adjustedAlpha >= 67.5 && adjustedAlpha < 112.5) zone = 'East';
    else if (adjustedAlpha >= 112.5 && adjustedAlpha < 157.5) zone = 'South-East';
    else if (adjustedAlpha >= 157.5 && adjustedAlpha < 202.5) zone = 'South';
    else if (adjustedAlpha >= 202.5 && adjustedAlpha < 247.5) zone = 'South-West';
    else if (adjustedAlpha >= 247.5 && adjustedAlpha < 292.5) zone = 'West';
    else if (adjustedAlpha >= 292.5 && adjustedAlpha < 337.5) zone = 'North-West';
    else zone = 'North';

    setCurrentZone(zone);
  };

  const handleCalibrate = () => {
    // Set current heading as North (0 offset)
    setCalibrationOffset(heading);
    setCalibratedHeading(0);
    updateZone(heading, heading);
    
    // Visual feedback
    setShowCalibrationPulse(true);
    setTimeout(() => setShowCalibrationPulse(false), 1000);
    
    if (!isMuted && window.speechSynthesis) {
      const msg = new SpeechSynthesisUtterance("North direction calibrated.");
      msg.lang = 'en-US';
      window.speechSynthesis.speak(msg);
    }
  };

  useEffect(() => {
    if (!isMuted && currentZone !== lastSpokenZone.current) {
      speakZone(currentZone);
      lastSpokenZone.current = currentZone;
    }
  }, [currentZone, isMuted]);

  const speakZone = (zoneName: string) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const zone = VASTU_ZONES[zoneName];
    
    // English Speech
    const enMsg = new SpeechSynthesisUtterance();
    const bestForEn = zone.bestFor.slice(0, 2).join(' and ');
    const avoidEn = zone.avoid.slice(0, 2).join(' and ');
    enMsg.text = `${zone.name} zone. ${zone.description}. Recommended for ${bestForEn}. Avoid ${avoidEn}.`;
    enMsg.lang = 'en-US';
    enMsg.rate = 0.95;

    // Hindi Speech
    const hiMsg = new SpeechSynthesisUtterance();
    const bestForHi = zone.hindiBestFor.slice(0, 2).join(' और ');
    const avoidHi = zone.hindiAvoid.slice(0, 2).join(' और ');
    hiMsg.text = `${zone.hindiName} क्षेत्र। ${zone.hindiDescription} यह ${bestForHi} के लिए उत्तम है। यहाँ ${avoidHi} से बचें।`;
    hiMsg.lang = 'hi-IN';
    hiMsg.rate = 0.95;

    window.speechSynthesis.speak(enMsg);
    window.speechSynthesis.speak(hiMsg);
  };

  const handleAnalyze = async (unit?: string) => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setAnalysisStep('analyzing');
    try {
      const result = await analyzeFloorPlan(capturedImage, unit);
      setAnalysisResult(result);
      setReportName(`Live Audit - ${new Date().toLocaleDateString()}${unit ? ` (${unit})` : ''}`);
      setShowSaveModal(true);
    } catch (err) {
      alert('Analysis failed. Please try again.');
      setAnalysisStep('idle');
      setCapturedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!analysisResult || !capturedImage) return;
    setIsSaving(true);
    try {
      const reportRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reportName,
          propertyId: selectedPropertyId || undefined,
          result: analysisResult,
          preview: capturedImage
        }),
      });

      if (reportRes.ok) {
        const savedReport = await reportRes.json();
        navigate(`/results/${savedReport._id}`, { state: { report: savedReport } });
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      alert('Failed to save report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const startAnalysisFlow = async () => {
    if (!videoRef.current) return;
    
    // Capture frame
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/png');
      setCapturedImage(imageData);
      
      setIsAnalyzing(true);
      setAnalysisStep('detecting');
      try {
        const detection = await detectUnits(imageData);
        if (detection.hasMultipleUnits && detection.units.length > 1) {
          setDetectedUnits(detection.units);
          setAnalysisStep('selecting');
          setIsAnalyzing(false);
        } else {
          await handleAnalyze();
        }
      } catch (err) {
        console.error('Detection failed:', err);
        await handleAnalyze();
      }
    }
  };

  const zoneData = VASTU_ZONES[currentZone];
  const isTilted = Math.abs(pitch) > 20 || Math.abs(roll) > 20;

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="relative h-[calc(100vh-64px)] bg-black overflow-hidden">
        {/* Camera Feed */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />

        {/* Stability Indicators */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <AnimatePresence>
            {(isTilted || isShaky) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-rose-500/20 backdrop-blur-xl border border-rose-500/50 px-6 py-3 rounded-2xl flex items-center gap-3 z-50"
              >
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">
                  {isShaky ? 'Device Shaky - Hold Steady' : 'Device Tilted - Keep Level'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Virtual Level */}
          <div className="absolute w-48 h-48 border border-white/5 rounded-full">
            <motion.div 
              animate={{ x: roll * 2, y: pitch * 2 }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${isTilted ? 'border-rose-500 bg-rose-500/20' : 'border-emerald-500 bg-emerald-500/20'} transition-colors`}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Overlay UI */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {/* Top Bar */}
          <div className="p-6 flex justify-between items-start pointer-events-auto">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-end gap-3">
              <div className="flex gap-2">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                  <div className={`w-2 h-2 rounded-full ${calibrationOffset !== 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">
                    {calibrationOffset !== 0 ? 'Manual North' : 'Magnetic North'}
                  </span>
                </div>
                <button 
                  onClick={handleCalibrate}
                  className="px-4 py-2 bg-emerald-500/20 backdrop-blur-md rounded-full text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
                  title="Align to current direction"
                >
                  Set North
                </button>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3 backdrop-blur-md rounded-full text-white transition-all ${isMuted ? 'bg-rose-500/50 border border-rose-500/50' : 'bg-black/50 border border-white/10'}`}
                  title={isMuted ? "Unmute Voice" : "Mute Voice"}
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
              </div>
              <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 text-white font-mono text-sm flex items-center gap-2">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mr-1">Heading</span>
                {calibratedHeading}° {zoneData.shortCode}
              </div>
            </div>
          </div>

          {/* Center Compass / Chakra Overlay */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {capturedImage ? (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black">
                <img src={capturedImage} className="w-full h-full object-contain opacity-50" alt="Captured" />
                <motion.div 
                  initial={{ top: '-10%' }}
                  animate={{ top: '110%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.8)] z-50"
                />
                <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] z-40 animate-pulse" />
                <div className="absolute bottom-24 left-0 right-0 flex flex-col items-center gap-4 z-50">
                  <div className="px-6 py-3 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                    <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    {analysisStep === 'detecting' ? 'Detecting Units...' : 'Neural Vastu Audit...'}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <VastuChakra heading={calibratedHeading} currentZone={currentZone} />
                
                {/* Shutter Button */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                  <button
                    onClick={startAnalysisFlow}
                    disabled={isAnalyzing}
                    className="group relative flex items-center justify-center"
                  >
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl group-hover:bg-emerald-500/40 transition-all animate-pulse" />
                    <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center p-1 bg-black/20 backdrop-blur-sm group-active:scale-95 transition-all">
                      <div className="w-full h-full rounded-full bg-white group-hover:bg-emerald-400 transition-colors flex items-center justify-center">
                        <Scan className="w-8 h-8 text-slate-950" />
                      </div>
                    </div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/50 backdrop-blur-md border border-white/10 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] font-black uppercase tracking-widest text-white">Capture & Audit</span>
                    </div>
                  </button>
                </div>
              </>
            )}
            
            {/* Calibration Pulse */}
            <AnimatePresence>
              {showCalibrationPulse && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 2, opacity: 1 }}
                  exit={{ scale: 3, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-32 h-32 border-4 border-emerald-500 rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Center Pointer (Fixed) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-0.5 h-16 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
              <div className="absolute w-4 h-4 bg-emerald-500 rounded-full border-4 border-black shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
            </div>
          </div>

          {/* Bottom Info Card */}
          <div className="p-6 pointer-events-auto">
            {analysisStep === 'selecting' && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-slate-900 border border-emerald-500/30 rounded-[2.5rem] p-8 space-y-6 z-50 relative"
              >
                <div className="text-center">
                  <h3 className="text-xl font-serif font-bold text-white mb-1">Multiple Units Detected</h3>
                  <p className="text-slate-400 text-xs">Select the unit to audit from the live view.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {detectedUnits.map((unit, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnalyze(unit)}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-emerald-500 transition-all group"
                    >
                      <span className="text-white font-bold text-xs">{unit}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCapturedImage(null)}
                  className="w-full py-3 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel Audit
                </button>
              </motion.div>
            )}

            {!permissionGranted && (
              <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="mb-4 p-6 bg-emerald-500 rounded-[2rem] text-slate-950 flex flex-col items-center gap-4 text-center"
              >
                <Compass className="w-12 h-12" />
                <div>
                  <h3 className="font-black uppercase tracking-widest text-sm">Compass Calibration Required</h3>
                  <p className="text-xs font-bold opacity-80 mt-1">We need access to your device sensors for real-time Vastu analysis.</p>
                </div>
                <button 
                  onClick={requestOrientationPermission}
                  className="w-full py-4 bg-slate-950 text-white font-black rounded-2xl uppercase tracking-widest text-xs"
                >
                  Enable Sensors
                </button>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div 
                key={currentZone}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`w-3 h-3 rounded-full ${zoneData.color} animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.3)]`} />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Current Zone</span>
                    </div>
                    <h2 className="text-4xl font-serif font-bold text-white leading-none">
                      {zoneData.name} <span className="text-emerald-500 text-2xl ml-2">({zoneData.shortCode})</span>
                      <span className="block text-white/30 text-2xl mt-2">{zoneData.hindiName}</span>
                    </h2>
                  </div>
                  <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-center">
                    <span className="block text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Element</span>
                    <span className="text-xs font-bold text-emerald-400">{zoneData.element}</span>
                  </div>
                </div>

                <p className="text-slate-300 text-sm font-medium mb-8 leading-relaxed">
                  {zoneData.description}
                  <span className="block mt-2 text-slate-500 italic text-xs">{zoneData.hindiDescription}</span>
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full" /> Best For
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {zoneData.bestFor.map(item => (
                        <span key={item} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-2">
                      <div className="w-1 h-1 bg-rose-400 rounded-full" /> Avoid
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {zoneData.avoid.map(item => (
                        <span key={item} className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-bold text-rose-400">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {cameraError && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
            <Camera className="w-16 h-16 text-rose-500 mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Camera Error</h3>
            <p className="text-slate-400 text-sm mb-8">{cameraError}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs"
            >
              Go Back
            </button>
          </div>
        )}

        {/* Save Report Modal */}
        <AnimatePresence>
          {showSaveModal && analysisResult && (
            <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] p-10 space-y-8 shadow-2xl"
              >
                <div className="text-center space-y-2">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scan className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white">Audit Complete</h3>
                  <p className="text-slate-400 text-sm">Your Vastu analysis is ready. Save it to your profile to view recommendations.</p>
                </div>

                <div className="flex items-center justify-between p-6 bg-slate-950 rounded-3xl border border-slate-800">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Vastu Score</p>
                    <p className="text-3xl font-serif font-bold text-emerald-500">{analysisResult.score}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Verdict</p>
                    <p className="text-xs font-serif italic text-emerald-400">{analysisResult.verdict}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Report Name</label>
                    <input
                      type="text"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Enter report name..."
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Associate with Property (Optional)</label>
                    <select
                      value={selectedPropertyId}
                      onChange={(e) => setSelectedPropertyId(e.target.value)}
                      className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:border-emerald-500 outline-none transition-colors appearance-none"
                    >
                      <option value="">Select a property...</option>
                      {properties.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving || !reportName}
                    className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    Save & View Report
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveModal(false);
                      setAnalysisResult(null);
                      setCapturedImage(null);
                      setAnalysisStep('idle');
                    }}
                    className="w-full py-4 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Discard Results
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default LiveAudit;

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, CheckCircle2, AlertCircle, Zap, ZapOff } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stability, setStability] = useState(100); // 0-100
  const [isSteady, setIsSteady] = useState(true);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  
  // Stabilization state
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastAccel = useRef({ x: 0, y: 0, z: 0 });
  const stabilityBuffer = useRef<number[]>([]);

  useEffect(() => {
    startCamera();
    window.addEventListener('devicemotion', handleMotion);
    return () => {
      stopCamera();
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsReady(true);
        
        // Check for flashlight capability
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        setHasFlash(!!capabilities.torch);
      }
    } catch (err) {
      setError('Camera access denied. Please enable permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleMotion = (event: DeviceMotionEvent) => {
    const accel = event.accelerationIncludingGravity;
    if (!accel) return;

    // Calculate instantaneous "shakiness"
    const dx = accel.x! - lastAccel.current.x;
    const dy = accel.y! - lastAccel.current.y;
    const dz = accel.z! - lastAccel.current.z;
    const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Update stability buffer (last 10 readings)
    stabilityBuffer.current.push(magnitude);
    if (stabilityBuffer.current.length > 10) stabilityBuffer.current.shift();

    const avgShakiness = stabilityBuffer.current.reduce((a, b) => a + b, 0) / stabilityBuffer.current.length;
    
    // Convert to 0-100 stability score (lower shakiness = higher stability)
    const newStability = Math.max(0, Math.min(100, 100 - (avgShakiness * 20)));
    setStability(newStability);
    setIsSteady(newStability > 85);

    // Software stabilization offset (inverse of movement)
    // We use a small factor to avoid over-correcting and causing nausea
    setOffset({
      x: -accel.x! * 2,
      y: accel.y! * 2
    });

    lastAccel.current = { x: accel.x!, y: accel.y!, z: accel.z! };
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) onCapture(blob);
      }, 'image/jpeg', 0.95);
    }
  };

  const toggleFlashlight = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    
    try {
      await track.applyConstraints({
        advanced: [{ torch: !isFlashOn }]
      } as any);
      setIsFlashOn(!isFlashOn);
    } catch (err) {
      console.error('Failed to toggle flashlight:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      <div className="relative flex-1 overflow-hidden flex items-center justify-center">
        {/* Stabilized Video Feed */}
        <motion.video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          animate={{ 
            x: offset.x, 
            y: offset.y,
            scale: 1.1 // Slight zoom to hide edges during stabilization
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 30, mass: 0.5 }}
          className="w-full h-full object-cover"
        />

        {/* HUD Overlays */}
        <div className="absolute inset-0 pointer-events-none flex flex-col p-8">
          <div className="flex justify-between items-start">
            <button 
              onClick={onClose}
              className="p-4 bg-black/40 backdrop-blur-md rounded-full text-white pointer-events-auto hover:bg-white/10 transition-all"
            >
              <RefreshCw className="w-6 h-6 rotate-45" />
            </button>
            
            <div className="flex flex-col items-end gap-4">
              {hasFlash && (
                <button 
                  onClick={toggleFlashlight}
                  className={`p-4 backdrop-blur-md rounded-full text-white pointer-events-auto transition-all ${isFlashOn ? 'bg-amber-500/50 border border-amber-500/50' : 'bg-black/40 border border-white/10 hover:bg-white/10'}`}
                >
                  {isFlashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6" />}
                </button>
              )}
              
              <div className="px-6 py-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${stability}%` }}
                    className={`h-full ${isSteady ? 'bg-emerald-500' : 'bg-amber-500'} transition-colors`}
                  />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  Stability: {Math.round(stability)}%
                </span>
              </div>
            </div>
          </div>

          {/* Framing Guide */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div 
              animate={isSteady ? { 
                borderColor: ['rgba(255,255,255,0.2)', 'rgba(16,185,129,0.5)', 'rgba(255,255,255,0.2)'],
                scale: [1, 1.02, 1]
              } : { 
                borderColor: 'rgba(255,255,255,0.2)',
                scale: 1
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-64 h-64 border-2 rounded-[3rem] relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest">
                Align Blueprint
              </div>
              {/* Corner Accents */}
              <motion.div 
                animate={isSteady ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.5 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500 rounded-tl-[2rem]" 
              />
              <motion.div 
                animate={isSteady ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.5 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500 rounded-tr-[2rem]" 
              />
              <motion.div 
                animate={isSteady ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.5 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500 rounded-bl-[2rem]" 
              />
              <motion.div 
                animate={isSteady ? { opacity: [0.5, 1, 0.5] } : { opacity: 0.5 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500 rounded-br-[2rem]" 
              />
            </motion.div>
          </div>

          {/* Stability Feedback */}
          <div className="flex justify-center mb-12">
            <AnimatePresence mode="wait">
              {!isSteady ? (
                <motion.div 
                  key="shaky"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="px-6 py-3 bg-rose-500/20 backdrop-blur-xl border border-rose-500/50 rounded-2xl flex items-center gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Hold Steady to Capture</span>
                </motion.div>
              ) : (
                <motion.div 
                  key="steady"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="px-6 py-3 bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/50 rounded-2xl flex items-center gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-white text-[10px] font-black uppercase tracking-widest">Ready for Scan</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Capture Button */}
          <div className="flex justify-center pb-12">
            <button
              onClick={captureImage}
              disabled={!isSteady || !isReady}
              className={`w-20 h-20 rounded-full border-4 transition-all flex items-center justify-center pointer-events-auto ${
                isSteady ? 'border-emerald-500 bg-emerald-500/20 scale-110' : 'border-white/20 bg-white/5 opacity-50'
              }`}
            >
              <div className={`w-14 h-14 rounded-full transition-all ${isSteady ? 'bg-emerald-500' : 'bg-white/20'}`} />
            </button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Camera Error</h3>
          <p className="text-slate-400 text-sm mb-8">{error}</p>
          <button 
            onClick={onClose}
            className="px-8 py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-xs"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;

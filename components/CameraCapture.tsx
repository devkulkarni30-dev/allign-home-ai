
import React, { useEffect, useRef, useState } from 'react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Stabilization & Motion States
  const [stability, setStability] = useState(100); // 0-100
  const [isStable, setIsStable] = useState(true);
  const motionRef = useRef({ x: 0, y: 0, z: 0 });
  const [edgeDetected, setEdgeDetected] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', 
            width: { ideal: 3840 }, 
            height: { ideal: 2160 } 
          },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions and ensure no other app is using it.");
      }
    };

    startCamera();

    // Motion Sensor Logic for Stabilization
    const handleMotion = (event: DeviceMotionEvent) => {
      const accel = event.acceleration;
      if (!accel) return;

      const { x, y, z } = accel;
      const dx = x || 0;
      const dy = y || 0;
      const dz = z || 0;

      // Calculate magnitude of motion
      const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      // Map magnitude to stability (0.5 m/s^2 is considered "shaky")
      const currentStability = Math.max(0, 100 - (magnitude * 150));
      setStability(prev => (prev * 0.8) + (currentStability * 0.2)); // Smooth the value
      
      const stable = magnitude < 0.25;
      setIsStable(stable);
      
      // Simulate edge detection based on focus/stability
      if (stable && Math.random() > 0.7) {
        setEdgeDetected(true);
        setTimeout(() => setEdgeDetected(false), 2000);
      }
    };

    // Request permission for iOS if needed
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      (DeviceMotionEvent as any).requestPermission()
        .then((response: string) => {
          if (response === 'granted') {
            window.addEventListener('devicemotion', handleMotion);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  const capture = () => {
    if (videoRef.current && canvasRef.current && !isCapturing) {
      if (!isStable) {
        // Optional: Show warning or prevent capture if too shaky
        // For now, we allow it but the UI encourages stability
      }

      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col overflow-hidden animate-in fade-in duration-300">
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-950">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Camera Failure</h2>
            <p className="text-slate-400 text-sm max-w-xs mb-8">{error}</p>
            <button onClick={onClose} className="px-8 py-3 bg-slate-800 rounded-xl text-white font-bold uppercase tracking-widest text-xs">Return Home</button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${!isStable ? 'blur-[2px] opacity-80' : 'blur-0 opacity-100'}`} 
            />
            
            {/* Edge Detection Overlay Simulation */}
            <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${edgeDetected ? 'opacity-40' : 'opacity-0'}`}>
               <div className="w-full h-full border-[10px] border-emerald-500/20 mix-blend-overlay animate-pulse" />
               <svg className="absolute inset-0 w-full h-full">
                  <path d="M100,100 L900,100 L900,900 L100,900 Z" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="10 5" className="animate-[dash_20s_linear_infinite]" />
               </svg>
            </div>

            {/* UI Overlay Controls - Top */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-serif font-bold text-white flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isStable ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse shadow-[0_0_10px_currentColor]`} />
                  Blueprint <span className="text-emerald-400">Scanner</span>
                </h2>
                <div className="flex items-center gap-2">
                   <p className="text-[10px] text-emerald-400/70 font-black uppercase tracking-[0.3em]">
                     {isStable ? 'Neural Focus Locked' : 'Stabilizing Lens...'}
                   </p>
                </div>
              </div>
              <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl text-white hover:bg-white/20 transition-all border border-white/10 active:scale-90">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Stability Indicator */}
            <div className="absolute top-24 left-6 z-20 flex items-center gap-3">
               <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                  <div 
                    className={`h-full transition-all duration-300 ${stability > 80 ? 'bg-emerald-500' : stability > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${stability}%` }}
                  />
               </div>
               <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Stability</span>
            </div>

            {/* Scanning HUD - Full Screen Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className={`absolute inset-8 md:inset-20 border-2 transition-colors duration-500 ${isStable ? 'border-emerald-500/40' : 'border-amber-500/20'} rounded-3xl`}>
                <div className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 ${isStable ? 'border-emerald-500' : 'border-amber-500'} rounded-tl-3xl -mt-1 -ml-1 transition-colors`} />
                <div className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 ${isStable ? 'border-emerald-500' : 'border-amber-500'} rounded-tr-3xl -mt-1 -mr-1 transition-colors`} />
                <div className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 ${isStable ? 'border-emerald-500' : 'border-amber-500'} rounded-bl-3xl -mb-1 -ml-1 transition-colors`} />
                <div className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 ${isStable ? 'border-emerald-500' : 'border-amber-500'} rounded-br-3xl -mb-1 -mr-1 transition-colors`} />
                
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-[radar_3s_ease-in-out_infinite]" />
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-8 h-8 border rounded-full flex items-center justify-center transition-colors ${isStable ? 'border-emerald-500/40' : 'border-white/20'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isStable ? 'bg-emerald-500' : 'bg-white/40'}`} />
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{ 
                  backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', 
                  backgroundSize: '40px 40px' 
                }} />
              </div>
            </div>

            {/* Controls - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-12 flex flex-col items-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex flex-col items-center gap-2">
                 <p className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors ${isStable ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`}>
                   {isStable ? 'Ready for High-Res Capture' : 'Hold Steady for Edge Detection'}
                 </p>
                 <p className="text-[8px] text-slate-500 uppercase font-bold">Vedic AI Analysis requires clear edges</p>
              </div>

              <div className="relative flex items-center justify-center">
                <div className={`absolute inset-0 transition-all duration-500 blur-2xl rounded-full scale-150 ${isStable ? 'bg-emerald-500/30' : 'bg-amber-500/10'}`} />
                
                {/* Stability Progress Ring */}
                <svg className="absolute w-32 h-32 -rotate-90 pointer-events-none">
                   <circle 
                     cx="64" cy="64" r="58" 
                     fill="none" stroke="currentColor" strokeWidth="2" 
                     className="text-white/5" 
                   />
                   <circle 
                     cx="64" cy="64" r="58" 
                     fill="none" stroke="currentColor" strokeWidth="4" 
                     strokeDasharray="364.4"
                     strokeDashoffset={364.4 - (364.4 * stability / 100)}
                     className={`transition-all duration-300 ${isStable ? 'text-emerald-500' : 'text-amber-500'}`}
                     strokeLinecap="round"
                   />
                </svg>

                <button 
                  onClick={capture}
                  disabled={isCapturing}
                  className="relative w-24 h-24 rounded-full border-4 border-white/20 p-2 hover:scale-105 transition-all active:scale-90 group disabled:opacity-50"
                >
                  <div className={`w-full h-full rounded-full ${isCapturing ? 'bg-amber-500' : isStable ? 'bg-white group-hover:bg-emerald-500' : 'bg-slate-800'} transition-all flex items-center justify-center`}>
                    {isCapturing ? (
                      <div className="w-8 h-8 border-4 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                    ) : (
                      <svg className={`w-10 h-10 transition-colors ${isStable ? 'text-slate-950' : 'text-white/20'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;

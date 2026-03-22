
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
  videoUrl?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialGuide: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: TutorialStep[] = [
    {
      title: "Floor Plan Scanner",
      description: "Upload a digital blueprint or use your camera to scan physical drawings. Our Neural Engine identifies walls, rooms, and the critical North mark to map 16 Vastu zones with architectural precision.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A2 2 0 013 15.482V6.518a2 2 0 011.553-1.954l5.447-1.362a2 2 0 011.006 0l5.447 1.362A2 2 0 0118 6.518v8.964a2 2 0 01-1.553 1.954L11 20z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l2-1 2 1" />
        </svg>
      )
    },
    {
      title: "Video Tutorial: Scanning",
      description: "Watch how to properly scan your floor plan. Ensure the North mark is clearly visible and the image is well-lit for 99.9% audit accuracy.",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-architect-working-on-a-blueprint-4034-large.mp4",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Vision Pro: Live Audit",
      description: "Walk through your property in real-time. The AI uses your camera to detect rooms and furniture, providing instant Vastu compliance feedback and suggested remedies as you move.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )
    },
    {
      title: "Comparison Engine",
      description: "Choosing between two apartments? Upload both layouts to our Parallel Neural Engine. We'll compare their Vedic harmony scores side-by-side to help you make the most auspicious choice.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: "3D Spatial Remedies",
      description: "Visualize structural corrections in immersive 3D. See exactly where to place Vastu pyramids, color strips, or furniture to restore energy balance without major renovations.",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      )
    }
  ];

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      setCurrentStep(0);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none" />
        
        <div className="p-10 md:p-12 space-y-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                {steps[currentStep].icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">Module {currentStep + 1} of {steps.length}</p>
                <h2 className="text-2xl font-serif font-bold text-white">{steps[currentStep].title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="relative h-48 md:h-64 bg-slate-950/50 rounded-3xl border border-slate-800/50 flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 scan-grid opacity-10" />
             <AnimatePresence mode="wait">
               <motion.div 
                 key={currentStep}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="w-full h-full flex flex-col items-center justify-center"
               >
                 {steps[currentStep].videoUrl ? (
                   <div className="w-full h-full p-4">
                     <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative group">
                        <video 
                          src={steps[currentStep].videoUrl} 
                          className="w-full h-full object-cover opacity-60"
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                           <div className="w-16 h-16 bg-emerald-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform mb-4">
                              <svg className="w-8 h-8 text-emerald-400 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                           </div>
                           <p className="text-white text-xs font-medium max-w-[200px] leading-relaxed">
                             {steps[currentStep].description}
                           </p>
                        </div>
                        <div className="absolute bottom-4 left-4">
                           <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em]">Live Demo</p>
                        </div>
                     </div>
                   </div>
                 ) : (
                   <div className="px-8 text-center">
                     <p className="text-slate-400 text-sm leading-relaxed font-medium">
                       {steps[currentStep].description}
                     </p>
                   </div>
                 )}
               </motion.div>
             </AnimatePresence>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-emerald-500' : 'w-2 bg-slate-800'}`} 
                />
              ))}
            </div>
            
            <div className="flex gap-4">
              {currentStep > 0 && (
                <button 
                  onClick={prev}
                  className="px-6 py-3 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  Back
                </button>
              )}
              <button 
                onClick={next}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl transition-all active:scale-95"
              >
                {currentStep === steps.length - 1 ? "Get Started" : "Next Module"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TutorialGuide;

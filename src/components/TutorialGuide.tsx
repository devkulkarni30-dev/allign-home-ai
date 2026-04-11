import React from 'react';

interface TutorialGuideProps {
  onClose: () => void;
}

const TutorialGuide: React.FC<TutorialGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-serif font-bold text-white uppercase tracking-widest">Tutorial Guide</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="space-y-12">
          <div className="aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl relative group">
            <video 
              src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
              controls 
              className="w-full h-full object-cover"
              poster="https://picsum.photos/seed/vastu/1920/1080"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 group-hover:opacity-0 transition-opacity pointer-events-none">
              <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 shadow-2xl">
                <svg className="w-10 h-10 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 font-serif font-bold border border-emerald-500/20">01</div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs">Identify North</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Always ensure the North direction is clearly marked on your floor plan for accurate 16-zone mapping.</p>
            </div>
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 font-serif font-bold border border-emerald-500/20">02</div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs">Clear Contrast</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Use high-resolution images with clear room labels. Avoid blurry or low-light captures.</p>
            </div>
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 font-serif font-bold border border-emerald-500/20">03</div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs">Unit Audit</h4>
              <p className="text-slate-500 text-sm leading-relaxed">If your plan has multiple units, audit them individually for the most precise neural feedback.</p>
            </div>
          </div>

          <div className="p-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[3rem] space-y-4 text-center">
            <h4 className="text-emerald-400 font-serif font-bold text-xl">Pro Tip: Augmented Vision</h4>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">Use the <strong>Live Site Audit</strong> feature to overlay Vastu zones directly onto your physical environment using your device's camera and compass.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialGuide;

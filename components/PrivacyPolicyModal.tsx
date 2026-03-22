
import React from 'react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-950/80 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-xl font-serif font-bold text-white">Vedic Privacy Policy</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm text-slate-300 leading-relaxed font-medium custom-scrollbar">
          <section className="space-y-3">
            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs">1. Data Architecture</h3>
            <p>At <strong>AlignHome.ai</strong>, we respect the sanctity of your living spaces and your personal data. We collect your name, email, and contact details solely for account management and session persistence.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs">2. Architectural Analysis (Gemini AI)</h3>
            <p>Uploaded floor plans and 3D models are processed using Google's Gemini API. This data is used to perform directional orientation, zonal mapping, and compliance calculations. We do not use your architectural blueprints for model training purposes.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs">3. Session Storage</h3>
            <p>To provide a seamless experience, we store your most recent analysis (last 1 session) in your browser's local storage. This data is tied to your account ID and can be cleared by logging out or manually resetting your browser cache.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs">4. Third-Party Services</h3>
            <p>Our platform uses Google Sign-In for authentication and AdSense for localized architectural recommendations. Each service operates under its respective privacy framework.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs">5. Cookie Technology</h3>
            <p>We utilize essential cookies to maintain your authenticated state and purely functional cookies to remember your interface preferences (e.g., Single vs Compare mode).</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs">6. Rights & Consent</h3>
            <p>By using the platform, you consent to the processing of your data as described. You may request account deletion at any time by contacting our Vedic Neural Computing Division.</p>
          </section>
        </div>

        <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;

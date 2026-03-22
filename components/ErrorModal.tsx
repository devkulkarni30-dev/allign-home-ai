
import React from 'react';

interface ErrorModalProps {
  isOpen: boolean;
  message: string | null;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen || !message) return null;

  const msgLower = message.toLowerCase();
  const isNMarkError = msgLower.includes('n direction mark');
  const isQuotaError = msgLower.includes('quota') || msgLower.includes('429') || msgLower.includes('resource_exhausted');

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/60 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center space-y-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto border flex-shrink-0 ${isQuotaError ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
            {isQuotaError ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-white">{isQuotaError ? 'System Capacity Reached' : 'Validation Failed'}</h3>
            <p className={`text-slate-400 text-sm leading-relaxed ${isNMarkError ? 'font-bold text-rose-400' : ''}`}>
              {message}
            </p>
          </div>

          <button 
            onClick={onClose}
            className={`w-full py-4 font-bold rounded-2xl border transition-all active:scale-95 ${isQuotaError ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'}`}
          >
            Acknowledge & Dismiss
          </button>
        </div>
        
        {isNMarkError && (
          <div className="bg-rose-500/5 border-t border-rose-500/10 p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
               <span className="font-serif font-bold text-lg">N</span>
            </div>
            <p className="text-[10px] text-rose-400/80 uppercase tracking-widest font-bold leading-tight">
              Pro Tip: Ensure the North arrow is clearly visible on your plan to enable 16-zone alignment.
            </p>
          </div>
        )}

        {isQuotaError && (
          <div className="bg-amber-500/5 border-t border-amber-500/10 p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="text-[10px] text-amber-400/80 uppercase tracking-widest font-bold leading-tight">
              Notice: You are using the community-shared engine. High demand can trigger rate limits. Waiting a few minutes usually resolves this.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorModal;

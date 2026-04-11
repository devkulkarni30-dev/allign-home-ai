import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  setShowTutorial?: (show: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, setShowTutorial }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-6 h-20 flex items-center justify-between">
        <Link to="/" className="text-xl font-serif font-bold text-white uppercase">
          AlignHome<span className="text-emerald-400">.ai</span>
        </Link>
        <div className="flex items-center gap-4">
          {setShowTutorial && (
            <button onClick={() => setShowTutorial(true)} className="p-2 text-slate-400 hover:text-white transition-colors" title="Help & Tutorial">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
          )}
          <Link to="/feedback" className="p-2 text-slate-400 hover:text-white transition-colors" title="Feedback">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="p-2 text-slate-400 hover:text-white transition-colors" title="My Profile">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </Link>
              <Link to="/subscription" className="px-4 py-2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-transform">Upgrade Plan</Link>
              <button onClick={onLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors" title="Logout">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </>
          ) : (
            <Link to="/login" className="px-6 py-2 bg-emerald-500 text-slate-950 text-[10px] font-black uppercase rounded-xl hover:scale-105 transition-transform">Login</Link>
          )}
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>

      {/* Floating Feedback Button */}
      {location.pathname !== '/feedback' && (
        <Link 
          to="/feedback" 
          className="fixed bottom-8 right-8 z-[100] group flex items-center gap-3 px-6 py-4 bg-emerald-500 text-slate-950 rounded-2xl shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-105 transition-all active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
          </svg>
          <span className="text-xs font-black uppercase tracking-widest overflow-hidden max-w-0 group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">
            Give Feedback
          </span>
        </Link>
      )}

      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-white font-serif font-bold text-lg">AlignHome.ai</h2>
            <p className="text-slate-500 text-sm mt-2">Vedic Architecture powered by Neural Intelligence.</p>
          </div>
          <div className="flex gap-8 text-slate-400 text-xs font-black uppercase tracking-widest">
            <Link to="/" className="hover:text-emerald-400 transition-colors">Home</Link>
            <Link to="/dashboard" className="hover:text-emerald-400 transition-colors">Audit</Link>
            <Link to="/comparison" className="hover:text-emerald-400 transition-colors">Compare</Link>
            <Link to="/profile" className="hover:text-emerald-400 transition-colors">History</Link>
            <Link to="/feedback" className="hover:text-emerald-400 transition-colors">Feedback</Link>
          </div>
          <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest">© 2026 AlignHome.ai. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;


import React, { useState, useEffect } from 'react';
import { User } from '../types';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact: '',
    password: ''
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        onLogin(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      window.open(url, 'google_oauth', 'width=600,height=700');
    } catch (err: any) {
      setError('Google Sign-In failed to initialize. Ensure CLIENT_ID is set.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-amber-500 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl shadow-2xl shadow-emerald-500/20 mb-2">
            <svg className="w-10 h-10 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-4xl font-serif font-bold text-white tracking-tight">AlignHome<span className="text-emerald-400">.ai</span></h1>
          <p className="text-slate-400 font-medium">Vedic Neural Computing Division</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex bg-slate-800/50 p-1 rounded-xl mb-8">
            <button 
              onClick={() => { setIsSignup(false); setError(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSignup ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >Login</button>
            <button 
              onClick={() => { setIsSignup(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSignup ? 'bg-emerald-500 text-slate-900' : 'text-slate-400 hover:text-white'}`}
            >Sign Up</button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-2">Full Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="Arun Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-2">Email Address</label>
              <input 
                required
                type="email" 
                placeholder="architect@vedic.ai"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
              />
            </div>
            {isSignup && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-2">Contact Number</label>
                <input 
                  required
                  type="tel" 
                  placeholder="+91 00000 00000"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
                />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 ml-2">Security Key</label>
              <input 
                required
                type="password" 
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignup ? 'Initialize Account' : 'Authenticate Session')}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-[10px] uppercase font-bold text-slate-600">Secure Access</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <button 
            onClick={handleGoogleSignIn}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500 font-medium">
          By continuing, you agree to our <span className="text-slate-300 underline cursor-pointer">Terms of Architecture</span> and <span onClick={() => setIsPrivacyOpen(true)} className="text-slate-300 underline cursor-pointer hover:text-emerald-400 transition-colors">Vedic Privacy Policy</span>.
        </p>
      </div>

      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
    </div>
  );
};


export default LoginPage;

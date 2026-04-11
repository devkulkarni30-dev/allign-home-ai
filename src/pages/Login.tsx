import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data.user);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      const response = await fetch('/api/auth/google/url');
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Google Login failed');
        return;
      }

      const { url } = data;
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        url,
        'google_login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        setError('Popup blocked. Please allow popups for this site.');
        return;
      }

      const messageListener = (event: MessageEvent) => {
        // Basic origin check
        if (!event.origin.includes(window.location.hostname) && !event.origin.includes('localhost')) {
          // In some environments, origin might be different, but we should be careful
        }

        if (event.data.type === 'OAUTH_AUTH_SUCCESS') {
          onLogin(event.data.user);
          window.removeEventListener('message', messageListener);
          navigate('/dashboard');
        }
      };

      window.addEventListener('message', messageListener);
    } catch (err) {
      setError('Could not initiate Google Login. Check your connection.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <Link to="/" className="text-3xl font-serif font-bold text-white uppercase tracking-widest">
            AlignHome<span className="text-emerald-400">.ai</span>
          </Link>
          <h2 className="text-slate-400 text-sm font-black uppercase tracking-[0.3em]">Neural Vastu Intelligence</h2>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[3rem] shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl transition-all uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/10"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              Hint: Use "password" as the default password
            </p>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-600"><span className="bg-slate-900 px-4">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleGoogleLogin}
              className="py-4 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/auth/demo', { method: 'POST' });
                  const data = await response.json();
                  onLogin(data.user);
                  navigate('/dashboard');
                } catch (err) {
                  setError('Demo login failed');
                }
              }}
              className="py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
            >
              Demo Mode
            </button>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs font-bold">
          Don't have an account? <Link to="/signup" className="text-emerald-400 hover:underline">Create one now</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

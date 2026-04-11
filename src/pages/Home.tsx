import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const ArchitecturalHero = () => (
    <div className="relative w-full h-48 md:h-64 rounded-[3rem] bg-slate-900 overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center group mb-12">
      <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
        <div className="scan-grid w-full h-full" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
        <svg className="w-16 h-16 text-emerald-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Ready for Neural Audit</h3>
          <p className="text-xs text-slate-600 mt-1">Upload or Scan your architectural layout to begin</p>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 border-r border-t border-emerald-500/10 rounded-tr-[3rem] -mt-8 -mr-8" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l border-b border-emerald-500/10 rounded-bl-[3rem] -mb-8 -ml-8" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 mt-12 flex-1 pb-32">
      <div className="space-y-16 animate-in fade-in duration-700">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-white leading-tight">
            AlignHome.ai: The Future of <span className="text-emerald-400">Vastu Shastra</span> for Home
          </h1>
          <p className="text-slate-400 font-medium leading-relaxed text-lg">
            Welcome to <strong>AlignHome.ai</strong>, the ultimate AI Vastu app designed for the modern homeowner. Whether you are moving into a north-facing house, looking for Vastu tips for apartments, or seeking a Vastu-compliant home layout, our platform provides an instant, data-driven virtual Vastu audit.
          </p>
          <div className="pt-8">
            <Link to="/dashboard" className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-2xl transition-all uppercase tracking-[0.2em] text-xs">
              Start Your Audit
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <ArchitecturalHero />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link to="/dashboard" className="group p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-emerald-500 transition-all text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10" />
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">Upload Layout</h3>
            <p className="text-slate-400 text-sm font-medium">Analyze a digital floor plan image or blueprint with 16-zone precision.</p>
          </Link>

          <Link to="/dashboard" className="group p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-emerald-500 transition-all text-left relative overflow-hidden">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">Scan Blueprint</h3>
            <p className="text-slate-400 text-sm font-medium">Use your camera to capture physical drawings and perform an instant Vastu audit.</p>
          </Link>

          <Link to="/live-audit" className="group p-10 bg-slate-900 border border-emerald-500/30 rounded-[3rem] hover:border-emerald-500 transition-all text-left relative overflow-hidden ring-4 ring-emerald-500/5">
            <div className="absolute top-4 right-6 px-3 py-1 bg-emerald-500 rounded-full text-[8px] font-black uppercase text-slate-950 tracking-widest animate-pulse">Vision Pro</div>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-8 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">Live Site Audit</h3>
            <p className="text-slate-400 text-sm font-medium">Perform real-time Vastu checks using augmented vision and compass synchronization.</p>
          </Link>

          <Link to="/comparison" className="group p-10 bg-slate-900 border border-slate-800 rounded-[3rem] hover:border-amber-500 transition-all text-left relative overflow-hidden">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-8 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2">Comparison</h3>
            <p className="text-slate-400 text-sm font-medium">Upload two variations to find the most compliant architectural dwelling.</p>
          </Link>
        </div>

        <section className="max-w-4xl mx-auto space-y-12 py-12 border-t border-slate-800">
          <div className="space-y-4">
            <h2 className="text-3xl font-serif font-bold text-white">Why Choose Our AI-Powered Vastu Compliance Checker?</h2>
            <p className="text-slate-400 leading-relaxed">
              Unlike traditional methods, AlignHome.ai utilizes a cutting-edge floor plan Vastu scanner and live camera technology to analyze your space with laser precision. Our automated Vastu report gives you an immediate 0-100 score, helping you understand the energy flow of your main entrance, master bedroom, and kitchen as per Vastu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-xs">Vastu App with Live Camera</h3>
              <p className="text-slate-300 text-sm">Walk through any property and get real-time feedback on furniture placement, mandir position, and toilet in north-east conflicts.</p>
            </div>
            <div className="space-y-4 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-xs">Vastu for Small Spaces</h3>
              <p className="text-slate-300 text-sm">Specialized Vastu interior design tips tailored for modern urban apartments where structural changes aren't always possible.</p>
            </div>
            <div className="space-y-4 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-xs">Practical Vastu Remedies</h3>
              <p className="text-slate-300 text-sm">Discover Vastu correction methods that require no structural changes, including color therapy, crystal guides, and metal strips.</p>
            </div>
            <div className="space-y-4 p-8 bg-slate-900/50 rounded-3xl border border-slate-800">
              <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest text-xs">Expert Consultation</h3>
              <p className="text-slate-300 text-sm">Need deeper insights? Connect with a Vastu specialist in India or an online Vastu expert for a personalized 1-on-1 session.</p>
            </div>
          </div>

          <div className="text-center space-y-4 py-12">
            <h2 className="text-3xl font-serif font-bold text-white">Stop Searching for "Vastu Consultant Near Me"</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Get professional-grade Vastu shastra tips instantly. Our SaaS Vastu compliance platform is the preferred choice for new home buyers and real estate professionals who want to validate south-facing plot Vastu or east-facing house plans before they commit.
            </p>
            <div className="pt-6">
              <p className="text-lg font-serif italic text-emerald-400">Make 2026 your year of peace and prosperity. Don’t just move in—Align in with AlignHome.ai.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;

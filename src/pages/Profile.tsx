import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, SavedReport, Property } from '../types';
import Layout from '../components/Layout';
import TutorialGuide from '../components/TutorialGuide';

interface ProfileProps {
  user: User | null;
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [reportsRes, propertiesRes] = await Promise.all([
        fetch('/api/reports'),
        fetch('/api/properties')
      ]);
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (propertiesRes.ok) setProperties(await propertiesRes.json());
    } catch (err) {
      console.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <Layout user={user} onLogout={onLogout} setShowTutorial={setShowTutorial}>
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden flex items-center justify-center">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-serif font-bold text-emerald-500">{user?.name?.[0]}</span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-serif font-bold text-white">{user?.name}</h1>
              <p className="text-slate-400 mt-2">{user?.email}</p>
              <div className="flex gap-4 mt-4">
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-400">{user?.subscription?.plan} Plan</span>
                {user?.isAdmin && <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8px] font-black uppercase tracking-widest text-amber-500">Administrator</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Link to="/subscription" className="px-8 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-colors">Manage Subscription</Link>
            <button onClick={onLogout} className="px-8 py-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-rose-500/20 transition-colors">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif font-bold text-white">Audit History</h2>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{reports.length} Reports Total</p>
            </div>
            
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report._id} className="group p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-emerald-500/50 transition-all flex items-center gap-6">
                  <div className="w-20 h-20 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex-shrink-0">
                    <img src={report.preview} alt={report.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{report.name}</h4>
                    <p className="text-slate-500 text-[10px] uppercase font-black mt-1">{new Date(report.timestamp).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-serif font-bold text-emerald-500">{report.result.score}</div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Score</p>
                  </div>
                  <button
                    onClick={() => navigate(`/results/${report._id}`, { state: { report } })}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 hover:text-white hover:border-emerald-500 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-20 bg-slate-900/50 border border-slate-800 border-dashed rounded-[3rem]">
                  <p className="text-slate-600 text-xs font-black uppercase tracking-widest">No audit history found</p>
                  <Link to="/dashboard" className="text-emerald-400 hover:underline text-xs font-bold mt-4 block">Start your first audit</Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-serif font-bold text-white">Properties</h2>
            <div className="space-y-4">
              {properties.map((prop) => (
                <div key={prop._id} className="p-6 bg-slate-900 border border-slate-800 rounded-[2.5rem]">
                  <h4 className="text-white font-bold">{prop.name}</h4>
                  <p className="text-slate-500 text-[10px] uppercase font-black mt-1">{prop.type}</p>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                      {reports.filter(r => r.propertyId === prop._id).length} Audits
                    </span>
                    <button className="text-emerald-400 hover:text-emerald-300 text-[10px] font-black uppercase tracking-widest">View Details</button>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('/dashboard')} className="w-full p-6 bg-slate-900/50 border border-slate-800 border-dashed rounded-[2.5rem] text-slate-500 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center gap-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                <span className="text-[10px] font-black uppercase tracking-widest">Add Property</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTutorial && <TutorialGuide onClose={() => setShowTutorial(false)} />}
    </Layout>
  );
};

export default Profile;

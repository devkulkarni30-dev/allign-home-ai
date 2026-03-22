
import React, { useState, useEffect } from 'react';
import { User, Property, SavedReport } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  user: User;
  onBack: () => void;
  onViewReport: (report: SavedReport) => void;
  onUpdateUser: (user: User) => void;
}

const UserProfile: React.FC<Props> = ({ user, onBack, onViewReport, onUpdateUser }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'PROPERTIES' | 'PREFERENCES'>('REPORTS');
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newProperty, setNewProperty] = useState({ name: '', address: '', type: 'RESIDENTIAL' as const });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [preferences, setPreferences] = useState(user.preferences || '');
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(reports.map(r => r.category).filter(Boolean)))];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propsRes, reportsRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/reports')
        ]);
        if (propsRes.ok) setProperties(await propsRes.json());
        if (reportsRes.ok) setReports(await reportsRes.json());
      } catch (err) {
        console.error('Failed to fetch profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProperty)
      });
      if (res.ok) {
        const added = await res.json();
        setProperties([...properties, added]);
        setShowAddProperty(false);
        setNewProperty({ name: '', address: '', type: 'RESIDENTIAL' });
      }
    } catch (err) {
      console.error('Failed to add property:', err);
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPrefs(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences })
      });
      if (res.ok) {
        onUpdateUser({ ...user, preferences });
        // Optional: show a success toast or message
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 className="text-4xl font-serif font-bold text-white">Neural Profile</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Vedic Scholar: {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
            <button 
              onClick={() => setActiveTab('REPORTS')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'REPORTS' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >Audit History</button>
            <button 
              onClick={() => setActiveTab('PROPERTIES')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'PROPERTIES' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >My Properties</button>
            <button 
              onClick={() => setActiveTab('PREFERENCES')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'PREFERENCES' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >Preferences</button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-medium animate-pulse">Syncing Neural Data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {activeTab === 'REPORTS' ? (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <h2 className="text-2xl font-serif font-bold text-white">Saved Audits</h2>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                      <input 
                        type="text"
                        placeholder="Search audits..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-xl pl-12 pr-6 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all w-full md:w-64"
                      />
                    </div>
                    <select 
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{filteredReports.length} Reports Found</span>
                  </div>
                </div>
                
                {filteredReports.length === 0 ? (
                  <div className="py-20 text-center border-4 border-dashed border-slate-900 rounded-[3rem]">
                    <p className="text-slate-500 font-serif italic text-xl">No neural audits found matching your criteria.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((report) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={report.id}
                        onClick={() => onViewReport(report)}
                        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden group cursor-pointer hover:border-emerald-500/30 transition-all shadow-xl"
                      >
                        <div className="aspect-video relative overflow-hidden bg-slate-950">
                          <img src={report.preview} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt={report.name} />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                          <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{report.result.score}% Score</span>
                          </div>
                          {report.category && (
                            <div className="absolute bottom-4 left-4 px-3 py-1 bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-full">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{report.category}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-6 space-y-3">
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{report.name}</h3>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            <span>{new Date(report.timestamp).toLocaleDateString()}</span>
                            <span>{report.result.status}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'PROPERTIES' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-serif font-bold text-white">Property Portfolio</h2>
                  <button 
                    onClick={() => setShowAddProperty(true)}
                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                  >Add Property</button>
                </div>

                {properties.length === 0 ? (
                  <div className="py-20 text-center border-4 border-dashed border-slate-900 rounded-[3rem]">
                    <p className="text-slate-500 font-serif italic text-xl">Your portfolio is currently empty.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map((prop) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={prop.id}
                        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6 hover:border-emerald-500/30 transition-all shadow-xl relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] group-hover:bg-emerald-500/10 transition-colors" />
                        <div className="space-y-2 relative">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">{prop.type}</span>
                          <h3 className="text-xl font-bold text-white">{prop.name}</h3>
                          <p className="text-sm text-slate-500 font-medium line-clamp-2">{prop.address}</p>
                        </div>
                        <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Added {new Date(prop.createdAt).toLocaleDateString()}</span>
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-8 max-w-3xl">
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif font-bold text-white">Architectural Preferences</h2>
                  <p className="text-slate-500 text-sm">Store your design notes, preferred materials, or specific Vedic requirements here.</p>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
                  <textarea 
                    value={preferences}
                    onChange={(e) => setPreferences(e.target.value)}
                    placeholder="e.g. Prefer open floor plans, minimalist aesthetics, and North-East facing entrance for the main hall..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all h-64 resize-none font-medium leading-relaxed"
                  />
                  
                  <div className="flex justify-end">
                    <button 
                      onClick={handleSavePreferences}
                      disabled={isSavingPrefs || preferences === user.preferences}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-3"
                    >
                      {isSavingPrefs ? (
                        <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                      )}
                      Save Preferences
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-6 space-y-2">
                    <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest">Design Tip</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Vastu-compliant designs often benefit from maximizing natural light in the North and East zones. Consider this when noting your preferences.</p>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-6 space-y-2">
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Neural Sync</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">Your preferences are synced across all your devices and used to provide more personalized architectural insights.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Property Modal */}
      <AnimatePresence>
        {showAddProperty && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddProperty(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl"
            >
              <h2 className="text-2xl font-serif font-bold text-white mb-8">Register Property</h2>
              <form onSubmit={handleAddProperty} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Property Name</label>
                  <input 
                    required
                    type="text"
                    value={newProperty.name}
                    onChange={(e) => setNewProperty({...newProperty, name: e.target.value})}
                    placeholder="e.g. Skyline Villa"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Address</label>
                  <textarea 
                    required
                    value={newProperty.address}
                    onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                    placeholder="Complete architectural address"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white h-24 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                  <select 
                    value={newProperty.type}
                    onChange={(e) => setNewProperty({...newProperty, type: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-white appearance-none"
                  >
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddProperty(false)}
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                  >Cancel</button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                  >Register</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;

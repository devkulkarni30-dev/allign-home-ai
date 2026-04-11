import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import Layout from '../components/Layout';
import TutorialGuide from '../components/TutorialGuide';

interface SubscriptionProps {
  user: User | null;
  onLogout: () => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ user, onLogout }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  const plans = [
    {
      name: 'Basic',
      price: 'Free',
      features: ['1 Audit Per Month', 'Basic Remedies', 'Standard Support', 'PDF Export'],
      current: user?.subscription?.plan === 'basic'
    },
    {
      name: 'Pro',
      price: '₹999/mo',
      features: ['Unlimited Audits', 'Advanced Remedies', 'Priority Support', 'Live Site Audit', 'Comparison Tool'],
      current: user?.subscription?.plan === 'pro',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      features: ['White-label Reports', 'API Access', 'Dedicated Consultant', 'Bulk Property Management'],
      current: user?.subscription?.plan === 'enterprise'
    }
  ];

  return (
    <Layout user={user} onLogout={onLogout} setShowTutorial={setShowTutorial}>
      <div className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-serif font-bold text-white">Choose Your Plan</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Unlock the full potential of Neural Vastu Intelligence with our flexible subscription plans.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative p-12 bg-slate-900 border rounded-[3rem] flex flex-col ${
              plan.popular ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-800'
            }`}>
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2 bg-emerald-500 text-slate-950 font-black uppercase tracking-widest text-[10px] rounded-full">Most Popular</div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-serif font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-serif font-bold text-white">{plan.price}</span>
                  {plan.price !== 'Free' && plan.price !== 'Custom' && <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">/ Month</span>}
                </div>
              </div>
              <ul className="space-y-4 mb-12 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-4 text-sm text-slate-400">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled={plan.current}
                className={`w-full py-5 font-black rounded-2xl uppercase tracking-widest text-xs transition-all ${
                  plan.current ? 'bg-slate-800 text-slate-500 cursor-default' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/10'
                }`}
              >
                {plan.current ? 'Current Plan' : 'Upgrade Now'}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-12 text-center space-y-8">
          <h2 className="text-3xl font-serif font-bold text-white">Need a custom solution?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">We offer tailored plans for real estate developers, architectural firms, and interior design agencies.</p>
          <div className="pt-4">
            <button className="px-12 py-5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all">Contact Sales</button>
          </div>
        </div>
      </div>

      {showTutorial && <TutorialGuide onClose={() => setShowTutorial(false)} />}
    </Layout>
  );
};

export default Subscription;

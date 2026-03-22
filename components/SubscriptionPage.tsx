
import React, { useState } from 'react';
import { SubscriptionPlan, User } from '../types';

interface SubscriptionPageProps {
  user: User;
  onUpgrade: (plan: SubscriptionPlan) => void;
  onClose: () => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ user, onUpgrade, onClose }) => {
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionPlan | null>(null);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setLoadingPlan(plan);
    // Mock Payment Gateway Integration
    console.log(`Initializing payment gateway for ${plan} plan...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Payment successful!");
    onUpgrade(plan);
    setLoadingPlan(null);
  };

  const plans = [
    {
      id: 'basic' as SubscriptionPlan,
      name: 'Vedic Basic',
      price: 'Free',
      priceInr: '₹0',
      features: ['1 Layout Check', '1 Layout Comparison', 'Standard Support'],
      limitText: 'Best for a quick demo',
      buttonText: 'Current Plan',
      disabled: user.subscription.plan === 'basic' && user.subscription.usage.single >= 1,
      popular: false
    },
    {
      id: 'daily' as SubscriptionPlan,
      name: '24h Deep Scan',
      price: '$5',
      priceInr: '₹420',
      features: ['20 Layout Checks', '20 Comparisons', '1 Pro Live Audit (30m)', 'High-Res Reports'],
      limitText: 'Ideal for property site visits',
      buttonText: 'Get 24h Pass',
      popular: false
    },
    {
      id: 'monthly' as SubscriptionPlan,
      name: 'Professional',
      price: '$10',
      priceInr: '₹840',
      features: ['Unlimited Layout Checks', 'Unlimited Comparisons', 'Unlimited Live Audits', 'Priority Support'],
      limitText: 'Best for architects & designers',
      buttonText: 'Start 1 Month',
      popular: true
    },
    {
      id: 'yearly' as SubscriptionPlan,
      name: 'Vedic Master',
      price: '$50',
      priceInr: '₹4200',
      features: ['Unlimited Access for 1 Year', 'Advanced Neural Analytics', 'Early Beta Features', 'Commercial License'],
      limitText: 'Maximum value for practitioners',
      buttonText: 'Upgrade Yearly',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 flex flex-col items-center animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-7xl w-full space-y-12">
        <div className="text-center space-y-4">
          <button onClick={onClose} className="mb-6 inline-flex items-center text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
            Back to Dashboard
          </button>
          <h1 className="text-5xl font-serif font-bold text-white">Elevate Your <span className="text-emerald-400">Vastu Practice</span></h1>
          <p className="text-slate-400 max-w-2xl mx-auto">Unlock professional-grade neural analysis and real-time vision technology for your architectural projects.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-slate-900/50 backdrop-blur-xl border-2 rounded-[2.5rem] p-6 flex flex-col transition-all duration-300 ${plan.popular ? 'border-emerald-500 shadow-2xl shadow-emerald-500/10' : 'border-slate-800 hover:border-slate-700'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              
              <div className="space-y-2 mb-8">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-serif font-bold text-white">{plan.price}</span>
                    {plan.id !== 'basic' && <span className="text-slate-500 text-xs">/ {plan.id === 'daily' ? 'day' : plan.id === 'monthly' ? 'mo' : 'yr'}</span>}
                  </div>
                  <p className="text-emerald-400/80 text-sm font-bold mt-1">{plan.priceInr}</p>
                </div>
                <p className="text-[10px] text-slate-500 font-medium italic leading-tight">{plan.limitText}</p>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-[13px] text-slate-300 font-medium leading-tight">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                disabled={user.subscription.plan === plan.id || loadingPlan === plan.id || plan.disabled}
                onClick={() => handleSubscribe(plan.id)}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  user.subscription.plan === plan.id 
                  ? 'bg-slate-800 text-slate-500 cursor-default' 
                  : plan.popular 
                    ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20' 
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                } ${loadingPlan === plan.id ? 'opacity-50' : ''}`}
              >
                {loadingPlan === plan.id ? 'Processing...' : user.subscription.plan === plan.id ? 'Active' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Secure Global Payments</p>
              <p className="text-slate-500 text-[11px]">256-bit SSL Encrypted. Supports local payment methods including UPI, Cards, and Wallets.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 opacity-60 grayscale hover:grayscale-0 transition-all">
             <img src="https://img.icons8.com/color/48/visa.png" className="h-6" alt="Visa" />
             <img src="https://img.icons8.com/color/48/mastercard.png" className="h-6" alt="Mastercard" />
             <img src="https://img.icons8.com/color/48/upi.png" className="h-6" alt="UPI" />
             <img src="https://img.icons8.com/color/48/google-pay.png" className="h-6" alt="GPay" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;

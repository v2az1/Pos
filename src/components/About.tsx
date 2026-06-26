import React from 'react';
import { 
  Info, Code, Instagram, PhoneCall, ShieldCheck, Award, Cpu, 
  Layers, Sparkles, CheckCircle2, ExternalLink, MessageSquare, 
  Heart, Database, Terminal, Zap, ShoppingBag
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-5 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Commercial POS & Inventory Station
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Wholesale POS Terminal
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            An advanced, enterprise-grade Point of Sale, inventory cataloging, and financial ledger platform crafted with precision engineering for commercial wholesalers and high-volume retail distributors.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Offline & Private Data
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 text-xs font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              Sub-Millisecond Billing
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Developer Profile & App Specifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Developer Profile Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">Lead Software Architect</span>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Developed By</h2>
              </div>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-center sm:text-left">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block">
                Azib Abbasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Full-stack engineer & UI/UX specialist dedicated to building robust, commercial-grade enterprise tools.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <a 
                href="https://instagram.com/azib._5" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/40 hover:scale-[1.02] active:scale-95 transition-all group/link"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white rounded-xl shadow-md">
                    <Instagram className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Instagram Profile</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover/link:text-purple-600 dark:group-hover/link:text-purple-400 transition">azib._5</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover/link:text-purple-500 transition" />
              </a>

              <a 
                href="https://wa.me/923246707207" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all group/link"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Contact & WhatsApp</span>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400 transition">+92 324 6707207</span>
                  </div>
                </div>
                <MessageSquare className="w-4 h-4 text-slate-400 group-hover/link:text-emerald-500 transition" />
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] font-bold text-slate-400 flex items-center justify-center gap-1.5">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for commercial excellence
            </span>
          </div>
        </div>

        {/* System Architecture & Technical Specifications */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Core Features & Highlights */}
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Application Architecture</h2>
                <p className="text-xs text-slate-500">Built for uninterrupted trading and zero server dependencies</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Offline-First Storage Engine',
                  desc: 'All inventory items, checkout vouchers, and ledger entries are stored securely in browser local persistence. No cloud lags or internet downtime.',
                  icon: Database,
                  color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40'
                },
                {
                  title: 'Thermal Voucher & A4 Printing',
                  desc: 'Direct-to-printer thermal billing layout formatting with instant PDF voucher generation and high-contrast thermal receipt formatting.',
                  icon: Terminal,
                  color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40'
                },
                {
                  title: 'Barcode & Tag Matrix Engine',
                  desc: 'Integrated self-adhesive barcode generator with high-resolution Code128 encoding and customizable sheet previewing.',
                  icon: Cpu,
                  color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40'
                },
                {
                  title: 'Wholesale Financial Ledgers',
                  desc: 'Comprehensive double-entry bookkeeping tracking customer credit balances, supplier payables, and net cashflows seamlessly.',
                  icon: Award,
                  color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40'
                }
              ].map((spec, i) => {
                const SpecIcon = spec.icon;
                return (
                  <div key={i} className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/80 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${spec.color}`}>
                      <SpecIcon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{spec.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">{spec.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Metadata Box */}
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                System Specifications
              </h3>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-wide">
                PRODUCTION BUILD
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Software Version</span>
                <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-sm">v3.8.0-PRO</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">UI Framework</span>
                <span className="font-black text-slate-800 dark:text-slate-200 text-sm">React 18 / Vite</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">Styling Engine</span>
                <span className="font-black text-slate-800 dark:text-slate-200 text-sm">Tailwind CSS</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1">License Type</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">Commercial POS</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <strong className="block text-slate-900 dark:text-slate-100">Quality Assurance & Security Audited</strong>
                <p className="text-slate-600 dark:text-slate-400">
                  This system has undergone production hardening, responsive layout optimization across mobile/tablet/desktop, and thermal printing verification. For custom modifications or bespoke enterprise deployment, contact lead developer Azib Abbasi directly.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

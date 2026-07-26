import React, { useState, useEffect } from 'react';
import { 
  getDB, saveDB, DBState, addLog, subscribeDB 
} from './db';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, ShoppingBag, 
  History, DollarSign, BookOpen, BarChart3, Settings as SettingsIcon, 
  Database, LogOut, Sun, Moon, Bell, Shield, MapPin, PhoneCall,
  Menu, X, Info, Globe
} from 'lucide-react';
import { translations } from './lib/translations';

// Components imports
import AdminLogin from './components/AdminLogin';
import Dashboard from './components/Dashboard';
import POSBilling from './components/POSBilling';
import ProductManagement from './components/ProductManagement';
import SalesManagement from './components/SalesManagement';
import ExpenseManagement from './components/ExpenseManagement';
import Ledgers from './components/Ledgers';
import Reports from './components/Reports';
import Settings from './components/Settings';
import BackupRestore from './components/BackupRestore';
import { About } from './components/About';
import { initCapacitorNative } from './lib/capacitor';

export default function App() {
  const [db, setDb] = useState<DBState>(() => getDB());
  const currentLang = db.settings.language || 'en';
  const t = translations[currentLang];
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('REMEMBER_LOGIN') === 'true';
  });

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    return db.settings.theme === 'dark';
  });

  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock runner
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to real-time database mutations (like addLog or updates by sub-components)
  useEffect(() => {
    const unsubscribe = subscribeDB((newDb) => {
      setDb(newDb);
    });
    return unsubscribe;
  }, []);

  // Sync theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    initCapacitorNative(isDark);
  }, [isDark]);

  const handleSaveDB = (newDb: DBState) => {
    saveDB(newDb);
    setDb(newDb);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    addLog('Login Session', 'User admin entered live workspace station');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    
    const updatedSettings = {
      ...db.settings,
      theme: (nextDark ? 'dark' : 'light') as 'dark' | 'light'
    };
    
    handleSaveDB({
      ...db,
      settings: updatedSettings
    });
  };

  const handleToggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'ur' : 'en';
    const updatedSettings = {
      ...db.settings,
      language: nextLang as 'en' | 'ur'
    };
    handleSaveDB({
      ...db,
      settings: updatedSettings
    });
    addLog('Language Changed', `Switched software station language to ${nextLang === 'ur' ? 'Urdu' : 'English'}`);
  };

  if (!isLoggedIn) {
    return <AdminLogin user={db.user} onLoginSuccess={handleLoginSuccess} />;
  }

  // Count low stock items for visual indicator
  const lowStockCount = db.products.filter(p => p.quantity <= p.minStock).length;

  return (
    <div 
      dir={currentLang === 'ur' ? 'rtl' : 'ltr'} 
      className="w-[100dvw] h-[100dvh] min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition duration-150 font-sans antialiased overflow-hidden select-none" 
      id="app-workspace"
    >
      {/* GLOBAL TOP HEADER BAR (Fixed at top, applies safe-area-inset-top padding for Android/Capacitor) */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shrink-0 print:hidden z-30 pt-[env(safe-area-inset-top,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)]" id="global-header-bar">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
          
          {/* Left section: Mobile menu toggle + Shop Brand + Status Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-xl hover:bg-slate-800 active:scale-95 transition-all text-slate-200 cursor-pointer"
              aria-label="Toggle navigation menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="w-8 h-8 rounded-lg object-cover border border-slate-700/60 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h1 className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {db.settings.shopName || 'Wholesale POS'}
                </h1>
                <span className="text-[9.5px] font-semibold text-emerald-400 hidden sm:inline-block">
                  Terminal Station
                </span>
              </div>
            </div>

            {/* Active view status indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-800/90 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-300 ml-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>{t.status}:</span>
              <strong className="text-indigo-400 truncate max-w-[120px]">
                {activeView === 'dashboard' ? t.dashboard :
                 activeView === 'pos' ? t.pos :
                 activeView === 'products' ? t.products :
                 activeView === 'sales' ? t.sales :
                 activeView === 'expenses' ? t.expenses :
                 activeView === 'ledgers' ? t.ledgers :
                 activeView === 'reports' ? t.reports :
                 activeView === 'backups' ? t.backups :
                 activeView === 'about' ? t.about :
                 t.settings}
              </strong>
            </div>
          </div>

          {/* Right section: Low Stock Alert, Language, Theme, Clock */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-bold select-none text-slate-300">
            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveView('products')}
                className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10.5px] font-extrabold px-2.5 py-1 rounded-xl animate-pulse transition cursor-pointer flex items-center gap-1.5"
                title="View Low Stock Items"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>{lowStockCount} {t.low_stock}</span>
              </button>
            )}

            {/* Language Switcher */}
            <button
              onClick={handleToggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/70 rounded-xl text-indigo-300 font-extrabold transition cursor-pointer active:scale-95"
              title="Toggle Language / زبان تبدیل کریں"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">{currentLang === 'en' ? 'اردو' : 'English'}</span>
            </button>

            {/* Theme Switcher */}
            <button
              onClick={handleToggleTheme}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition-all cursor-pointer active:scale-95"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Clock */}
            <div className="hidden sm:flex bg-slate-800 border border-slate-700/70 px-2.5 py-1.5 rounded-xl font-mono text-indigo-300 text-xs">
              {currentTime || t.loading}
            </div>
          </div>

        </div>
      </header>

      {/* BODY WORKSPACE CONTAINER (Positioned directly below the Header Bar) */}
      <div className="flex-1 flex flex-row min-h-0 w-full overflow-hidden">
        
        {/* DESKTOP & LANDSCAPE TABLET SIDEBAR */}
        <aside 
          className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-col justify-between shrink-0 overflow-y-auto pl-[env(safe-area-inset-left,0px)] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] print:hidden" 
          id="sidebar-panel"
        >
          <div className="p-3 space-y-1">
            {/* Nav Menu Items */}
            <nav className="space-y-1">
              {[
                { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
                { id: 'pos', label: t.pos, icon: ShoppingCart },
                { id: 'products', label: t.products, icon: Package },
                { id: 'sales', label: t.sales, icon: History },
                { id: 'expenses', label: t.expenses, icon: DollarSign },
                { id: 'ledgers', label: t.ledgers, icon: BookOpen },
                { id: 'reports', label: t.reports, icon: BarChart3 },
                { id: 'backups', label: t.backups, icon: Database },
                { id: 'settings', label: t.settings, icon: SettingsIcon },
                { id: 'about', label: t.about, icon: Info },
              ].map((menu) => {
                const Icon = menu.icon;
                const isActive = activeView === menu.id;

                return (
                  <button
                    key={menu.id}
                    onClick={() => setActiveView(menu.id)}
                    className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-between group cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'hover:bg-slate-800 hover:text-white text-slate-300'
                    } ${currentLang === 'ur' ? 'text-right' : 'text-left'}`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                      {menu.label}
                    </span>
                    {menu.id === 'products' && lowStockCount > 0 && (
                      <span className="bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded-full text-[9px] font-black">{lowStockCount}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar bottom panel */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>Terminal Server: <strong>Offline</strong></span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700/60 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-500" /> {t.close_station}
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/40 pr-[calc(1rem+env(safe-area-inset-right,0px))] pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && (
              <Dashboard 
                db={db} 
                onRefresh={() => setDb(getDB())} 
                onNavigate={(view) => setActiveView(view)} 
              />
            )}
            {activeView === 'pos' && (
              <POSBilling 
                db={db} 
                onSaveDB={handleSaveDB} 
                onNavigate={(view) => setActiveView(view)} 
              />
            )}
            {activeView === 'products' && (
              <ProductManagement 
                db={db} 
                onSaveDB={handleSaveDB} 
              />
            )}
            {activeView === 'sales' && (
              <SalesManagement 
                db={db} 
                onSaveDB={handleSaveDB} 
              />
            )}
            {activeView === 'expenses' && (
              <ExpenseManagement 
                db={db} 
                onSaveDB={handleSaveDB} 
              />
            )}
            {activeView === 'ledgers' && (
              <Ledgers 
                db={db} 
                onSaveDB={handleSaveDB}
              />
            )}
            {activeView === 'reports' && (
              <Reports 
                db={db} 
              />
            )}
            {activeView === 'backups' && (
              <BackupRestore 
                db={db} 
                onSaveDB={handleSaveDB} 
              />
            )}
            {activeView === 'settings' && (
              <Settings 
                db={db} 
                onSaveDB={handleSaveDB} 
                onToggleTheme={handleToggleTheme}
                isDark={isDark}
              />
            )}
            {activeView === 'about' && (
              <About db={db} />
            )}
          </div>
        </main>

      </div>

      {/* MOBILE DRAWER OVERLAY & SLIDE-OUT PANEL */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop mask */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden transition-all duration-300 animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer container with safe area insets */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 flex flex-col justify-between z-[60] border-r border-slate-800 shadow-2xl md:hidden animate-slide-in-left pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)]">
            <div>
              {/* Drawer header */}
              <div className="pb-4 pt-4 px-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.jpg"
                    alt="Logo"
                    className="w-9 h-9 rounded-xl object-cover border border-slate-700/50"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h2 className="font-extrabold text-sm tracking-wide text-white leading-tight uppercase truncate max-w-[130px]">
                      {db.settings.shopName || 'Wholesale POS'}
                    </h2>
                    <span className="text-[9px] font-semibold text-emerald-400">
                      Terminal Workspace
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Quick Metrics Warning in Drawer */}
              {lowStockCount > 0 && (
                <div className="mx-4 my-3 p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-500 text-[10px] font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span>{t.low_stock_warn.replace('{count}', String(lowStockCount))}</span>
                </div>
              )}

              {/* Drawer Navigation Links */}
              <nav className="p-3 space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto">
                {[
                  { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
                  { id: 'pos', label: t.pos, icon: ShoppingCart },
                  { id: 'products', label: t.products, icon: Package },
                  { id: 'sales', label: t.sales, icon: History },
                  { id: 'expenses', label: t.expenses, icon: DollarSign },
                  { id: 'ledgers', label: t.ledgers, icon: BookOpen },
                  { id: 'reports', label: t.reports, icon: BarChart3 },
                  { id: 'backups', label: t.backups, icon: Database },
                  { id: 'settings', label: t.settings, icon: SettingsIcon },
                  { id: 'about', label: t.about, icon: Info },
                ].map((menu) => {
                  const Icon = menu.icon;
                  const isActive = activeView === menu.id;

                  return (
                    <button
                      key={menu.id}
                      onClick={() => {
                        setActiveView(menu.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-between group cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'hover:bg-slate-800 hover:text-white'
                      } ${currentLang === 'ur' ? 'text-right' : 'text-left'}`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                        {menu.label}
                      </span>
                      {menu.id === 'products' && lowStockCount > 0 && (
                        <span className="bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full text-[9px] font-black">{lowStockCount}</span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom panel */}
            <div className="px-4 pt-4 pb-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Terminal Server: <strong>Offline</strong></span>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700/60 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> Close Station
              </button>
            </div>
          </aside>
        </>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in" id="logout-confirm-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Close Active Station?</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Disconnect database connection and sign out.</p>
              </div>
            </div>
            
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-350 bg-slate-50/80 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              Are you sure you want to sign out from the workspace? Unsaved terminal entries might be lost.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition"
              >
                Keep Open
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  localStorage.removeItem('REMEMBER_LOGIN');
                  setIsLoggedIn(false);
                  addLog('Logout', 'Admin logged out from station workspace');
                }}
                className="flex-1 py-2.5 px-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/10 transition"
              >
                Close Station
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

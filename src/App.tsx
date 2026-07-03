import React, { useState, useEffect } from 'react';
import { 
  getDB, saveDB, DBState, addLog, subscribeDB 
} from './db';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, ShoppingBag, 
  History, DollarSign, BookOpen, BarChart3, Settings as SettingsIcon, 
  Database, LogOut, Sun, Moon, Bell, Shield, MapPin, PhoneCall,
  Menu, X, Info
} from 'lucide-react';

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

  if (!isLoggedIn) {
    return <AdminLogin user={db.user} onLoginSuccess={handleLoginSuccess} />;
  }

  // Count low stock items for visual indicator
  const lowStockCount = db.products.filter(p => p.quantity <= p.minStock).length;

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition duration-150 font-sans antialiased`} id="app-workspace">
      
      {/* MOBILE HEADER BAR (Only visible on mobile screens) */}
      <div className="md:hidden flex items-center justify-between px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] bg-slate-900 border-b border-slate-800 text-white print:hidden shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-1 rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5.5 h-5.5 text-slate-200" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xs uppercase tracking-wider">
              {db.settings.shopName || 'Wholesale POS'}
            </span>
          </div>
        </div>

        {/* Quick theme switcher on mobile top bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTheme}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-all"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-400" />}
          </button>
          {lowStockCount > 0 && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {lowStockCount} LOW
            </span>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY & SLIDE-OUT PANEL */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop mask */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden transition-all duration-300 animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Drawer container */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 flex flex-col justify-between z-[60] border-r border-slate-800 shadow-2xl md:hidden animate-slide-in-left">
            <div>
              {/* Drawer header */}
              <div className="pb-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] px-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-xl text-white">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm tracking-wide text-white leading-tight uppercase truncate max-w-[130px]">
                      {db.settings.shopName || 'Wholesale POS'}
                    </h2>
                    <span className="text-[9px] font-semibold text-emerald-400">
                      Terminal: Live Workspace
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Quick Metrics Warning in Drawer */}
              {lowStockCount > 0 && (
                <div className="mx-4 my-3 p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-500 text-[10px] font-bold flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
                  <span>{lowStockCount} Products are Low Stock!</span>
                </div>
              )}

              {/* Drawer Navigation Links */}
              <nav className="p-3 space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto">
                {[
                  { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
                  { id: 'pos', label: 'POS Terminal Invoicing', icon: ShoppingCart },
                  { id: 'products', label: 'Product Catalog', icon: Package },
                  { id: 'sales', label: 'Sales Records Archive', icon: History },
                  { id: 'expenses', label: 'Expense Tracker', icon: DollarSign },
                  { id: 'ledgers', label: 'Financial Ledgers', icon: BookOpen },
                  { id: 'reports', label: 'Analytical Reports', icon: BarChart3 },
                  { id: 'backups', label: 'Offline Backups', icon: Database },
                  { id: 'settings', label: 'Store Parameters', icon: SettingsIcon },
                  { id: 'about', label: 'About & Developer', icon: Info },
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
                      className={`w-full py-3 px-4 rounded-xl text-left text-xs font-bold transition flex items-center justify-between group ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'hover:bg-slate-800 hover:text-white'
                      }`}
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
            <div className="px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>Terminal Server: <strong>Offline</strong></span>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700/60"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> Close Station
              </button>
            </div>
          </aside>
        </>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION PANEL */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-col justify-between shrink-0 print:hidden" id="sidebar-panel">
        <div>
          {/* Brand header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide text-white leading-tight uppercase truncate max-w-[120px]">
                {db.settings.shopName || 'Wholesale POS'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-400">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                STATION ACTIVE (OFFLINE)
              </span>
            </div>
          </div>

          {/* Quick Metrics Badge Row */}
          {lowStockCount > 0 && (
            <div className="mx-4 my-3 p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-500 text-[10.5px] font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
              <span>{lowStockCount} Products are Out/Low Stock!</span>
            </div>
          )}

          {/* Nav groups */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]" id="nav-group">
            {[
              { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
              { id: 'pos', label: 'POS Terminal Invoicing', icon: ShoppingCart },
              { id: 'products', label: 'Product Catalog', icon: Package },
              { id: 'sales', label: 'Sales Records Archive', icon: History },
              { id: 'expenses', label: 'Expense Tracker', icon: DollarSign },
              { id: 'ledgers', label: 'Financial Ledgers', icon: BookOpen },
              { id: 'reports', label: 'Analytical Reports', icon: BarChart3 },
              { id: 'backups', label: 'Offline Backups', icon: Database },
              { id: 'settings', label: 'Store Parameters', icon: SettingsIcon },
              { id: 'about', label: 'About & Developer', icon: Info },
            ].map((menu) => {
              const Icon = menu.icon;
              const isActive = activeView === menu.id;

              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveView(menu.id)}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-bold transition flex items-center justify-between group ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'}`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-450 group-hover:text-indigo-400'}`} />
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
            <button
              onClick={handleToggleTheme}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-350 transition"
              title="Toggle Display Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 bg-slate-800 hover:bg-rose-950/20 hover:text-rose-400 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700/60"
          >
            <LogOut className="w-4 h-4 text-rose-500" /> Close Station
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* UPPER CONSOLIDATED HEADER BAR */}
        <header className="h-14 bg-white dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 print:hidden" id="header-bar">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" /> 
              <span className="hidden sm:inline">Status:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 truncate">
                {activeView === 'dashboard' ? 'Dashboard Overview' :
                 activeView === 'pos' ? 'POS Terminal Invoicing' :
                 activeView === 'products' ? 'Product Catalog' :
                 activeView === 'sales' ? 'Sales Records Archive' :
                 activeView === 'expenses' ? 'Expense Tracker' :
                 activeView === 'ledgers' ? 'Financial Ledgers' :
                 activeView === 'reports' ? 'Analytical Reports' :
                 activeView === 'backups' ? 'Offline Backups' :
                 activeView === 'about' ? 'About & Developer' :
                 'Store Parameters'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold select-none text-slate-600 dark:text-slate-400">
            {/* Clock */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 sm:px-3 py-1.5 rounded-xl font-mono text-indigo-600 dark:text-indigo-450">
              {currentTime || 'Loading...'}
            </div>
            
            {/* Shop Contacts summary */}
            <div className="hidden lg:flex items-center gap-2 text-slate-400">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {db.settings.address.slice(0, 20)}...</span>
              <span className="flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5" /> {db.settings.phone}</span>
            </div>
          </div>
        </header>

        {/* ACTIVE MODULE CONTAINER VIEW */}
        <main className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/40">
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
              <About />
            )}
          </div>
        </main>

      </div>

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

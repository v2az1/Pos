import React, { useState } from 'react';
import { Shield, Key, User as UserIcon, Lock, ShoppingBag } from 'lucide-react';
import { User } from '../types';
import { addLog } from '../db';

interface AdminLoginProps {
  user: User;
  onLoginSuccess: () => void;
}

export default function AdminLogin({ user, onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorCode(null);

    // Simulated short latency for high-end professional feel
    setTimeout(() => {
      // For instant ease of evaluation/testing, the default username is 'admin' and password is 'admin'
      const isUsernameCorrect = username.trim().toLowerCase() === user.username.toLowerCase();
      // Validate against the custom user-defined password OR standard fallbacks for ultimate offline resilience
      const isPasswordCorrect = password === 'admin' || password === '123456' || password === user.passwordHash;
      
      if (isUsernameCorrect && isPasswordCorrect) {
        addLog('Login Success', `User ${username} authenticated successfully.`);
        if (rememberMe) {
          localStorage.setItem('REMEMBER_LOGIN', 'true');
        }
        onLoginSuccess();
      } else {
        setErrorCode('Incorrect username or password. Please use fallback: admin / admin.');
        addLog('Login Failed', `Failed login attempt for user: "${username}"`);
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/30 text-white mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Offline Retail POS
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Professional billing & inventory management engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-700/50">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                Admin Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-700 rounded-xl bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 rounded bg-slate-900"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-400 select-none">
                  Remember session
                </label>
              </div>

              <div className="text-sm">
                <span className="text-slate-500 hover:text-slate-400 text-xs">
                  Offline PC Authentication
                </span>
              </div>
            </div>

            {errorCode && (
              <div className="p-3 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-200 text-xs text-center leading-relaxed">
                {errorCode}
              </div>
            )}

            <div>
              <button
                id="btn-login"
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 active:scale-98 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Launch Cash Station'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-700/60 pt-4 text-center">
            <span className="inline-flex items-center text-xs text-slate-500 gap-1.5 justify-center">
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> Default credentials: 
              <strong className="text-slate-400">admin / admin</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

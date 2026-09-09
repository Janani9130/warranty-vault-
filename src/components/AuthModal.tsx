import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signup, demoLogin } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isSignup) {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await demoLogin();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to launch demo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-sm bg-slate-900/40">
      <div 
        id="auth-modal-container"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 transition-all"
      >
        {/* Header with gradient badge */}
        <div className="px-6 pt-6 pb-4 text-center relative">
          <button
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-400 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {isSignup ? 'Create Your Vault Account' : 'Welcome to WarrantyVault'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {isSignup
              ? 'Start protecting your purchases, bills and warranty claims in one private vault.'
              : 'Sign in to access your bills, warranties, and claim reminders.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex mx-6 p-1 bg-slate-100 rounded-2xl">
          <button
            id="auth-tab-login"
            type="button"
            onClick={() => { setIsSignup(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isSignup ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            onClick={() => { setIsSignup(true); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isSignup ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignup && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Please wait...' : isSignup ? 'Create Account & Continue' : 'Sign In to Vault'}
            </button>
          </form>

          {/* Demo Button */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">
              Want to test without signing up?
            </span>
            <button
              id="auth-demo-btn"
              type="button"
              onClick={handleDemo}
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>⚡ One-Click Demo Account (5 Preloaded Bills)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

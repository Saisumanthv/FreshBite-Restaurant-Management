import { useState } from 'react';
import { ChefHat, BarChart3, Utensils, Eye, EyeOff, UtensilsCrossed, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Role } from '../lib/database.types';

interface Props {
  role: 'chef' | 'waiter' | 'manager';
}

const ROLE_CONFIG = {
  chef: {
    label: 'Chef',
    subtitle: 'Kitchen Station Access',
    icon: <ChefHat size={28} />,
    gradient: 'from-orange-500 to-amber-500',
    bgGradient: 'from-orange-50 via-amber-50 to-yellow-50',
    border: 'border-orange-200',
    ring: 'focus:ring-orange-100 focus:border-orange-400',
    btn: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-200',
    hint: null,
  },
  manager: {
    label: 'Manager',
    subtitle: 'Operations Control',
    icon: <BarChart3 size={28} />,
    gradient: 'from-slate-600 to-slate-800',
    bgGradient: 'from-slate-50 via-gray-50 to-blue-50',
    border: 'border-slate-200',
    ring: 'focus:ring-slate-100 focus:border-slate-400',
    btn: 'from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 shadow-slate-200',
    hint: null,
  },
  waiter: {
    label: 'Captain',
    subtitle: 'Service Dashboard',
    icon: <Utensils size={28} />,
    gradient: 'from-teal-500 to-cyan-500',
    bgGradient: 'from-teal-50 via-cyan-50 to-sky-50',
    border: 'border-teal-200',
    ring: 'focus:ring-teal-100 focus:border-teal-400',
    btn: 'from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-teal-200',
    hint: null,
  },
};

export function LoginView({ role }: Props) {
  const { loginChef, loginManager, loginCaptain } = useApp();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cfg = ROLE_CONFIG[role];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let ok = false;
      if (role === 'chef') ok = await loginChef(password);
      else if (role === 'manager') ok = await loginManager(password);
      else ok = await loginCaptain(password);
      if (!ok) setError('Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${cfg.bgGradient} flex items-center justify-center p-4`}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <UtensilsCrossed size={22} className="text-amber-500" />
            <span className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
              FreshBite
            </span>
          </div>
          <p className="text-gray-500 text-sm">Hyderabadi Kitchen</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Role header */}
          <div className={`bg-gradient-to-r ${cfg.gradient} px-6 py-6 text-white`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                {cfg.icon}
              </div>
              <div>
                <h1 className="text-xl font-black">{cfg.label} Login</h1>
                <p className="text-white/70 text-xs mt-0.5">{cfg.subtitle}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {cfg.hint && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-3">{cfg.hint}</p>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border ${cfg.border} ${cfg.ring} focus:ring-2 outline-none text-sm font-medium transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl text-sm font-semibold">
                <Lock size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 bg-gradient-to-r ${cfg.btn} disabled:opacity-60 text-white rounded-xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 mt-2`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : `Sign In as ${cfg.label}`}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Contact your manager if you have trouble logging in.
        </p>
      </div>
    </div>
  );
}

// Role selector landing — shown when no role is chosen yet (only for staff portal)
export function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <UtensilsCrossed size={24} className="text-amber-400" />
            <span className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">
              FreshBite
            </span>
          </div>
          <p className="text-gray-400 text-sm">Staff Portal — Select your role to continue</p>
        </div>

        <div className="space-y-3">
          {[
            { role: 'chef' as Role, label: 'Chef', sub: 'Kitchen & orders', icon: <ChefHat size={22} />, bg: 'from-orange-500 to-amber-500' },
            { role: 'waiter' as Role, label: 'Captain', sub: 'Service & delivery', icon: <Utensils size={22} />, bg: 'from-teal-500 to-cyan-500' },
            { role: 'manager' as Role, label: 'Manager', sub: 'Operations & control', icon: <BarChart3 size={22} />, bg: 'from-slate-500 to-slate-700' },
          ].map(item => (
            <button
              key={item.role}
              onClick={() => onSelect(item.role)}
              className="w-full flex items-center gap-4 px-5 py-4 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-2xl transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center text-white flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="text-left">
                <p className="font-black text-white text-base">{item.label}</p>
                <p className="text-gray-500 text-xs">{item.sub}</p>
              </div>
              <div className="ml-auto text-gray-600 group-hover:text-gray-400 transition-colors">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

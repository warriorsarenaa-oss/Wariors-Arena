"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/${locale}/admin/dashboard`);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('A connection error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00FFCC]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#CC0033]/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-card w-full max-w-md p-8 md:p-10 rounded-[3rem] relative z-10 border border-white/10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-white">
            Warriors <span className="text-[#00FFCC]">Arena</span>
          </h1>
          <div className="h-0.5 w-16 bg-[#00FFCC] mx-auto mt-4 mb-2" />
          <p className="text-[#A0A0B8] uppercase tracking-widest text-xs font-bold">
            Admin Access Protocol
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[#A0A0B8] text-xs font-bold uppercase tracking-wider mb-2 px-1">
              Command Operator
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#13131A] border border-[#1E1E2E] rounded-2xl p-4 text-white focus:outline-none focus:border-[#00FFCC]/50 transition-all"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="block text-[#A0A0B8] text-xs font-bold uppercase tracking-wider mb-2 px-1">
              Access Code
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#13131A] border border-[#1E1E2E] rounded-2xl p-4 text-white focus:outline-none focus:border-[#00FFCC]/50 transition-all font-mono"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm p-4 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-5 rounded-2xl uppercase tracking-[0.2em] font-black text-sm flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Lock size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-[#A0A0B8]/40 text-[10px] uppercase tracking-widest leading-relaxed">
                Protected System. Unauthorized access attempts are logged and monitored.
            </p>
        </div>
      </motion.div>
    </div>
  );
}

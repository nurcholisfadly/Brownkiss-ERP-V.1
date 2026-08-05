import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Sparkles, Lock as LockIcon, ArrowRight } from 'lucide-react';
import { supabase, verifyPassword, hashPassword, saveErpUserToCloud } from '../../../supabaseClient';
import { ErpUser } from '../../../types';
import { DEFAULT_USERS } from '../../../constants/defaults';

interface LoginProps {
  onLoginSuccess: (user?: ErpUser) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

  // Real auth submit to Supabase using targeted email query & secure hash verification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanEmail = email.toLowerCase().trim();

    try {
      let matchedUser: any = null;

      // 1. Fetch ONLY the single matching user row by email from Supabase (never query all users)
      try {
        const { data, error } = await supabase
          .from('erp_users')
          .select('id, name, email, role, status, password')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (data && !error) {
          matchedUser = data;
        }
      } catch (dbErr) {
        console.warn('Failed to fetch user from Supabase, checking local fallback:', dbErr);
      }

      // 2. Fallback to localStorage if not found in DB
      if (!matchedUser) {
        const saved = localStorage.getItem('donat_erp_users');
        if (saved) {
          try {
            const localUsers: any[] = JSON.parse(saved);
            matchedUser = localUsers.find(
              (u: any) => u.email.toLowerCase().trim() === cleanEmail
            );
          } catch (e) {}
        }
      }

      // 3. Fallback to default user if empty and email matches
      const defaultUser = DEFAULT_USERS[0];
      if (!matchedUser && cleanEmail === defaultUser.email.toLowerCase()) {
        matchedUser = {
          ...defaultUser,
          password: await hashPassword(defaultUser.password || '123456')
        };
      }

      if (!matchedUser) {
        setMessage({
          text: 'Akses ditolak — Email tidak terdaftar dalam sistem.',
          type: 'err',
        });
        setLoading(false);
        return;
      }

      // 4. Check if user is active
      if (matchedUser.status === 'Nonaktif' || matchedUser.status === 'nonaktif') {
        setMessage({
          text: 'Akses ditolak — Akun staff ini dinonaktifkan oleh Owner/Manager.',
          type: 'err',
        });
        setLoading(false);
        return;
      }

      // 5. Verify password using hash match
      const userPassword = matchedUser.password || '123456';
      const isPasswordValid = await verifyPassword(password, userPassword);

      if (!isPasswordValid) {
        setMessage({
          text: 'Akses ditolak — Kata sandi salah.',
          type: 'err',
        });
        setLoading(false);
        return;
      }

      // 6. Automatic Hash Migration: If user was stored in plaintext, upgrade to salted hash
      const isAlreadyHashed = /^[a-f0-9]{64}$/i.test(userPassword) || userPassword.startsWith('shafallback_');
      let finalPasswordHash = userPassword;

      if (!isAlreadyHashed) {
        finalPasswordHash = await hashPassword(password);
        matchedUser.password = finalPasswordHash;
        saveErpUserToCloud(matchedUser).catch(() => {});
      }

      // 7. Success
      setMessage({
        text: `Login berhasil. Selamat datang kembali, ${matchedUser.name}!`,
        type: 'ok',
      });

      const loggedUser: ErpUser = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
        status: matchedUser.status,
        password: finalPasswordHash
      };

      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(loggedUser);
      }, 900);

    } catch (err) {
      console.error(err);
      setMessage({
        text: 'Terjadi kesalahan sistem internal.',
        type: 'err',
      });
      setLoading(false);
    }
  };

  // Quick Developer Bypass Helper to log in instantly
  const handleBypassLogin = () => {
    setLoading(true);
    setMessage(null);
    setTimeout(() => {
      setLoading(false);
      setMessage({
        text: 'Login berhasil! Masuk menggunakan Bypass Mode.',
        type: 'ok',
      });
      setTimeout(() => {
        onLoginSuccess();
      }, 800);
    }, 1000);
  };

  const modules = ['Inventori', 'Produksi', 'Kasir', 'Laporan'];

  return (
    <div className="flex w-full min-h-screen bg-[#FBF6EC] text-[#2E2013] select-none font-sans overflow-hidden">
      <style>{`
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 520; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.16; transform: scale(1); }
          50% { opacity: 0.24; transform: scale(1.05); }
        }
        .rise-1 { animation: riseIn .8s cubic-bezier(.16,1,.3,1) both; }
        .rise-2 { animation: riseIn .8s cubic-bezier(.16,1,.3,1) .1s both; }
        .rise-3 { animation: riseIn .8s cubic-bezier(.16,1,.3,1) .2s both; }
        .fade-in { animation: fadeIn .4s cubic-bezier(.16,1,.3,1) both; }
        .glaze-draw { stroke-dasharray: 520; animation: drawLine 1.8s cubic-bezier(.16,1,.3,1) .4s both; }
        .glow-ambient { animation: glowPulse 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .rise-1, .rise-2, .rise-3, .fade-in, .glaze-draw, .glow-ambient { animation: none; }
        }
      `}</style>

      <div className="flex w-full min-h-screen">

        {/* ================= LEFT BRAND PANEL ================= */}
        <aside className="relative hidden md:flex flex-col justify-between w-[44%] bg-gradient-to-br from-[#2B1D12] to-[#4A3220] text-[#F5EBDA] p-14 overflow-hidden border-r border-black/15">

          {/* warm caramel ambient glow, like light through a glazed surface */}
          <div
            className="absolute -bottom-32 -left-20 w-[420px] h-[420px] rounded-full pointer-events-none glow-ambient"
            style={{ background: 'radial-gradient(circle, rgba(199,148,88,0.22) 0%, transparent 70%)' }}
          />

          {/* soft coffee-glaze marbling — smooth caramel pools with a light dusting of brown-sugar crumb, echoing the reference photo */}
          <svg
            className="absolute inset-0 w-full h-full opacity-80 pointer-events-none"
            viewBox="0 0 460 900"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <defs>
              <filter id="glazeBlur" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="60" />
              </filter>
            </defs>

            {/* smooth, few, softly-blurred glaze pools instead of busy stippling */}
            <g filter="url(#glazeBlur)">
              <ellipse cx="90" cy="140" rx="200" ry="150" fill="#C79458" opacity="0.16" />
              <ellipse cx="380" cy="300" rx="220" ry="180" fill="#8B5A2B" opacity="0.14" />
              <ellipse cx="120" cy="560" rx="230" ry="190" fill="#A9713C" opacity="0.16" />
              <ellipse cx="360" cy="760" rx="210" ry="170" fill="#6B4626" opacity="0.15" />
            </g>

            {/* a light scatter of brown-sugar crumb flecks, kept sparse for a calm feel */}
            <g>
              <ellipse cx="70" cy="90" rx="5" ry="2.3" fill="#E3C99A" opacity="0.45" transform="rotate(20 70 90)" />
              <ellipse cx="220" cy="60" rx="4.5" ry="2" fill="#B9834A" opacity="0.4" transform="rotate(140 220 60)" />
              <ellipse cx="350" cy="130" rx="5" ry="2.3" fill="#E3C99A" opacity="0.4" transform="rotate(80 350 130)" />
              <ellipse cx="60" cy="330" rx="4.5" ry="2" fill="#B9834A" opacity="0.4" transform="rotate(35 60 330)" />
              <ellipse cx="260" cy="380" rx="5" ry="2.3" fill="#E3C99A" opacity="0.4" transform="rotate(100 260 380)" />
              <ellipse cx="410" cy="440" rx="4.5" ry="2" fill="#B9834A" opacity="0.35" transform="rotate(15 410 440)" />
              <ellipse cx="120" cy="620" rx="5" ry="2.3" fill="#E3C99A" opacity="0.4" transform="rotate(60 120 620)" />
              <ellipse cx="330" cy="660" rx="4.5" ry="2" fill="#B9834A" opacity="0.4" transform="rotate(150 330 660)" />
              <ellipse cx="200" cy="800" rx="5" ry="2.3" fill="#E3C99A" opacity="0.4" transform="rotate(30 200 800)" />
              <ellipse cx="400" cy="820" rx="4.5" ry="2" fill="#B9834A" opacity="0.35" transform="rotate(110 400 820)" />
            </g>
          </svg>

          <div className="relative z-10 rise-1 flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-3.5">
              <svg className="w-10 h-10 flex-none" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="22" cy="22" r="19" stroke="#E3C99A" strokeWidth="1.6" />
                <circle cx="22" cy="22" r="7" fill="#2A1B10" />
                <circle cx="22" cy="22" r="7" stroke="#E3C99A" strokeWidth="1.6" />
                <path d="M8 15 Q22 8 36 15" stroke="#C79458" strokeWidth="1.6" strokeLinecap="round" fill="none" />
              </svg>
              <div className="font-serif text-xl tracking-wide">
                Brownkiss<b className="font-semibold text-[#C79458]">ERP</b>
              </div>
            </div>
            <p className="mt-4 text-xs text-[#C4B49D] max-w-[280px] leading-relaxed font-medium">
              Sistem Manajemen Terpadu untuk Dapur &amp; Toko Brownkiss Artisan Modern.
            </p>
          </div>

          <div className="relative z-10 my-auto pt-14 pb-8 rise-2 flex flex-col items-center text-center">
            <h1 className="font-serif text-3xl lg:text-[2.35rem] leading-[1.2] font-medium text-[#F7EEE1] mb-4 max-w-[380px]">
              Kelola dapur dan toko mu dengan tenang.
            </h1>
            <p className="text-sm text-[#C4B49D] leading-relaxed max-w-[300px]">
              Bahan baku, resep, produksi, dan kasir penjualan — dalam satu dashboard real-time.
            </p>

            <div className="h-[10px] mt-7 relative overflow-visible w-[260px]">
              <svg className="w-full h-full block overflow-visible" viewBox="0 0 380 10" preserveAspectRatio="none">
                <path
                  className="fill-none glaze-draw"
                  style={{ stroke: 'url(#glazeGrad)', strokeWidth: 2.2, strokeLinecap: 'round' }}
                  d="M2,5 C60,1 90,9 150,5 C210,1 240,9 300,5 C330,3 350,7 378,5"
                />
                <defs>
                  <linearGradient id="glazeGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#A9713C" />
                    <stop offset="1" stopColor="#C79458" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* perforated recipe-card divider, tidy static module row */}
            <div
              className="mt-8 pt-5 flex flex-wrap justify-center gap-x-6 gap-y-3 w-full"
              style={{ borderTop: '1px dashed rgba(245,235,218,0.16)' }}
            >
              {modules.map((m) => (
                <span key={m} className="font-mono text-[10.5px] uppercase tracking-wider text-[#B0A088] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C79458] inline-block" />
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 font-mono text-[11px] text-[#8A7A64] tracking-widest pt-4 rise-2 text-center">
            Brownkiss ERP · v1.0
          </div>
        </aside>

        {/* ================= RIGHT FORM PANEL ================= */}
        <main className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-[340px] rise-3 space-y-6">
            <div className="text-center md:text-left">
              <h2 className="font-serif text-3xl font-semibold text-[#2E2013] tracking-tight">
                Selamat Datang, Bakers! 🍩
              </h2>
              <p className="text-xs text-[#7A6A56] mt-2 leading-relaxed">
                Silakan masuk untuk menyelaraskan stok bahan baku, memantau oven adonan, dan mengelola transaksi kasir secara realtime.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Staf (nama@toko.com)"
                  className="w-full px-4 py-3 text-sm bg-white border border-[#EEE3D0] rounded-xl focus:border-[#A9713C] focus:ring-4 focus:ring-[#A9713C]/10 focus:outline-none transition-all duration-300 placeholder:text-[#D2C2A8]"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata Sandi"
                    className="w-full pl-4 pr-11 py-3 text-sm bg-white border border-[#EEE3D0] rounded-xl focus:border-[#A9713C] focus:ring-4 focus:ring-[#A9713C]/10 focus:outline-none transition-all duration-300 placeholder:text-[#D2C2A8]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-[#A6957C] hover:text-[#2E2013] rounded-lg transition-colors"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-[#7A6A56] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-[#EEE3D0] text-[#A9713C] focus:ring-[#A9713C] cursor-pointer"
                  />
                  <span className="font-medium select-none">Ingat saya</span>
                </label>
                <a
                  href="#lupa"
                  onClick={(e) => { e.preventDefault(); alert('Hubungi Administrator IT Brownkiss untuk reset kata sandi.'); }}
                  className="font-bold text-[#A9713C] hover:underline"
                >
                  Lupa sandi?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2A1D12] hover:bg-[#3D2C1A] text-[#FBF6EC] py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed shadow-xs hover:shadow-md cursor-pointer flex items-center justify-center"
              >
                <span className="flex items-center justify-center gap-2.5">
                  {loading && (
                    <span className="w-4 h-4 border-2 border-[#FBF6EC]/20 border-t-[#FBF6EC] rounded-full animate-spin" />
                  )}
                  <span>{loading ? 'Memverifikasi...' : 'Mulai Sesi Kerja ☕'}</span>
                </span>
              </button>
            </form>

            {message && (
              <div
                key={message.text}
                className={`text-center text-xs p-3.5 rounded-xl fade-in border ${
                  message.type === 'ok'
                    ? 'bg-[#EEF3EC] text-[#4C6B4A] border-[#6F8F6C]/25'
                    : 'bg-[#FBEDEA] text-[#B3432F] border-[#B3432F]/15'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Premium Developer Bypass Option */}
            <div className="pt-4 border-t border-[#EEE3D0] text-center">
              <button
                type="button"
                onClick={handleBypassLogin}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#F6EDDD] border border-[#EEE3D0] hover:border-[#C79458] text-xs font-bold text-[#2E2013] rounded-xl transition-all shadow-xxs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C79458]" />
                <span>Masuk Cepat (Demo Mode)</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}

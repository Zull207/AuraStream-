import { useState, useEffect } from 'react';
import logoImg from '../../assets/logo.png';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0); // 0: logo appear, 1: text appear, 2: fade out

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => onComplete(), 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #0a0a0c 0%, #131316 40%, #1a1a24 100%)',
        opacity: phase === 2 ? 0 : 1,
        transition: 'opacity 0.5s ease-out',
      }}
    >
      {/* Background glow */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-20"
        style={{
          background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
          transform: phase >= 1 ? 'scale(1.5)' : 'scale(0.5)',
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />

      {/* Logo icon */}
      <div
        className="relative mb-5"
        style={{
          opacity: phase >= 0 ? 1 : 0,
          transform: phase >= 0 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
          transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 8px 40px rgba(167, 139, 250, 0.4), 0 0 80px rgba(96, 165, 250, 0.15)',
          }}
        >
          <img src={logoImg} alt="AuraStream" className="w-full h-full object-cover" />
        </div>
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            border: '2px solid rgba(167, 139, 250, 0.3)',
            animation: 'splash-pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>

      {/* App name */}
      <div
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(10px)',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s',
        }}
      >
        <h1 className="text-3xl font-bold text-text-primary tracking-tight mb-1">
          Aura<span className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">Stream</span>
        </h1>
        <p className="text-xs text-text-muted text-center tracking-widest uppercase">
          Musik Minimalis
        </p>
      </div>

      {/* Loading dots */}
      <div
        className="flex gap-1.5 mt-8"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
              animation: `splash-dot 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0; }
        }
        @keyframes splash-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

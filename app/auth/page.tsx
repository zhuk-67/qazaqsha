'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setMessage('Тіркелу сәтті өтті! Электронды поштаңызды тексеріңіз немесе кіріңіз.');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/learning-path');
      }
    } catch (err: any) {
      setMessage(err.message || 'Қате орын алды');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '2.5rem', borderRadius: '16px', maxWidth: '420px', width: '100%', border: '1px solid #334155' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', textAlign: 'center', fontWeight: 'bold' }}>
          {isSignUp ? 'Тіркелу (Регистрация)' : 'Кіру (Вход)'}
        </h1>
        <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem' }}>
          Қазақ тілін үйрену платформасы
        </p>

        {message && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: '#334155', color: '#38bdf8', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isSignUp && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Аты-жөніңіз (Имя)</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Құпия сөз (Пароль)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', backgroundColor: '#2563eb', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Жүктелуде...' : isSignUp ? 'Тіркелу' : 'Кіру'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
          {isSignUp ? 'Аккаунтыңыз бар ма? ' : 'Аккаунтыңыз жоқ па? '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
          >
            {isSignUp ? 'Кіру' : 'Тіркелу'}
          </button>
        </div>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#64748b', fontSize: '0.8rem', textDecoration: 'none' }}>
            ← Басты бетке (На главную)
          </Link>
        </div>
      </div>
    </div>
  );
}
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';

export default function LoginPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState('Contact us - DM\n+251951818822\n+251723358806');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.role && data.redirect) router.replace(data.redirect);
      })
      .catch(() => undefined);

    fetch('/api/settings/public')
      .then((r) => r.json())
      .then((data) => {
        if (data.contactInfo) {
          setContactInfo(`Contact us - DM\n${data.contactInfo}`);
        }
      })
      .catch(() => undefined);
  }, [router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAlert('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || tr('invalidLogin'));
      router.push(data.redirect);
    } catch (error) {
      setAlert(error instanceof Error ? error.message : tr('invalidLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="split-login-container">
      <div className="split-login-left">
        <div className="split-login-content">
          <div className="split-login-logo-mark">E</div>
          <h1 className="split-login-title">{tr('signInPortal')}</h1>
          {alert && <div className="alert error login-alert">{alert}</div>}
          <div className="split-login-card">
            <form onSubmit={handleLogin} className="split-login-form">
              <label className="split-field-group">
                <span className="split-field-label">{tr('username')}</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="split-input"
                  autoComplete="username"
                  required
                />
              </label>
              <label className="split-field-group">
                <span className="split-field-label">{tr('password')}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="split-input"
                  autoComplete="current-password"
                  required
                />
              </label>
              <button type="submit" className="split-login-button" disabled={loading}>
                {loading ? '...' : tr('signIn')}
              </button>
            </form>
            <div className="split-contact">{contactInfo}</div>
          </div>
        </div>
      </div>
      <div className="split-login-right">
        <Image
          src="/images/edil_bingo.png"
          alt="Edle Bingo"
          width={600}
          height={600}
          className="split-brand-image"
          priority
        />
      </div>
    </main>
  );
}

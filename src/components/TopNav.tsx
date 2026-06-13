'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bell, Moon, MoreVertical, Sun } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { useTheme } from '@/contexts/ThemeContext';

type PublicSettings = {
  contactInfo: string;
  slogan: string;
};

const iconSize = 18;
const iconStroke = 2;

export default function TopNav() {
  const pathname = usePathname();
  const { tr, locale, setLocale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<PublicSettings>({
    contactInfo: '+251951818822\n+251723358806',
    slogan: 'EVERY DRAW OF PATTERN IS LUCKY ENCOUNTER',
  });
  const [unread, setUnread] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; body: string; read: boolean; createdAt: string }>>([]);

  useEffect(() => {
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (pathname === '/' || pathname.startsWith('/dashboard/downloads')) return;
    const load = () => {
      fetch('/api/notifications')
        .then((r) => r.json())
        .then((data) => {
          setUnread(data.unreadCount || 0);
          setNotifications(data.notifications || []);
        })
        .catch(() => undefined);
    };
    load();
    const interval = window.setInterval(load, 4000);
    return () => window.clearInterval(interval);
  }, [pathname]);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowNotifications(false);
  }, [pathname]);

  if (pathname === '/') return null;

  const phones = settings.contactInfo
    .split('\n')
    .flatMap((line) => line.split(','))
    .map((p) => p.trim())
    .filter(Boolean);

  const markAllRead = async () => {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    if (!res.ok) return;
    setUnread(0);
    setNotifications([]);
  };

  const ThemeIcon = theme === 'light' ? Moon : Sun;

  const notificationPanel = (
    <>
      <div className="notification-header">
        <strong>{tr('notifications')}</strong>
        {notifications.length > 0 && (
          <button type="button" onClick={markAllRead}>{tr('markAllRead')}</button>
        )}
      </div>
      {notifications.length ? notifications.map((n) => (
        <div key={n.id} className="notification-item unread">
          <strong>{n.title}</strong>
          <p>{n.body}</p>
          <small>{new Date(n.createdAt).toLocaleString()}</small>
        </div>
      )) : <p className="notification-empty">{tr('noData')}</p>}
    </>
  );

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <div className="top-nav-logo">
          <Image src="/images/icon.png" alt="Edle Bingo" width={38} height={38} className="logo-image" />
          <div className="logo-text-group">
            <span className="logo-text">EDLE BINGO</span>
            <span className="logo-slogan">{settings.slogan}</span>
          </div>
        </div>
      </div>

      <div className="top-nav-right top-nav-desktop">
        <div className="nav-controls">
          <button type="button" className="nav-control-btn nav-icon-btn" onClick={toggleTheme} title={tr('theme')} aria-label={tr('theme')}>
            <ThemeIcon size={iconSize} strokeWidth={iconStroke} aria-hidden />
          </button>
          <select className="nav-lang-select" value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'am')} aria-label={tr('language')}>
            <option value="en">{tr('english')}</option>
            <option value="am">{tr('amharic')}</option>
          </select>
        </div>
        <div className="notification-wrap">
          <button type="button" className="notification-btn nav-icon-btn" onClick={() => setShowNotifications((v) => !v)} aria-label={tr('notifications')}>
            <Bell size={iconSize} strokeWidth={iconStroke} aria-hidden />
            {unread > 0 && <span className="notification-badge">{unread}</span>}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              {notificationPanel}
            </div>
          )}
        </div>
        <div className="nav-contact-badge">{tr('support')}</div>
        <div className="nav-phones">
          {phones.map((phone) => (
            <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`} className="phone-link">{phone}</a>
          ))}
        </div>
      </div>

      <div className="top-nav-mobile-actions">
        <button type="button" className="nav-control-btn nav-icon-btn" onClick={toggleTheme} title={tr('theme')} aria-label={tr('theme')}>
          <ThemeIcon size={iconSize} strokeWidth={iconStroke} aria-hidden />
        </button>
        <div className="notification-wrap">
          <button type="button" className="notification-btn nav-icon-btn" onClick={() => setShowNotifications((v) => !v)} aria-label={tr('notifications')}>
            <Bell size={iconSize} strokeWidth={iconStroke} aria-hidden />
            {unread > 0 && <span className="notification-badge">{unread}</span>}
          </button>
        </div>
        <button
          type="button"
          className="nav-control-btn nav-icon-btn top-nav-more-btn"
          aria-label="More options"
          aria-expanded={showMobileMenu}
          onClick={() => setShowMobileMenu((v) => !v)}
        >
          <MoreVertical size={iconSize} strokeWidth={iconStroke} aria-hidden />
        </button>
      </div>

      {(showNotifications || showMobileMenu) && (
        <button
          type="button"
          className="top-nav-mobile-backdrop"
          aria-label="Close menu"
          onClick={() => { setShowNotifications(false); setShowMobileMenu(false); }}
        />
      )}

      {showNotifications && (
        <div className="notification-dropdown notification-dropdown-mobile">
          {notificationPanel}
        </div>
      )}

      {showMobileMenu && (
        <div className="top-nav-mobile-menu">
          <select className="nav-lang-select w-full" value={locale} onChange={(e) => setLocale(e.target.value as 'en' | 'am')} aria-label={tr('language')}>
            <option value="en">{tr('english')}</option>
            <option value="am">{tr('amharic')}</option>
          </select>
          <div className="nav-contact-badge">{tr('support')}</div>
          <div className="nav-phones nav-phones-stack">
            {phones.map((phone) => (
              <a key={phone} href={`tel:${phone.replace(/\s/g, '')}`} className="phone-link">{phone}</a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

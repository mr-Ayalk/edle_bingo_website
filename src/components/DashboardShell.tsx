'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useI18n } from '@/contexts/I18nContext';

export type NavItem = {
  id: string;
  labelKey: Parameters<ReturnType<typeof useI18n>['tr']>[0];
  icon: ReactNode;
  heading?: string;
};

type DashboardShellProps = {
  user: { name: string; avatar: string; badge?: string; role: string };
  roleLabel: string;
  section: string;
  onSectionChange: (id: string) => void;
  navItems: NavItem[];
  sectionTitle: string;
  breadcrumb: string;
  onLogout: () => void;
  children: ReactNode;
};

export default function DashboardShell({
  user,
  roleLabel,
  section,
  onSectionChange,
  navItems,
  sectionTitle,
  breadcrumb,
  onLogout,
  children,
}: DashboardShellProps) {
  const { tr } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  let lastHeading = '';

  useEffect(() => {
    document.body.classList.toggle('sidebar-open', sidebarOpen);
    return () => document.body.classList.remove('sidebar-open');
  }, [sidebarOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 992) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleSectionChange = (id: string) => {
    onSectionChange(id);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-layout">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label={tr('closeMenu')}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-profile">
          <div className="profile-avatar">{user.badge || user.avatar || '🎲'}</div>
          <div className="profile-info">
            <h3 className="profile-name">{user.name}</h3>
            <span className="profile-role">
              {roleLabel}
              {user.badge && <span className="agent-badge-large">{user.badge}</span>}
            </span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            aria-label={tr('closeMenu')}
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const showHeading = item.heading && item.heading !== lastHeading;
            if (item.heading) lastHeading = item.heading;
            return (
              <div key={item.id}>
                {showHeading && <span className="nav-heading">{item.heading}</span>}
                <button
                  type="button"
                  className={`nav-link ${section === item.id ? 'active' : ''}`}
                  onClick={() => handleSectionChange(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {tr(item.labelKey)}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="nav-link text-danger" onClick={onLogout}>
            <span className="nav-icon">
              <IconLogout />
            </span>
            {tr('logout')}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="content-header">
          <div className="content-header-main">
            <button
              type="button"
              className="sidebar-toggle-btn"
              aria-label={tr('openMenu')}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <IconMenu />
            </button>
            <div>
              <div className="header-title">
                <div className="page-icon">◆</div>
                <h2>{sectionTitle}</h2>
              </div>
              <div className="header-breadcrumbs">{breadcrumb}</div>
            </div>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}

const IconMenu = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const IconLogout = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const IconHome = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
export const IconUsers = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);
export const IconCard = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
export const IconReport = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
export const IconSettings = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
export const IconPlus = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);
export const IconInbox = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16v16H4z" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);
export const IconClients = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const IconUpload = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell, {
  IconCard,
  IconClients,
  IconHome,
  IconInbox,
  IconReport,
  IconSettings,
  IconUsers,
} from '@/components/DashboardShell';
import AboutSection from '@/components/AboutSection';
import CopyButton from '@/components/CopyButton';
import InboxPanel from '@/components/InboxPanel';
import ClientsPanel from '@/components/ClientsPanel';
import { AVATARS, BADGES } from '@/lib/constants';
import { useI18n } from '@/contexts/I18nContext';

type User = {
  id: number;
  username: string;
  name: string;
  role: string;
  phone: string;
  avatar: string;
  badge: string;
  balance: number;
};

type Voucher = {
  id: number;
  code: string;
  amount: number;
  agentName: string;
  status: string;
  createdAt: string;
};

type AboutSettings = {
  aboutTitle: string;
  aboutDescription: string;
  contactInfo: string;
  location: string;
};

const defaultAgentForm = {
  id: null as number | null,
  name: '',
  username: '',
  password: '',
  phone: '',
  avatar: '🎲',
  badge: '🚩',
  balance: '',
};

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState('dashboard');
  const [agents, setAgents] = useState<User[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [agentForm, setAgentForm] = useState(defaultAgentForm);
  const [topUp, setTopUp] = useState({ agentId: '', amount: '' });
  const [settings, setSettings] = useState({
    name: '',
    username: '',
    password: '',
    aboutTitle: '',
    aboutDescription: '',
    contactInfo: '',
    location: '',
    slogan: '',
    downloadUsername: 'downloads',
    downloadPassword: '',
  });
  const [aboutPublic, setAboutPublic] = useState({
    aboutTitle: '',
    aboutDescription: '',
    contactInfo: '',
    location: '',
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'OWNER') {
          router.replace('/');
          return;
        }
        setUser(data.user);
        setSettings((s) => ({
          ...s,
          name: data.user.name,
          username: data.user.username,
        }));
        loadAll();
      });
  }, [router]);

  const signalAlert = (type: string, message: string) => {
    setAlert({ type, message });
    window.setTimeout(() => setAlert({ type: '', message: '' }), 4500);
  };

  const loadAll = async () => {
    const [usersRes, vouchersRes, settingsRes, publicRes] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/vouchers'),
      fetch('/api/settings'),
      fetch('/api/settings/public'),
    ]);
    const usersJson = await usersRes.json();
    const vouchersJson = await vouchersRes.json();
    const settingsJson = await settingsRes.json();
    const publicJson = await publicRes.json();
    setAgents(usersJson.users || []);
    setVouchers(vouchersJson.vouchers || []);
    setSettings((s) => ({
      ...s,
      aboutTitle: settingsJson.aboutTitle || '',
      aboutDescription: settingsJson.aboutDescription || '',
      contactInfo: settingsJson.contactInfo || '',
      location: settingsJson.location || '',
      slogan: settingsJson.slogan || '',
      downloadUsername: settingsJson.downloadUsername || 'downloads',
    }));
    setAboutPublic(publicJson);
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const activeAgents = agents.filter((a) => a.role === 'AGENT');
  const recentVouchers = [...vouchers].slice(0, 6);
  const topAgents = [...activeAgents].sort((a, b) => b.balance - a.balance).slice(0, 5);

  const saveAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: agentForm.name.trim(),
      username: agentForm.username.trim(),
      password: agentForm.password,
      phone: agentForm.phone.trim(),
      avatar: agentForm.avatar,
      badge: agentForm.badge,
      balance: Number(agentForm.balance) || 0,
    };
    if (!payload.name || !payload.username || (!agentForm.id && !payload.password)) {
      signalAlert('error', 'Please complete required fields.');
      return;
    }
    const url = agentForm.id ? `/api/users/${agentForm.id}` : '/api/users';
    const method = agentForm.id ? 'PATCH' : 'POST';
    const body = agentForm.id && !payload.password ? { ...payload, password: undefined } : payload;
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return signalAlert('error', data.message);
    signalAlert('success', agentForm.id ? 'Agent updated.' : 'Agent created.');
    setAgentForm(defaultAgentForm);
    loadAll();
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerRes = await fetch(`/api/users/${user?.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: settings.name,
        username: settings.username,
        ...(settings.password ? { password: settings.password } : {}),
      }),
    });
    const appRes = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aboutTitle: settings.aboutTitle,
        aboutDescription: settings.aboutDescription,
        contactInfo: settings.contactInfo,
        location: settings.location,
        slogan: settings.slogan,
        downloadUsername: settings.downloadUsername,
        ...(settings.downloadPassword ? { downloadPassword: settings.downloadPassword } : {}),
      }),
    });
    if (!ownerRes.ok || !appRes.ok) return signalAlert('error', 'Unable to save settings.');
    signalAlert('success', 'Settings saved.');
    setSettings((s) => ({ ...s, password: '', downloadPassword: '' }));
    loadAll();
  };

  const navItems = [
    { id: 'dashboard', labelKey: 'dashboard' as const, icon: <IconHome />, heading: tr('overview') },
    { id: 'agents', labelKey: 'agents' as const, icon: <IconUsers />, heading: tr('management') },
    { id: 'topup', labelKey: 'topUp' as const, icon: <IconCard /> },
    { id: 'report', labelKey: 'reports' as const, icon: <IconReport /> },
    { id: 'clients', labelKey: 'clients' as const, icon: <IconClients /> },
    { id: 'inbox', labelKey: 'inbox' as const, icon: <IconInbox />, heading: tr('preferences') },
    { id: 'settings', labelKey: 'settings' as const, icon: <IconSettings /> },
  ];

  if (!user) return null;

  return (
    <DashboardShell
      user={user}
      roleLabel={tr('systemAdmin')}
      section={section}
      onSectionChange={setSection}
      navItems={navItems}
      sectionTitle={tr(section as 'dashboard')}
      breadcrumb={`${tr('overview')} / ${tr(section as 'dashboard')}`}
      alert={alert}
      onLogout={logout}
    >
      {section === 'dashboard' && (
        <>
          <AboutSection {...aboutPublic} />
          <div className="dashboard-metrics">
            <div className="metric-card bg-gradient-danger">
              <div className="metric-card-body">
                <h4 className="metric-title">{tr('totalAgents')}</h4>
                <h2 className="metric-value">{activeAgents.length}</h2>
              </div>
              <div className="circle-pattern" />
            </div>
            <div className="metric-card bg-gradient-info">
              <div className="metric-card-body">
                <h4 className="metric-title">{tr('availableCredit')}</h4>
                <h2 className="metric-value">${activeAgents.reduce((s, a) => s + a.balance, 0).toLocaleString()}</h2>
              </div>
              <div className="circle-pattern" />
            </div>
            <div className="metric-card bg-gradient-success">
              <div className="metric-card-body">
                <h4 className="metric-title">{tr('vouchersIssued')}</h4>
                <h2 className="metric-value">{vouchers.length}</h2>
              </div>
              <div className="circle-pattern" />
            </div>
          </div>
          <div className="dashboard-grid">
            <div className="card fill-card">
              <div className="card-header"><h4 className="card-title">{tr('recentVouchers')}</h4></div>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>{tr('voucherCode')}</th>
                      <th>{tr('amount')}</th>
                      <th>Agent</th>
                      <th>{tr('date')}</th>
                      <th>{tr('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentVouchers.map((v) => (
                      <tr key={v.id}>
                        <td className="copy-cell"><CopyButton text={v.code} /><strong>{v.code}</strong></td>
                        <td>${v.amount.toLocaleString()}</td>
                        <td>{v.agentName}</td>
                        <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                        <td><span className={`status-badge status-${v.status}`}>{v.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="card fill-card">
              <div className="card-header"><h4 className="card-title">{tr('topAgents')}</h4></div>
              <div className="top-agents-list">
                {topAgents.map((agent) => (
                  <div key={agent.id} className="top-agent-item">
                    <div className="top-agent-avatar">{agent.avatar}</div>
                    <div className="top-agent-details">
                      <h6>{agent.name} <span className="agent-badge-large">{agent.badge}</span></h6>
                      <p className="text-muted">{agent.username}</p>
                    </div>
                    <div className="top-agent-balance">${agent.balance.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {section === 'agents' && (
        <div className="dashboard-grid dashboard-grid-reverse">
          <div className="card fill-card">
            <div className="card-header"><h4 className="card-title">{tr('agentDirectory')}</h4></div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr><th>Agent</th><th>{tr('phone')}</th><th>Badge</th><th>Balance</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {activeAgents.map((agent) => (
                    <tr key={agent.id}>
                      <td><strong>{agent.name}</strong><div className="text-muted text-xs">{agent.username}</div></td>
                      <td>{agent.phone}</td>
                      <td><span className="agent-badge-large">{agent.badge}</span></td>
                      <td>${agent.balance.toLocaleString()}</td>
                      <td>
                        <button type="button" className="btn btn-light" onClick={() => setAgentForm({ id: agent.id, name: agent.name, username: agent.username, password: '', phone: agent.phone, avatar: agent.avatar, badge: agent.badge, balance: String(agent.balance) })}>Edit</button>
                        <button type="button" className="btn btn-light text-danger" onClick={async () => { if (window.confirm('Delete agent?')) { await fetch(`/api/users/${agent.id}`, { method: 'DELETE' }); loadAll(); } }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h4 className="card-title">{agentForm.id ? tr('editAgent') : tr('createAgent')}</h4></div>
            <div className="card-body">
              <form onSubmit={saveAgent} className="form-layout">
                <input className="form-control" placeholder={tr('fullName')} value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} />
                <input className="form-control" placeholder={tr('username')} value={agentForm.username} onChange={(e) => setAgentForm({ ...agentForm, username: e.target.value })} />
                <input className="form-control" type="password" placeholder="Password" value={agentForm.password} onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })} />
                <input className="form-control" placeholder={tr('phone')} value={agentForm.phone} onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })} />
                <div className="avatar-selector">
                  {AVATARS.map((a) => (
                    <button key={a} type="button" className={`avatar-btn ${agentForm.avatar === a ? 'active' : ''}`} onClick={() => setAgentForm({ ...agentForm, avatar: a })}>{a}</button>
                  ))}
                </div>
                <select className="form-control" value={agentForm.badge} onChange={(e) => setAgentForm({ ...agentForm, badge: e.target.value })}>
                  {BADGES.map((b) => <option key={b.value} value={b.value}>{`${b.value} ${b.label}`}</option>)}
                </select>
                <input className="form-control" type="number" placeholder="Initial credit" value={agentForm.balance} onChange={(e) => setAgentForm({ ...agentForm, balance: e.target.value })} />
                <button type="submit" className="btn btn-primary">{tr('save')}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {section === 'topup' && (
        <div className="card narrow-card">
          <div className="card-body">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch(`/api/users/${topUp.agentId}/topup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: Number(topUp.amount) }) });
              const data = await res.json();
              if (!res.ok) return signalAlert('error', data.message);
              signalAlert('success', 'Top-up completed.');
              setTopUp({ agentId: '', amount: '' });
              loadAll();
            }} className="form-layout">
              <select className="form-control" value={topUp.agentId} onChange={(e) => setTopUp({ ...topUp, agentId: e.target.value })}>
                <option value="">-- Agent --</option>
                {activeAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input className="form-control" type="number" step="0.01" value={topUp.amount} onChange={(e) => setTopUp({ ...topUp, amount: e.target.value })} placeholder="Amount" />
              <button type="submit" className="btn btn-primary">{tr('topUp')}</button>
            </form>
          </div>
        </div>
      )}

      {section === 'report' && (
        <div className="card fill-card">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr><th>{tr('voucherCode')}</th><th>{tr('amount')}</th><th>Agent</th><th>{tr('date')}</th><th>{tr('status')}</th></tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td className="copy-cell"><CopyButton text={v.code} /><span>{v.code}</span></td>
                    <td>${v.amount.toLocaleString()}</td>
                    <td>{v.agentName}</td>
                    <td>{new Date(v.createdAt).toLocaleString()}</td>
                    <td>{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === 'clients' && <ClientsPanel isOwner />}
      {section === 'inbox' && user && <InboxPanel currentUserId={user.id} />}

      {section === 'settings' && (
        <div className="card narrow-card">
          <div className="card-body">
            <form onSubmit={saveSettings} className="form-layout">
              <h4>{tr('ownerSettings')}</h4>
              <input className="form-control" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} placeholder="Display name" />
              <input className="form-control" value={settings.username} onChange={(e) => setSettings({ ...settings, username: e.target.value })} placeholder={tr('username')} />
              <input className="form-control" type="password" value={settings.password} onChange={(e) => setSettings({ ...settings, password: e.target.value })} placeholder="New password (optional)" />
              <hr />
              <h4>{tr('aboutSettings')}</h4>
              <input className="form-control" value={settings.aboutTitle || ''} onChange={(e) => setSettings({ ...settings, aboutTitle: e.target.value })} placeholder="About title" />
              <textarea className="form-control" rows={4} value={settings.aboutDescription || ''} onChange={(e) => setSettings({ ...settings, aboutDescription: e.target.value })} placeholder={tr('description')} />
              <textarea className="form-control" rows={3} value={settings.contactInfo || ''} onChange={(e) => setSettings({ ...settings, contactInfo: e.target.value })} placeholder={tr('contact')} />
              <input className="form-control" value={settings.location || ''} onChange={(e) => setSettings({ ...settings, location: e.target.value })} placeholder={tr('location')} />
              <input className="form-control" value={settings.slogan || ''} onChange={(e) => setSettings({ ...settings, slogan: e.target.value })} placeholder="Slogan" />
              <hr />
              <h4>{tr('downloadPortalSettings')}</h4>
              <input className="form-control" value={settings.downloadUsername || ''} onChange={(e) => setSettings({ ...settings, downloadUsername: e.target.value })} placeholder="Download username" />
              <input className="form-control" type="password" value={settings.downloadPassword} onChange={(e) => setSettings({ ...settings, downloadPassword: e.target.value })} placeholder="Download password (optional)" />
              <button type="submit" className="btn btn-primary">{tr('save')}</button>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

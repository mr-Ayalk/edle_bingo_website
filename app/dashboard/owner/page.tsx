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
  IconUpload,
  IconUsers,
} from '@/components/DashboardShell';
import AboutSection from '@/components/AboutSection';
import CopyButton from '@/components/CopyButton';
import InboxPanel from '@/components/InboxPanel';
import ClientsPanel from '@/components/ClientsPanel';
import OwnerSettingsPanel from '@/components/OwnerSettingsPanel';
import UploadsPanel from '@/components/UploadsPanel';
import FormField from '@/components/FormField';
import { BADGES } from '@/lib/constants';
import { formatBirr } from '@/lib/format';
import { toast } from '@/components/ToastProvider';
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
  gameAgentId: number | null;
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
  gameAgentId: '',
};

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [section, setSection] = useState('dashboard');
  const [agents, setAgents] = useState<User[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
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
      gameAgentId: agentForm.gameAgentId ? Number(agentForm.gameAgentId) : null,
    };
    if (!payload.name || !payload.username || (!agentForm.id && !payload.password)) {
      toast.error('Please complete required fields.');
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
    if (!res.ok) {
      toast.error(data.message);
      return;
    }
    toast.success(agentForm.id ? 'Agent updated.' : 'Agent created.');
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
    if (!ownerRes.ok || !appRes.ok) {
      toast.error('Unable to save settings.');
      return;
    }
    toast.success('Settings saved.');
    setSettings((s) => ({ ...s, password: '', downloadPassword: '' }));
    loadAll();
  };

  const navItems = [
    { id: 'dashboard', labelKey: 'dashboard' as const, icon: <IconHome />, heading: tr('overview') },
    { id: 'agents', labelKey: 'agents' as const, icon: <IconUsers />, heading: tr('management') },
    { id: 'topup', labelKey: 'topUp' as const, icon: <IconCard /> },
    { id: 'report', labelKey: 'reports' as const, icon: <IconReport /> },
    { id: 'clients', labelKey: 'clients' as const, icon: <IconClients /> },
    { id: 'uploads', labelKey: 'uploads' as const, icon: <IconUpload /> },
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
                <h2 className="metric-value">{formatBirr(activeAgents.reduce((s, a) => s + a.balance, 0))}</h2>
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
                        <td>{formatBirr(v.amount)}</td>
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
                    <div className="top-agent-balance">{formatBirr(agent.balance)}</div>
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
                      <td>{formatBirr(agent.balance)}</td>
                      <td>
                        <div className="table-actions agent-row-actions">
                          <button type="button" className="btn btn-light btn-sm" onClick={() => setAgentForm({ id: agent.id, name: agent.name, username: agent.username, password: '', phone: agent.phone, avatar: agent.avatar, badge: agent.badge, balance: String(agent.balance), gameAgentId: agent.gameAgentId != null ? String(agent.gameAgentId) : '' })}>Edit</button>
                          <button type="button" className="btn btn-light btn-sm text-danger" onClick={async () => { if (window.confirm('Delete agent?')) { await fetch(`/api/users/${agent.id}`, { method: 'DELETE' }); loadAll(); } }}>Delete</button>
                        </div>
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
                <FormField label={tr('fullName')}>
                  <input className="form-control" value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} />
                </FormField>
                <FormField label={tr('username')}>
                  <input className="form-control" value={agentForm.username} onChange={(e) => setAgentForm({ ...agentForm, username: e.target.value })} />
                </FormField>
                <FormField label="Password" hint={agentForm.id ? 'Leave blank to keep current password' : undefined}>
                  <input className="form-control" type="password" value={agentForm.password} onChange={(e) => setAgentForm({ ...agentForm, password: e.target.value })} />
                </FormField>
                <FormField label={tr('phone')}>
                  <input className="form-control" value={agentForm.phone} onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })} />
                </FormField>
                <FormField label="Badge">
                  <select className="form-control" value={agentForm.badge} onChange={(e) => setAgentForm({ ...agentForm, badge: e.target.value })}>
                    {BADGES.map((b) => <option key={b.value} value={b.value}>{`${b.value} ${b.label}`}</option>)}
                  </select>
                </FormField>
                <FormField label="Desktop Agent ID" hint="Must match Edle Bingo app agentId">
                  <input className="form-control" type="number" value={agentForm.gameAgentId} onChange={(e) => setAgentForm({ ...agentForm, gameAgentId: e.target.value })} />
                </FormField>
                <FormField label="Initial credit (Birr)">
                  <input className="form-control" type="number" value={agentForm.balance} onChange={(e) => setAgentForm({ ...agentForm, balance: e.target.value })} />
                </FormField>
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
              if (!res.ok) {
      toast.error(data.message);
      return;
    }
              toast.success('Top-up completed.');
              setTopUp({ agentId: '', amount: '' });
              loadAll();
            }} className="form-layout">
              <FormField label="Agent">
                <select className="form-control" value={topUp.agentId} onChange={(e) => setTopUp({ ...topUp, agentId: e.target.value })}>
                  <option value="">Select agent</option>
                  {activeAgents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </FormField>
              <FormField label="Amount (Birr)">
                <input className="form-control" type="number" step="0.01" value={topUp.amount} onChange={(e) => setTopUp({ ...topUp, amount: e.target.value })} />
              </FormField>
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
                    <td>{formatBirr(v.amount)}</td>
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
      {section === 'uploads' && <UploadsPanel />}
      {section === 'inbox' && user && <InboxPanel currentUserId={user.id} />}

      {section === 'settings' && (
        <OwnerSettingsPanel
          settings={settings}
          onChange={setSettings}
          onSave={saveSettings}
        />
      )}
    </DashboardShell>
  );
}

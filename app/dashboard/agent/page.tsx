'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell, {
  IconCard,
  IconClients,
  IconHome,
  IconInbox,
  IconPlus,
} from '@/components/DashboardShell';
import AboutSection from '@/components/AboutSection';
import CopyButton from '@/components/CopyButton';
import InboxPanel from '@/components/InboxPanel';
import ClientsPanel from '@/components/ClientsPanel';
import FormField from '@/components/FormField';
import { generateVoucherCode } from '@/lib/constants';
import { formatBirr } from '@/lib/format';
import { toast } from '@/components/ToastProvider';
import { useI18n } from '@/contexts/I18nContext';

type User = {
  id: number;
  name: string;
  username: string;
  avatar: string;
  badge: string;
  balance: number;
  role: string;
};

type Voucher = {
  id: number;
  code: string;
  amount: number;
  status: string;
  createdAt: string;
};

export default function AgentDashboardPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [section, setSection] = useState('dashboard');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
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
        if (!data.user || data.user.role !== 'AGENT') {
          router.replace('/');
          return;
        }
        setUser(data.user);
        loadVouchers();
      });
    fetch('/api/settings/public')
      .then((r) => r.json())
      .then(setAboutPublic)
      .catch(() => undefined);
  }, [router]);

  const loadVouchers = async () => {
    const res = await fetch('/api/vouchers');
    const data = await res.json();
    if (res.ok) {
      setVouchers(data.vouchers || []);
      if (data.balance !== undefined) {
        setUser((prev) => (prev ? { ...prev, balance: data.balance } : prev));
      }
    }
  };

  useEffect(() => {
    if (user) loadVouchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Number(amount),
        code: code.trim() || generateVoucherCode(),
      }),
    });
    const data = await res.json();
    if (!res.ok) return toast.error(data.message);
    setUser(data.user);
    toast.success('Voucher generated.');
    setAmount('');
    setCode('');
    setSection('dashboard');
    loadVouchers();
  };

  const navItems = [
    { id: 'dashboard', labelKey: 'dashboard' as const, icon: <IconHome />, heading: tr('agentTools') },
    { id: 'generate', labelKey: 'generateVoucher' as const, icon: <IconPlus /> },
    { id: 'clients', labelKey: 'clients' as const, icon: <IconClients /> },
    { id: 'inbox', labelKey: 'inbox' as const, icon: <IconInbox /> },
  ];

  if (!user) return null;

  return (
    <DashboardShell
      user={user}
      roleLabel={tr('bingoAgent')}
      section={section}
      onSectionChange={setSection}
      navItems={navItems}
      sectionTitle={section === 'generate' ? tr('generateVoucher') : tr('dashboard')}
      breadcrumb={`Agent / ${section}`}
      onLogout={logout}
    >
      {section === 'dashboard' && (
        <>
          <AboutSection {...aboutPublic} />
          <div className="dashboard-metrics">
            <div className="metric-card bg-gradient-info">
              <div className="metric-card-body">
                <h4 className="metric-title">{tr('yourCredit')}</h4>
                <h2 className="metric-value">{formatBirr(user.balance)}</h2>
              </div>
              <div className="circle-pattern" />
            </div>
            <div className="metric-card bg-gradient-success">
              <div className="metric-card-body">
                <h4 className="metric-title">Active Vouchers</h4>
                <h2 className="metric-value">{vouchers.filter((v) => v.status === 'active').length}</h2>
              </div>
              <div className="circle-pattern" />
            </div>
            <div className="metric-card bg-gradient-danger">
              <div className="metric-card-body">
                <h4 className="metric-title">{tr('voucherCode')}</h4>
                <h2 className="metric-value latest-code">{vouchers[0]?.code || '—'}</h2>
              </div>
              <div className="circle-pattern" />
            </div>
          </div>
          <div className="card fill-card">
            <div className="card-header"><h4 className="card-title">{tr('recentVouchers')}</h4></div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr><th>{tr('voucherCode')}</th><th>{tr('amount')}</th><th>{tr('date')}</th><th>{tr('status')}</th></tr>
                </thead>
                <tbody>
                  {vouchers.length ? vouchers.map((v) => (
                    <tr key={v.id}>
                      <td className="copy-cell"><CopyButton text={v.code} /><strong>{v.code}</strong></td>
                      <td>{formatBirr(v.amount)}</td>
                      <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                      <td><span className={`status-badge status-${v.status}`}>{v.status}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>{tr('noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {section === 'generate' && (
        <div className="card narrow-card">
          <div className="card-body">
            <form onSubmit={generate} className="form-layout">
              <FormField label={tr('yourCredit')}>
                <input className="form-control" readOnly value={formatBirr(user.balance)} />
              </FormField>
              <FormField label={tr('voucherAmount')}>
                <input className="form-control" type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </FormField>
              <FormField label={tr('customCode')}>
                <input className="form-control" value={code} onChange={(e) => setCode(e.target.value)} placeholder="391-143-6825" />
              </FormField>
              <button type="submit" className="btn btn-primary w-full">{tr('generateNow')}</button>
            </form>
          </div>
        </div>
      )}

      {section === 'clients' && <ClientsPanel isOwner={false} />}
      {section === 'inbox' && <InboxPanel currentUserId={user.id} />}
    </DashboardShell>
  );
}

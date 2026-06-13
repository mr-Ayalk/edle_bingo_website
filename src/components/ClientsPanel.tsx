'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { formatBirr } from '@/lib/format';
import FormField from '@/components/FormField';
import { toast } from '@/components/ToastProvider';

type Client = {
  id: number;
  fullName: string;
  phone: string;
  country: string;
  region: string;
  zone: string;
  city: string;
  town: string;
  wereda: string;
  kebele: string;
  addressDetail: string;
  packageAmount: number;
  agentName?: string;
};

const emptyForm = {
  id: null as number | null,
  fullName: '',
  phone: '',
  country: '',
  region: '',
  zone: '',
  city: '',
  town: '',
  wereda: '',
  kebele: '',
  addressDetail: '',
  packageAmount: '',
};

export default function ClientsPanel({ isOwner }: { isOwner: boolean }) {
  const { tr } = useI18n();
  const [clients, setClients] = useState<Client[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(data.clients || []);
    if (isOwner) setTotalSpent(data.totalSpent || 0);
  };

  useEffect(() => {
    load();
  }, [isOwner]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner && (!form.fullName || !form.phone)) {
      toast.error('Full name and phone are required.');
      return;
    }

    const payload = {
      fullName: form.fullName,
      phone: form.phone,
      country: form.country,
      region: form.region,
      zone: form.zone,
      city: form.city,
      town: form.town,
      wereda: form.wereda,
      kebele: form.kebele,
      addressDetail: form.addressDetail,
      packageAmount: Number(form.packageAmount) || 0,
    };

    const url = form.id ? `/api/clients/${form.id}` : '/api/clients';
    const method = form.id ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setForm(emptyForm);
      load();
      toast.success(form.id ? 'Client updated.' : 'Client added.');
    } else {
      const data = await res.json();
      toast.error(data.message || 'Failed to save.');
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this client?')) return;
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (res.ok) {
      load();
      toast.success('Client deleted.');
    } else {
      toast.error('Could not delete client.');
    }
  };

  const edit = (client: Client) => {
    setForm({
      id: client.id,
      fullName: client.fullName,
      phone: client.phone,
      country: client.country,
      region: client.region,
      zone: client.zone,
      city: client.city,
      town: client.town,
      wereda: client.wereda,
      kebele: client.kebele,
      addressDetail: client.addressDetail,
      packageAmount: String(client.packageAmount),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const set = (patch: Partial<typeof emptyForm>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="clients-panel">
      {isOwner && (
        <div className="metric-card bg-gradient-info owner-total-spent">
          <div className="metric-card-body">
            <h4 className="metric-title">{tr('totalSpent')}</h4>
            <h2 className="metric-value">{formatBirr(totalSpent)}</h2>
          </div>
        </div>
      )}

      {!isOwner && (
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">{form.id ? tr('editClient') : tr('addClient')}</h4>
          </div>
          <div className="card-body">
            <form onSubmit={save} className="client-form-grid">
              <FormField label={tr('fullName')}>
                <input className="form-control" value={form.fullName} onChange={(e) => set({ fullName: e.target.value })} required />
              </FormField>
              <FormField label={tr('phone')}>
                <input className="form-control" value={form.phone} onChange={(e) => set({ phone: e.target.value })} required />
              </FormField>
              <FormField label={tr('country')}>
                <input className="form-control" value={form.country} onChange={(e) => set({ country: e.target.value })} />
              </FormField>
              <FormField label={tr('region')}>
                <input className="form-control" value={form.region} onChange={(e) => set({ region: e.target.value })} />
              </FormField>
              <FormField label={tr('zone')}>
                <input className="form-control" value={form.zone} onChange={(e) => set({ zone: e.target.value })} />
              </FormField>
              <FormField label={tr('city')}>
                <input className="form-control" value={form.city} onChange={(e) => set({ city: e.target.value })} />
              </FormField>
              <FormField label={tr('town')}>
                <input className="form-control" value={form.town} onChange={(e) => set({ town: e.target.value })} />
              </FormField>
              <FormField label={tr('wereda')}>
                <input className="form-control" value={form.wereda} onChange={(e) => set({ wereda: e.target.value })} />
              </FormField>
              <FormField label={tr('kebele')}>
                <input className="form-control" value={form.kebele} onChange={(e) => set({ kebele: e.target.value })} />
              </FormField>
              <FormField label={tr('addressDetail')}>
                <input className="form-control" value={form.addressDetail} onChange={(e) => set({ addressDetail: e.target.value })} />
              </FormField>
              <FormField label={tr('packageAmount')}>
                <input className="form-control" type="number" step="0.01" value={form.packageAmount} onChange={(e) => set({ packageAmount: e.target.value })} />
              </FormField>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">{tr('save')}</button>
                {form.id && <button type="button" className="btn btn-light" onClick={() => setForm(emptyForm)}>{tr('cancel')}</button>}
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card fill-card clients-table">
        <div className="card-header"><h4 className="card-title">{tr('clients')}</h4></div>
        <p className="table-scroll-hint">Swipe horizontally to see all columns</p>
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>{tr('fullName')}</th>
                <th>{tr('phone')}</th>
                {isOwner && <th>Agent</th>}
                <th>{tr('country')}</th>
                <th>{tr('region')}</th>
                <th>{tr('zone')}</th>
                <th>{tr('city')}</th>
                <th>{tr('town')}</th>
                <th>{tr('wereda')}</th>
                <th>{tr('kebele')}</th>
                <th>{tr('addressDetail')}</th>
                <th>{tr('packageAmount')}</th>
                {!isOwner && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {clients.length ? clients.map((c) => (
                <tr key={c.id}>
                  <td title={c.fullName}>{c.fullName}</td>
                  <td>{c.phone}</td>
                  {isOwner && <td>{c.agentName || '—'}</td>}
                  <td>{c.country || '—'}</td>
                  <td>{c.region || '—'}</td>
                  <td>{c.zone || '—'}</td>
                  <td>{c.city || '—'}</td>
                  <td>{c.town || '—'}</td>
                  <td>{c.wereda || '—'}</td>
                  <td>{c.kebele || '—'}</td>
                  <td title={c.addressDetail}>{c.addressDetail || '—'}</td>
                  <td>{formatBirr(c.packageAmount)}</td>
                  {!isOwner && (
                    <td className="table-actions">
                      <button type="button" className="btn btn-light btn-sm" onClick={() => edit(c)}>Edit</button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(c.id)}>{tr('deleteClient')}</button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={isOwner ? 12 : 13}>{tr('noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

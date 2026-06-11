'use client';

import { useI18n } from '@/contexts/I18nContext';
import FormField from '@/components/FormField';
import { toast } from '@/components/ToastProvider';

type SettingsState = {
  name: string;
  username: string;
  password: string;
  aboutTitle: string;
  aboutDescription: string;
  contactInfo: string;
  location: string;
  slogan: string;
  downloadUsername: string;
  downloadPassword: string;
};

type OwnerSettingsPanelProps = {
  settings: SettingsState;
  onChange: (settings: SettingsState) => void;
  onSave: (e: React.FormEvent) => Promise<void>;
};

export default function OwnerSettingsPanel({ settings, onChange, onSave }: OwnerSettingsPanelProps) {
  const { tr } = useI18n();
  const set = (patch: Partial<SettingsState>) => onChange({ ...settings, ...patch });

  return (
    <div className="settings-page">
      <form onSubmit={onSave} className="settings-grid">
        <section className="settings-card settings-card-accent">
          <div className="settings-card-header">
            <div className="settings-card-icon">🔐</div>
            <div>
              <h3>{tr('ownerSettings')}</h3>
              <p>Update your administrator login credentials</p>
            </div>
          </div>
          <div className="settings-card-body">
            <FormField label="Display name">
              <input className="form-control" value={settings.name} onChange={(e) => set({ name: e.target.value })} />
            </FormField>
            <FormField label={tr('username')}>
              <input className="form-control" value={settings.username} onChange={(e) => set({ username: e.target.value })} autoComplete="username" />
            </FormField>
            <FormField label="New password" hint="Leave blank to keep current password">
              <input className="form-control" type="password" value={settings.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
            </FormField>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">📋</div>
            <div>
              <h3>{tr('aboutSettings')}</h3>
              <p>Content shown on owner and agent dashboards</p>
            </div>
          </div>
          <div className="settings-card-body">
            <FormField label="About title">
              <input className="form-control" value={settings.aboutTitle} onChange={(e) => set({ aboutTitle: e.target.value })} />
            </FormField>
            <FormField label={tr('description')}>
              <textarea className="form-control" rows={4} value={settings.aboutDescription} onChange={(e) => set({ aboutDescription: e.target.value })} />
            </FormField>
            <FormField label={tr('contact')}>
              <textarea className="form-control" rows={3} value={settings.contactInfo} onChange={(e) => set({ contactInfo: e.target.value })} />
            </FormField>
            <FormField label={tr('location')}>
              <input className="form-control" value={settings.location} onChange={(e) => set({ location: e.target.value })} />
            </FormField>
            <FormField label="Slogan">
              <input className="form-control" value={settings.slogan} onChange={(e) => set({ slogan: e.target.value })} />
            </FormField>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">⬇️</div>
            <div>
              <h3>{tr('downloadPortalSettings')}</h3>
              <p>Credentials for software download access</p>
            </div>
          </div>
          <div className="settings-card-body">
            <FormField label="Download username">
              <input className="form-control" value={settings.downloadUsername} onChange={(e) => set({ downloadUsername: e.target.value })} />
            </FormField>
            <FormField label="Download password" hint="Leave blank to keep current password">
              <input className="form-control" type="password" value={settings.downloadPassword} onChange={(e) => set({ downloadPassword: e.target.value })} />
            </FormField>
          </div>
        </section>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary btn-lg">{tr('save')}</button>
        </div>
      </form>
    </div>
  );
}

export { toast };

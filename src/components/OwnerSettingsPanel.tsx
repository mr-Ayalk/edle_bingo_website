'use client';

import { useI18n } from '@/contexts/I18nContext';
import FormField from '@/components/FormField';

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
              <p>{tr('ownerSettingsDesc')}</p>
            </div>
          </div>
          <div className="settings-card-body">
            <FormField label={tr('displayName')}>
              <input className="form-control" value={settings.name} onChange={(e) => set({ name: e.target.value })} />
            </FormField>
            <FormField label={tr('username')}>
              <input className="form-control" value={settings.username} onChange={(e) => set({ username: e.target.value })} autoComplete="username" />
            </FormField>
            <FormField label={tr('newPassword')} hint={tr('leavePasswordBlank')}>
              <input className="form-control" type="password" value={settings.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
            </FormField>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">📋</div>
            <div>
              <h3>{tr('aboutSettings')}</h3>
              <p>{tr('aboutSettingsDesc')}</p>
            </div>
          </div>
          <div className="settings-card-body">
            <FormField label={tr('aboutTitle')}>
              <input className="form-control" value={settings.aboutTitle} onChange={(e) => set({ aboutTitle: e.target.value })} />
            </FormField>
            <FormField label={tr('description')} hint={tr('paragraphHint')}>
              <textarea className="form-control" rows={4} value={settings.aboutDescription} onChange={(e) => set({ aboutDescription: e.target.value })} />
            </FormField>
            <FormField label={tr('contact')}>
              <textarea className="form-control" rows={3} value={settings.contactInfo} onChange={(e) => set({ contactInfo: e.target.value })} />
            </FormField>
            <FormField label={tr('location')}>
              <input className="form-control" value={settings.location} onChange={(e) => set({ location: e.target.value })} />
            </FormField>
            <FormField label={tr('slogan')}>
              <input className="form-control" value={settings.slogan} onChange={(e) => set({ slogan: e.target.value })} />
            </FormField>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">⬇️</div>
            <div>
              <h3>{tr('downloadPortalSettings')}</h3>
              <p>{tr('downloadPortalDesc')}</p>
            </div>
          </div>
          <div className="settings-card-body">
            <FormField label={tr('downloadUsername')}>
              <input className="form-control" value={settings.downloadUsername} onChange={(e) => set({ downloadUsername: e.target.value })} />
            </FormField>
            <FormField label={tr('downloadPassword')} hint={tr('leavePasswordBlank')}>
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

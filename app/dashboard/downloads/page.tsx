'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/contexts/I18nContext';

type DownloadItem = {
  id: string;
  name: string;
  description: string;
  file: string;
};

export default function DownloadsPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'DOWNLOADER') router.replace('/');
      });
    fetch('/api/downloads')
      .then((r) => r.json())
      .then((data) => setDownloads(data.downloads || []))
      .catch(() => undefined);
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="downloads-page">
      <header className="downloads-header">
        <h1>{tr('downloadFiles')}</h1>
        <button type="button" className="btn btn-light" onClick={logout}>{tr('logout')}</button>
      </header>
      <div className="downloads-grid">
        {downloads.map((item) => (
          <div key={item.id} className="card download-card">
            <div className="card-body">
              <h3>{item.name}</h3>
              <p className="text-muted">{item.description}</p>
              <a href={item.file} download className="btn btn-primary">
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
      <p className="downloads-note text-muted">
        Place <strong>EDLE_BINGO.exe</strong> and the Node.js installer in the <code>public/downloads/</code> folder on the server.
      </p>
    </div>
  );
}

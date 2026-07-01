'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DownloadCategory } from '@prisma/client';
import { Download } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import { formatFileSize, getLocalizedCategory } from '@/lib/download-categories';

type DownloadFile = {
  id: number;
  name: string;
  description: string;
  fileName: string;
  file: string;
  fileSize: number;
};

type DownloadGroup = {
  category: DownloadCategory;
  files: DownloadFile[];
};

export default function DownloadsPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [groups, setGroups] = useState<DownloadGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (!data.user || data.user.role !== 'DOWNLOADER') router.replace('/');
      });
    fetch('/api/downloads')
      .then((r) => r.json())
      .then((data) => setGroups(data.downloads || []))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [router]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="downloads-page">
      <header className="downloads-header">
        <div>
          <h1>{tr('downloadFiles')}</h1>
          <p className="text-muted downloads-subtitle">{tr('downloadsSubtitle')}</p>
        </div>
        <button type="button" className="btn btn-light" onClick={logout}>{tr('logout')}</button>
      </header>

      {loading ? (
        <p className="text-muted">{tr('loadingFiles')}</p>
      ) : groups.length === 0 ? (
        <div className="card">
          <div className="card-body downloads-empty">
            <p className="text-muted">{tr('noDownloadsAvailable')}</p>
          </div>
        </div>
      ) : (
        <div className="downloads-sections">
          {groups.map((group) => {
            const meta = getLocalizedCategory(group.category, tr);
            return (
              <section key={group.category} className="downloads-section card">
                <div className="card-header downloads-section-header">
                  <span className="downloads-section-icon">{meta.icon}</span>
                  <div>
                    <h3 className="card-title">{meta.label}</h3>
                    <p className="text-muted text-xs">{meta.description}</p>
                  </div>
                </div>
                <div className="card-body downloads-section-body">
                  {group.files.map((item) => (
                    <div key={item.id} className="download-item">
                      <div className="download-item-info">
                        <h4>{item.name}</h4>
                        {item.description && <p className="text-muted">{item.description}</p>}
                        <small className="text-muted">{item.fileName} · {formatFileSize(item.fileSize)}</small>
                      </div>
                      <a href={item.file} download className="btn btn-primary btn-sm download-item-btn">
                        <Download size={15} /> {tr('download')}
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import type { DownloadCategory } from '@prisma/client';
import { Eye, EyeOff, Pencil, Trash2, Upload } from 'lucide-react';
import FormField from '@/components/FormField';
import { toast } from '@/components/ToastProvider';
import { useI18n } from '@/contexts/I18nContext';
import {
  DOWNLOAD_CATEGORIES,
  formatFileSize,
  getLocalizedCategory,
} from '@/lib/download-categories';

type Asset = {
  id: number;
  category: DownloadCategory;
  name: string;
  description: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  visible: boolean;
  createdAt: string;
};

type EditState = { id: number; name: string; description: string } | null;

const emptyUpload = { name: '', description: '', visible: true };

export default function UploadsPanel() {
  const { tr } = useI18n();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeCategory, setActiveCategory] = useState<DownloadCategory>('SETUP');
  const [uploadForms, setUploadForms] = useState<Record<string, typeof emptyUpload & { file: File | null }>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>(null);

  const load = async () => {
    const res = await fetch('/api/uploads');
    const data = await res.json();
    if (res.ok) setAssets(data.assets || []);
  };

  useEffect(() => {
    load();
  }, []);

  const getForm = (cat: DownloadCategory) =>
    uploadForms[cat] ?? { ...emptyUpload, file: null };

  const setForm = (cat: DownloadCategory, patch: Partial<ReturnType<typeof getForm>>) => {
    setUploadForms((prev) => ({
      ...prev,
      [cat]: { ...getForm(cat), ...patch },
    }));
  };

  const categoryAssets = assets.filter((a) => a.category === activeCategory);
  const meta = getLocalizedCategory(activeCategory, tr);
  const atLimit = meta.maxFiles !== null && categoryAssets.length >= meta.maxFiles;
  const form = getForm(activeCategory);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) {
      toast.error(tr('selectFileRequired'));
      return;
    }
    if (!form.name.trim()) {
      toast.error(tr('displayNameRequired'));
      return;
    }

    setUploading(activeCategory);
    const body = new FormData();
    body.append('category', activeCategory);
    body.append('name', form.name.trim());
    body.append('description', form.description);
    body.append('visible', String(form.visible));
    body.append('file', form.file);

    try {
      const res = await fetch('/api/uploads', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || tr('uploadFailed'));
        return;
      }
      toast.success(tr('fileUploaded'));
      setForm(activeCategory, { name: '', description: '', file: null, visible: true });
      const input = document.getElementById(`file-${activeCategory}`) as HTMLInputElement | null;
      if (input) input.value = '';
      load();
    } catch {
      toast.error(tr('uploadFailed'));
    } finally {
      setUploading(null);
    }
  };

  const toggleVisible = async (asset: Asset) => {
    const res = await fetch(`/api/uploads/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: !asset.visible }),
    });
    if (res.ok) {
      toast.success(asset.visible ? tr('visibilityHidden') : tr('visibilityShown'));
      load();
    } else {
      toast.error(tr('couldNotUpdateVisibility'));
    }
  };

  const saveEdit = async () => {
    if (!edit) return;
    const res = await fetch(`/api/uploads/${edit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: edit.name, description: edit.description }),
    });
    if (res.ok) {
      toast.success(tr('updated'));
      setEdit(null);
      load();
    } else {
      toast.error(tr('couldNotSave'));
    }
  };

  const remove = async (asset: Asset) => {
    if (!window.confirm(`${tr('deleteClient')} "${asset.name}"?`)) return;
    const res = await fetch(`/api/uploads/${asset.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success(tr('fileDeleted'));
      load();
    } else {
      toast.error(tr('couldNotDeleteFile'));
    }
  };

  return (
    <div className="uploads-panel">
      <div className="uploads-intro card">
        <div className="card-body">
          <h3>{tr('uploadPortalTitle')}</h3>
          <p className="text-muted">{tr('uploadPortalDesc')}</p>
        </div>
      </div>

      <div className="uploads-category-tabs">
        {DOWNLOAD_CATEGORIES.map((cat) => {
          const localized = getLocalizedCategory(cat.id, tr);
          const count = assets.filter((a) => a.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              className={`uploads-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="uploads-tab-icon">{cat.icon}</span>
              <span className="uploads-tab-label">{localized.label}</span>
              {count > 0 && <span className="uploads-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="uploads-category-panel card">
        <div className="card-header uploads-category-header">
          <div>
            <h4 className="card-title">{meta.icon} {meta.label}</h4>
            <p className="text-muted text-xs">{meta.hint}</p>
          </div>
          <span className="uploads-limit-badge">
            {categoryAssets.length}{meta.maxFiles !== null ? ` / ${meta.maxFiles}` : ''} {tr('files')}
          </span>
        </div>

        <div className="card-body">
          {!atLimit && (
            <form onSubmit={handleUpload} className="uploads-form">
              <div className="uploads-form-grid">
                <FormField label={tr('displayName')}>
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm(activeCategory, { name: e.target.value })}
                    placeholder={meta.label}
                  />
                </FormField>
                <FormField label={tr('description')}>
                  <input
                    className="form-control"
                    value={form.description}
                    onChange={(e) => setForm(activeCategory, { description: e.target.value })}
                    placeholder={tr('descriptionPlaceholder')}
                  />
                </FormField>
                <FormField
                  label={tr('uploadFile')}
                  hint={`${tr('accepted')}: ${meta.extensions.join(', ')} · ${tr('maxSize')} ${meta.maxSizeMb} MB`}
                >
                  <input
                    id={`file-${activeCategory}`}
                    type="file"
                    className="form-control"
                    accept={meta.accept}
                    onChange={(e) => setForm(activeCategory, { file: e.target.files?.[0] || null })}
                  />
                </FormField>
                <label className="uploads-visible-check">
                  <input
                    type="checkbox"
                    checked={form.visible}
                    onChange={(e) => setForm(activeCategory, { visible: e.target.checked })}
                  />
                  {tr('visibleOnDownloads')}
                </label>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading === activeCategory}
              >
                <Upload size={16} />
                {uploading === activeCategory ? tr('uploading') : tr('uploadFile')}
              </button>
            </form>
          )}

          {atLimit && (
            <p className="uploads-limit-msg text-muted">{tr('maxFilesReached')}</p>
          )}

          <div className="uploads-file-list">
            {categoryAssets.length === 0 ? (
              <p className="text-muted uploads-empty">{tr('noFilesInCategory')}</p>
            ) : (
              categoryAssets.map((asset) => (
                <div key={asset.id} className={`uploads-file-item ${asset.visible ? '' : 'hidden-file'}`}>
                  {edit?.id === asset.id ? (
                    <div className="uploads-edit-form">
                      <FormField label={tr('displayName')}>
                        <input
                          className="form-control"
                          value={edit.name}
                          onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                        />
                      </FormField>
                      <FormField label={tr('description')}>
                        <input
                          className="form-control"
                          value={edit.description}
                          onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                        />
                      </FormField>
                      <div className="table-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>{tr('save')}</button>
                        <button type="button" className="btn btn-light btn-sm" onClick={() => setEdit(null)}>{tr('cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="uploads-file-info">
                        <strong>{asset.name}</strong>
                        {asset.description && <p className="text-muted">{asset.description}</p>}
                        <small className="text-muted">
                          {asset.fileName} · {formatFileSize(asset.fileSize)} · {new Date(asset.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="uploads-file-actions">
                        <button
                          type="button"
                          className={`btn btn-sm ${asset.visible ? 'btn-light' : 'btn-light uploads-hidden-btn'}`}
                          title={asset.visible ? tr('hideFromDownloads') : tr('showOnDownloads')}
                          onClick={() => toggleVisible(asset)}
                        >
                          {asset.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                          {asset.visible ? tr('visible') : tr('hidden')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => setEdit({ id: asset.id, name: asset.name, description: asset.description })}
                        >
                          <Pencil size={15} /> {tr('edit')}
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(asset)}>
                          <Trash2 size={15} /> {tr('deleteClient')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

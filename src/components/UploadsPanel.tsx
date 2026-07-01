'use client';

import { useEffect, useState } from 'react';
import type { DownloadCategory } from '@prisma/client';
import { Eye, EyeOff, Pencil, Trash2, Upload } from 'lucide-react';
import FormField from '@/components/FormField';
import { toast } from '@/components/ToastProvider';
import {
  DOWNLOAD_CATEGORIES,
  formatFileSize,
  getCategoryMeta,
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
  const meta = getCategoryMeta(activeCategory);
  const atLimit = meta.maxFiles !== null && categoryAssets.length >= meta.maxFiles;
  const form = getForm(activeCategory);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) {
      toast.error('Please select a file.');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Display name is required.');
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
        toast.error(data.message || 'Upload failed.');
        return;
      }
      toast.success('File uploaded.');
      setForm(activeCategory, { name: '', description: '', file: null, visible: true });
      const input = document.getElementById(`file-${activeCategory}`) as HTMLInputElement | null;
      if (input) input.value = '';
      load();
    } catch {
      toast.error('Upload failed. Check file size and connection.');
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
      toast.success(asset.visible ? 'Hidden from downloads page.' : 'Now visible on downloads page.');
      load();
    } else {
      toast.error('Could not update visibility.');
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
      toast.success('Updated.');
      setEdit(null);
      load();
    } else {
      toast.error('Could not save changes.');
    }
  };

  const remove = async (asset: Asset) => {
    if (!window.confirm(`Delete "${asset.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/uploads/${asset.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('File deleted.');
      load();
    } else {
      toast.error('Could not delete file.');
    }
  };

  return (
    <div className="uploads-panel">
      <div className="uploads-intro card">
        <div className="card-body">
          <h3>Download Portal Files</h3>
          <p className="text-muted">
            Upload files for the download portal. Toggle visibility to control what download users can see.
            Hidden files stay saved but won&apos;t appear on the downloads page.
          </p>
        </div>
      </div>

      <div className="uploads-category-tabs">
        {DOWNLOAD_CATEGORIES.map((cat) => {
          const count = assets.filter((a) => a.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              className={`uploads-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span className="uploads-tab-icon">{cat.icon}</span>
              <span className="uploads-tab-label">{cat.label}</span>
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
            {categoryAssets.length}{meta.maxFiles !== null ? ` / ${meta.maxFiles}` : ''} files
          </span>
        </div>

        <div className="card-body">
          {!atLimit && (
            <form onSubmit={handleUpload} className="uploads-form">
              <div className="uploads-form-grid">
                <FormField label="Display name">
                  <input
                    className="form-control"
                    value={form.name}
                    onChange={(e) => setForm(activeCategory, { name: e.target.value })}
                    placeholder={`e.g. ${meta.label} file`}
                  />
                </FormField>
                <FormField label="Description">
                  <input
                    className="form-control"
                    value={form.description}
                    onChange={(e) => setForm(activeCategory, { description: e.target.value })}
                    placeholder="Short description for download users"
                  />
                </FormField>
                <FormField label="File" hint={`Accepted: ${meta.extensions.join(', ')} · Max ${meta.maxSizeMb} MB`}>
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
                  Visible on downloads page
                </label>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading === activeCategory}
              >
                <Upload size={16} />
                {uploading === activeCategory ? 'Uploading…' : 'Upload file'}
              </button>
            </form>
          )}

          {atLimit && (
            <p className="uploads-limit-msg text-muted">
              Maximum files reached for this category. Delete an existing file to upload a new one.
            </p>
          )}

          <div className="uploads-file-list">
            {categoryAssets.length === 0 ? (
              <p className="text-muted uploads-empty">No files uploaded in this category yet.</p>
            ) : (
              categoryAssets.map((asset) => (
                <div key={asset.id} className={`uploads-file-item ${asset.visible ? '' : 'hidden-file'}`}>
                  {edit?.id === asset.id ? (
                    <div className="uploads-edit-form">
                      <FormField label="Display name">
                        <input
                          className="form-control"
                          value={edit.name}
                          onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Description">
                        <input
                          className="form-control"
                          value={edit.description}
                          onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                        />
                      </FormField>
                      <div className="table-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
                        <button type="button" className="btn btn-light btn-sm" onClick={() => setEdit(null)}>Cancel</button>
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
                          title={asset.visible ? 'Hide from downloads' : 'Show on downloads'}
                          onClick={() => toggleVisible(asset)}
                        >
                          {asset.visible ? <Eye size={15} /> : <EyeOff size={15} />}
                          {asset.visible ? 'Visible' : 'Hidden'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-light btn-sm"
                          onClick={() => setEdit({ id: asset.id, name: asset.name, description: asset.description })}
                        >
                          <Pencil size={15} /> Edit
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(asset)}>
                          <Trash2 size={15} /> Delete
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

'use client';

import { useEffect, useRef, useState } from 'react';
import { FONT_OPTIONS, STICKERS } from '@/lib/constants';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/ToastProvider';

type ChatUser = { id: number; name: string; username: string; avatar?: string };

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  fontFamily: string;
  imageUrl?: string | null;
  sticker?: string | null;
  createdAt: string;
};

export default function InboxPanel({ currentUserId }: { currentUserId: number }) {
  const { tr } = useI18n();
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [sticker, setSticker] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectedIdRef = useRef<number | null>(null);
  selectedIdRef.current = selectedId;

  const selectedContact = contacts.find((c) => c.id === selectedId);

  const loadContacts = async () => {
    const res = await fetch('/api/messages');
    const data = await res.json();
    const agents: ChatUser[] = data.agents || [];
    setContacts(agents);
    setSelectedId((prev) => {
      if (prev !== null && agents.some((a) => a.id === prev)) return prev;
      return agents[0]?.id ?? null;
    });
  };

  const loadMessages = async (withUserId: number) => {
    const res = await fetch(`/api/messages?withUserId=${withUserId}`);
    const data = await res.json();
    setMessages(data.messages || []);
  };

  useEffect(() => {
    loadContacts();
    const interval = window.setInterval(loadContacts, 8000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const interval = window.setInterval(() => {
      const id = selectedIdRef.current;
      if (id) loadMessages(id);
    }, 4000);
    return () => window.clearInterval(interval);
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectContact = (id: number) => {
    setSelectedId(id);
    setMobileShowChat(true);
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) return;

    const form = new FormData();
    form.append('receiverId', String(selectedId));
    form.append('content', content);
    form.append('fontFamily', fontFamily);
    if (sticker) form.append('sticker', sticker);
    if (imageFile) form.append('image', imageFile);

    const res = await fetch('/api/messages', { method: 'POST', body: form });
    if (res.ok) {
      setContent('');
      setSticker('');
      setImageFile(null);
      loadMessages(selectedId);
      toast.success('Message sent');
    } else {
      toast.error('Failed to send message');
    }
  };

  const deleteMessage = async (id: number) => {
    if (!window.confirm('Delete this message?')) return;
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Message deleted');
      if (selectedId) loadMessages(selectedId);
    } else {
      toast.error('Could not delete message');
    }
  };

  const saveEdit = async (id: number) => {
    const res = await fetch(`/api/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent, fontFamily }),
    });
    if (res.ok) {
      toast.success('Message updated');
      setEditingId(null);
      if (selectedId) loadMessages(selectedId);
    } else {
      toast.error('Could not update message');
    }
  };

  return (
    <div className={`inbox-layout ${mobileShowChat ? 'inbox-show-chat' : 'inbox-show-contacts'}`}>
      <aside className="inbox-contacts">
        <h4>{tr('inbox')}</h4>
        {contacts.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`inbox-contact ${selectedId === c.id ? 'active' : ''}`}
            onClick={() => selectContact(c.id)}
          >
            <span className="inbox-avatar">{c.avatar || '👤'}</span>
            <span className="inbox-contact-name">{c.name}</span>
          </button>
        ))}
      </aside>

      <div className="inbox-chat">
        {!selectedId ? (
          <div className="inbox-chat-header">{tr('selectAgent')}</div>
        ) : (
          <>
            <div className="inbox-chat-header">
              <button
                type="button"
                className="inbox-back-btn"
                aria-label="Back to contacts"
                onClick={() => setMobileShowChat(false)}
              >
                ←
              </button>
              <span>{selectedContact?.name || tr('inbox')}</span>
            </div>
            <div className="inbox-messages">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`inbox-message ${m.senderId === currentUserId ? 'mine' : 'theirs'}`}
                  style={{ fontFamily: m.fontFamily }}
                >
                  {editingId === m.id ? (
                    <div className="inbox-edit-area">
                      <textarea
                        className="form-control"
                        rows={3}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{ fontFamily: m.fontFamily }}
                      />
                      <div className="form-actions">
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => saveEdit(m.id)}>{tr('save')}</button>
                        <button type="button" className="btn btn-light btn-sm" onClick={() => setEditingId(null)}>{tr('cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {m.sticker && <span className="inbox-sticker">{m.sticker}</span>}
                      {m.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt="attachment" className="inbox-image" />
                      )}
                      {m.content && <p>{m.content}</p>}
                      <small>{new Date(m.createdAt).toLocaleString()}</small>
                      {m.senderId === currentUserId && (
                        <div className="inbox-message-actions">
                          <button
                            type="button"
                            className="btn btn-light btn-sm"
                            onClick={() => { setEditingId(m.id); setEditContent(m.content); }}
                          >
                            Edit
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteMessage(m.id)}>
                            {tr('deleteClient')}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={sendMessage} className="inbox-compose">
              <div className="inbox-toolbar">
                <select className="form-control" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                  {FONT_OPTIONS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
                <div className="sticker-row">
                  {STICKERS.slice(0, 8).map((s) => (
                    <button key={s} type="button" className={`sticker-btn ${sticker === s ? 'active' : ''}`} onClick={() => setSticker(s === sticker ? '' : s)}>
                      {s}
                    </button>
                  ))}
                </div>
                <label className="file-label">
                  {tr('attachImage')}
                  <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </label>
                {imageFile && <span className="text-xs text-muted">{imageFile.name}</span>}
              </div>
              <textarea
                className="form-control"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={tr('typeMessage')}
                rows={3}
                style={{ fontFamily }}
              />
              <button type="submit" className="btn btn-primary w-full">{tr('sendMessage')}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

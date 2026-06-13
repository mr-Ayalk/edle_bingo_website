'use client';

import { useI18n } from '@/contexts/I18nContext';

type AboutProps = {
  title?: string;
  description?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  contactInfo: string;
  location: string;
};

/** Split text into paragraphs on blank lines (empty line between blocks). */
function toParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
}

export default function AboutSection({
  title,
  description,
  aboutTitle,
  aboutDescription,
  contactInfo,
  location,
}: AboutProps) {
  const { tr } = useI18n();
  const displayTitle = title ?? aboutTitle ?? '';
  const displayDescription = description ?? aboutDescription ?? '';
  const paragraphs = toParagraphs(displayDescription);

  return (
    <div className="card about-card">
      <div className="card-header">
        <h4 className="card-title">{tr('aboutUs')}</h4>
      </div>
      <div className="card-body about-body">
        <h3>{displayTitle}</h3>
        {paragraphs.length > 0 ? (
          <div className="about-description">
            {paragraphs.map((para, index) => (
              <p key={index}>{para}</p>
            ))}
          </div>
        ) : null}
        <div className="about-grid">
          <div>
            <strong>{tr('contact')}</strong>
            <pre className="about-pre">{contactInfo}</pre>
          </div>
          <div>
            <strong>{tr('location')}</strong>
            <p>{location}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div className="card about-card">
      <div className="card-header">
        <h4 className="card-title">{tr('aboutUs')}</h4>
      </div>
      <div className="card-body about-body">
        <h3>{displayTitle}</h3>
        <p>{displayDescription}</p>
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

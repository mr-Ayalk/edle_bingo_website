'use client';

import { useEffect, useState } from 'react';
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/format';
import { useI18n } from '@/contexts/I18nContext';

type ClientDateProps = {
  iso: string;
  mode?: 'date' | 'datetime';
};

/** Avoid hydration mismatch from locale/timezone differences during SSR. */
export default function ClientDate({ iso, mode = 'date' }: ClientDateProps) {
  const { locale } = useI18n();
  const [text, setText] = useState('');

  useEffect(() => {
    setText(
      mode === 'datetime'
        ? formatDisplayDateTime(iso, locale)
        : formatDisplayDate(iso, locale),
    );
  }, [iso, mode, locale]);

  return <span suppressHydrationWarning>{text || '—'}</span>;
}

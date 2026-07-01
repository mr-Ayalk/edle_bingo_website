import { NextResponse } from 'next/server';
import { getPublicSettings } from '@/lib/settings';

const FALLBACK = {
  aboutTitle: '',
  aboutDescription: '',
  contactInfo: '+251951818822\n+251723358806',
  location: '',
  slogan: 'EVERY DRAW OF PATTERN IS LUCKY ENCOUNTER',
};

export async function GET() {
  try {
    const settings = await getPublicSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Public settings error:', error);
    return NextResponse.json(FALLBACK);
  }
}

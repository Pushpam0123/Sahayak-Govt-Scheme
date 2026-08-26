'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSahayak } from '../../../hooks/useSahayak';
import { useLang } from '../../../lib/theme';
import { TRANSLATIONS } from '../../../lib/i18n';
import { ChatView } from '../../../components/chat/ChatView';

function ChatContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('query') || undefined;

  const { lang } = useLang();
  const t = TRANSLATIONS[lang];
  const { schemes, offline } = useSahayak();

  return (
    <ChatView
      t={t}
      lang={lang}
      schemes={schemes}
      offline={offline}
      initialQuery={initialQuery}
    />
  );
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-3" />
          <p className="text-sm">Loading chat assistant…</p>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

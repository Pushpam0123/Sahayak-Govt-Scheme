// Grounded Q&A surface: filters, message thread, suggested prompts, input,
// and the citation inspector.
import { useEffect, useMemo, useRef, useState } from 'react';
import { askChat } from '../../lib/api';
import { demoChat, SUGGESTED_PROMPTS_EN, SUGGESTED_PROMPTS_HI } from '../../lib/demo';
import type { Dict, Lang } from '../../lib/i18n';
import { INDIAN_STATES, SCHEME_CATEGORIES } from '../../lib/i18n';
import type {
  ChatMessage,
  CitationInfo,
  SchemeInfo,
} from '../../lib/types';
import { Button, Card, Field, Select, Spinner, TextInput } from '../ui';
import { SendIcon, SparkIcon } from '../icons';
import { CitationInspector } from './CitationInspector';
import { MessageBubble } from './MessageBubble';

interface ChatViewProps {
  t: Dict;
  lang: Lang;
  schemes: SchemeInfo[];
  offline: boolean;
}

export function ChatView({ t, lang, schemes, offline }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCitation, setActiveCitation] = useState<CitationInfo | null>(
    null,
  );

  const [schemeId, setSchemeId] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const prompts = lang === 'hi' ? SUGGESTED_PROMPTS_HI : SUGGESTED_PROMPTS_EN;

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setInput('');
    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { sender: 'user', text: q }]);

    try {
      const data = offline
        ? await new Promise<ReturnType<typeof demoChat>>((res) =>
            setTimeout(() => res(demoChat(q)), 500),
          )
        : await askChat(q, {
            state: stateFilter || null,
            category: categoryFilter || null,
            scheme_id: schemeId || null,
          });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.answer,
          sentences: data.sentences,
          citations: data.citations,
          usage: data.usage,
          latency_ms: data.latency_ms,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get an answer.');
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = useMemo(() => messages.length === 0, [messages]);

  return (
    <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
      {/* Conversation */}
      <Card className="flex min-h-[560px] flex-col overflow-hidden lg:col-span-8">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 border-b border-border-subtle bg-surface-2 p-4 sm:grid-cols-3">
          <Field label={t.focusScheme}>
            <Select
              value={schemeId}
              onChange={(e) => setSchemeId(e.target.value)}
            >
              <option value="">{t.allSchemes}</option>
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.stateFilter}>
            <Select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">{t.allStates}</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.categoryFilter}>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">{t.allCategories}</option>
              {SCHEME_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {/* Thread */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          {/* Greeting */}
          <div className="flex justify-start">
            <div className="flex max-w-[85%] items-start gap-2.5 rounded-2xl rounded-bl-sm border border-border-subtle bg-surface px-4 py-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <SparkIcon className="h-3.5 w-3.5" />
              </span>
              <p className="text-sm leading-relaxed text-content">
                {t.greeting}
              </p>
            </div>
          </div>

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              t={t}
              msg={msg}
              onSelectCitation={setActiveCitation}
            />
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-sm border border-border-subtle bg-surface px-4 py-3">
                <Spinner className="h-4 w-4" />
                <span className="text-xs font-medium text-muted">
                  {t.thinking}
                </span>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-xs font-medium text-danger">
              {error}
            </div>
          ) : null}

          {/* Suggested prompts (only before first question) */}
          {isEmpty && !loading ? (
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-faint">
                {t.suggestedTitle}
              </p>
              <div className="flex flex-wrap gap-2">
                {prompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 text-xs font-medium text-content transition-colors hover:border-primary hover:text-primary cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-3 border-t border-border-subtle bg-surface-2 p-4"
        >
          <TextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.chatPlaceholder}
            disabled={loading}
            aria-label={t.chatPlaceholder}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t.ask}
          >
            <SendIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.ask}</span>
          </Button>
        </form>
      </Card>

      {/* Inspector */}
      <div className="lg:col-span-4">
        <CitationInspector t={t} citation={activeCitation} />
      </div>
    </div>
  );
}

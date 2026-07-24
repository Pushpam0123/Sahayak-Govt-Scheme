// Renders one chat message, including sentence-level citations and
// groundedness (unsupported / partially-supported) annotations.
import type { Dict } from '../../lib/i18n';
import type {
  ChatMessage,
  CitationInfo,
  Groundedness,
} from '../../lib/types';
import { AlertIcon } from '../icons';

const REFUSAL_TEXT =
  "I don't have this information in the official documents I've indexed.";

function CitationBadge({
  n,
  heading,
  onClick,
}: {
  n: number;
  heading?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={heading ? `Citation [${n}]: ${heading}` : `Citation [${n}]`}
      className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded bg-primary-soft px-1 align-super text-[10px] font-bold text-primary transition-colors hover:bg-primary hover:text-on-primary cursor-pointer"
    >
      {n}
    </button>
  );
}

function withCitations(
  text: string,
  citations: CitationInfo[],
  onSelect: (c: CitationInfo) => void,
) {
  const parts = text.split(/(\[[0-9]+\])/g);
  return parts.map((part, idx) => {
    const match = part.match(/^\[([0-9]+)\]$/);
    if (match) {
      const n = parseInt(match[1], 10);
      const cit = citations.find((c) => c.n === n);
      if (cit) {
        return (
          <CitationBadge
            key={idx}
            n={n}
            heading={cit.heading_path}
            onClick={() => onSelect(cit)}
          />
        );
      }
    }
    return <span key={idx}>{part}</span>;
  });
}

function GroundednessMark({
  t,
  g,
}: {
  t: Dict;
  g: Groundedness;
}) {
  const unsupported = g.status === 'unsupported';
  const label = unsupported ? t.claimUnsupported : t.claimPartial;
  return (
    <span
      className={`ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full align-middle text-[10px] ${
        unsupported ? 'bg-danger-soft text-danger' : 'bg-warn-soft text-warn'
      }`}
      title={`${label}: ${g.reasoning}`}
    >
      <AlertIcon className="h-3 w-3" />
    </span>
  );
}

export function MessageBubble({
  t,
  msg,
  onSelectCitation,
}: {
  t: Dict;
  msg: ChatMessage;
  onSelectCitation: (c: CitationInfo) => void;
}) {
  const isUser = msg.sender === 'user';

  if (!isUser && msg.text === REFUSAL_TEXT) {
    return (
      <div className="flex justify-start">
        <div className="flex max-w-[85%] items-start gap-2.5 rounded-2xl rounded-bl-sm border border-danger/30 bg-danger-soft px-4 py-3">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-semibold text-danger">
              {t.refusalTitle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-content">
              {t.refusalBody}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const citations = msg.citations ?? [];

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-br-sm bg-primary text-on-primary'
            : 'rounded-bl-sm border border-border-subtle bg-surface text-content'
        }`}
      >
        {msg.sentences && msg.sentences.length > 0 ? (
          <div className="space-y-1">
            {msg.sentences.map((sent, i) => {
              const g = sent.groundedness;
              const flagged =
                g && (g.status === 'unsupported' || g.status === 'partial');
              return (
                <span
                  key={i}
                  className={`inline ${
                    flagged
                      ? g!.status === 'unsupported'
                        ? 'rounded bg-danger-soft px-1'
                        : 'rounded bg-warn-soft px-1'
                      : ''
                  }`}
                >
                  {withCitations(sent.text, citations, onSelectCitation)}{' '}
                  {flagged ? <GroundednessMark t={t} g={g!} /> : null}{' '}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="whitespace-pre-wrap">
            {citations.length > 0
              ? withCitations(msg.text, citations, onSelectCitation)
              : msg.text}
          </p>
        )}

        {!isUser && msg.latency_ms != null ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-3 border-t border-border-subtle pt-2 font-mono text-[10px] text-faint">
            <span>
              {t.latency}: {msg.latency_ms.toFixed(0)}ms
            </span>
            {msg.usage ? (
              <span>
                {t.tokens}: ↑{msg.usage.input_tokens} ↓
                {msg.usage.output_tokens}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

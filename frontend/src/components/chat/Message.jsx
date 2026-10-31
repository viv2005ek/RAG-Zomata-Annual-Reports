import React from 'react';
import { AnswerCard } from '../messages/AnswerCard';
import { ClarificationCard } from '../messages/ClarificationCard';
import { NotFoundCard } from '../messages/NotFoundCard';
import { BlockedCard } from '../messages/BlockedCard';
import { User } from 'lucide-react';

export function Message({
  message,
  isLast = false,
  lastUserQuery = '',
  onSelectOption,
  onPrefillComposer,
  onRegenerate,
}) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-5 group animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-400">
            <span>You</span>
            <span>•</span>
            <span>{new Date(message.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="relative px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white font-medium text-sm shadow-xl shadow-amber-950/40 leading-relaxed break-words border border-amber-400/30 selection:bg-white/20 selection:text-white">
            {message.content}
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message Dispatches
  const kind = message.kind || 'answer';

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {kind === 'clarification' ? (
        <ClarificationCard
          message={message}
          onSelectOption={onSelectOption}
        />
      ) : kind === 'not_found' ? (
        <NotFoundCard
          message={message}
          lastUserQuery={lastUserQuery}
          onSelectOption={onSelectOption}
          onPrefillComposer={onPrefillComposer}
        />
      ) : kind === 'blocked' ? (
        <BlockedCard
          message={message}
        />
      ) : (
        <AnswerCard
          message={message}
          isLast={isLast}
          onRegenerate={onRegenerate}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Menu, 
  Plus, 
  BookOpen, 
  Sparkles,
  ShieldCheck,
  Search,
  Activity
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { streamMessage } from '../../lib/api';

export function ChatWindow() {
  const {
    getActiveThread,
    addUserMessage,
    updatePipelineStage,
    appendStreamingToken,
    finalizeAssistantResponse,
    isStreaming,
    streamingText,
    streamingPipeline,
    stopStreaming,
    setAbortController,
    createThread,
  } = useChatStore();

  const {
    isSidebarOpen,
    toggleSidebar,
    isInfoRailOpen,
    toggleInfoRail,
  } = useSettingsStore();

  const [prefilledText, setPrefilledText] = useState('');
  const [errorToast, setErrorToast] = useState(null);

  const activeThread = getActiveThread();
  const messages = activeThread?.messages || [];

  const handleSendMessage = async (queryText) => {
    if (!queryText.trim() || isStreaming) return;

    addUserMessage(queryText);

    const controller = new AbortController();
    setAbortController(controller);

    let metaResult = {
      kind: 'answer',
      citations: [],
      isGrounded: true,
      chunksUsed: [],
    };

    let hasFinalized = false;
    const safeFinalize = (meta) => {
      if (hasFinalized) return;
      hasFinalized = true;
      finalizeAssistantResponse(meta);
    };

    try {
      await streamMessage(queryText, {
        signal: controller.signal,
        onStage: (stageEvent) => {
          updatePipelineStage(stageEvent.id, stageEvent.status, stageEvent.durationMs);
        },
        onToken: (delta) => {
          appendStreamingToken(delta);
        },
        onMeta: (meta) => {
          metaResult = { ...metaResult, ...meta };
        },
        onDone: () => {
          safeFinalize(metaResult);
        },
        onError: (err) => {
          console.error('Error during chat completion:', err);
          setErrorToast('Something went wrong reaching the server. Please retry.');
          safeFinalize({
            kind: 'answer',
            isGrounded: false,
            citations: [],
          });
        },
      });
    } catch (e) {
      if (!controller.signal.aborted) {
        setErrorToast('Connection error. Please try again.');
        safeFinalize({
          kind: 'answer',
          isGrounded: false,
          citations: [],
        });
      }
    }
  };

  const handleRegenerate = () => {
    // Find last user message
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) {
      handleSendMessage(lastUser.content);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-transparent relative overflow-hidden">
      {/* Header */}
      <header className="h-14 sm:h-16 flex-shrink-0 border-b border-white/10 px-4 flex items-center justify-between backdrop-blur-2xl bg-[#0A0A0C]/75 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white transition-colors cursor-pointer border border-white/5"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-2.5 truncate">
            <h1 className="text-sm sm:text-base font-bold font-display text-white tracking-wide truncate">
              {activeThread?.title || 'Ask the Annual Report'}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-tech font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Grounded RAG
            </span>
          </div>
        </div>

        {/* Right header actions */}
        <div className="flex items-center gap-2">
          {/* Engine Status Pulse Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-tech font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Dual-Report Index</span>
          </div>

          {/* New Chat Quick Action */}
          <button
            type="button"
            onClick={() => createThread()}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 hover:text-white text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            aria-label="Start new conversation"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Sources Rail Toggle */}
          <button
            type="button"
            onClick={toggleInfoRail}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isInfoRailOpen
                ? 'bg-amber-500/20 text-white border-amber-400/50 shadow-md shadow-amber-500/20'
                : 'bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border-white/5'
            }`}
            aria-label="Toggle sources evidence drawer"
            title="Evidence Sources Rail"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </header>

      {/* Message List */}
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        streamingText={streamingText}
        streamingPipeline={streamingPipeline}
        onSelectOption={handleSendMessage}
        onPrefillComposer={(text) => setPrefilledText(text)}
        onRegenerate={handleRegenerate}
        onSelectSuggestion={handleSendMessage}
      />

      {/* Composer Area */}
      <div className="flex-shrink-0 z-20">
        <Composer
          onSend={handleSendMessage}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          prefilledText={prefilledText}
          onClearPrefill={() => setPrefilledText('')}
          lastUserQuery={
            [...messages].reverse().find((m) => m.role === 'user')?.content || ''
          }
        />
      </div>

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed bottom-20 right-6 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-white/20 text-xs flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <span>{errorToast}</span>
          <button
            type="button"
            onClick={() => setErrorToast(null)}
            className="text-white font-bold text-sm hover:opacity-80"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

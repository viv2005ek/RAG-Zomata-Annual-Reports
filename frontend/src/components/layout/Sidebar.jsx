import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  X, 
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { groupThreadsByDate } from '../../lib/formatting';

export function Sidebar() {
  const { 
    threads, 
    activeThreadId, 
    createThread, 
    selectThread, 
    deleteThread, 
    clearAllThreads 
  } = useChatStore();

  const {
    isSidebarOpen,
    setSidebarOpen,
  } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter threads by search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const q = searchQuery.toLowerCase();
    return threads.filter((t) => t.title.toLowerCase().includes(q));
  }, [threads, searchQuery]);

  // Group threads
  const groups = useMemo(() => {
    return groupThreadsByDate(filteredThreads);
  }, [filteredThreads]);

  const handleNewChat = () => {
    createThread();
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleSelectThread = (id) => {
    selectThread(id);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteThread(id);
  };

  const handleConfirmClearAll = () => {
    clearAllThreads();
    setShowClearConfirm(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 flex flex-col w-72 sm:w-80 bg-[#0A0A0C]/95 backdrop-blur-2xl border-r border-white/10 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'
        } ${!isSidebarOpen && 'hidden'}`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-400 to-yellow-500 flex items-center justify-center text-stone-950 font-black text-sm shadow-lg shadow-amber-500/25 ring-1 ring-white/30">
              E
            </div>
            <div>
              <h2 className="text-sm font-extrabold font-display text-white tracking-tight">Eternal RAG</h2>
              <p className="text-[11px] text-amber-400 font-tech font-bold tracking-wider">FY24-25 & FY25-26</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-colors lg:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:opacity-95 text-stone-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-950/50 border border-amber-300/40 transition-all cursor-pointer group font-display tracking-wide"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform stroke-[2.5]" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
              aria-label="Search conversation threads"
            />
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-xs text-stone-400">
              No conversations found.
            </div>
          ) : (
            <>
              {/* Today Group */}
              {groups.today.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-tech">
                    Today
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {groups.today.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === activeThreadId}
                        onSelect={() => handleSelectThread(thread.id)}
                        onDelete={(e) => handleDelete(e, thread.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Yesterday Group */}
              {groups.yesterday.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-tech">
                    Yesterday
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {groups.yesterday.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === activeThreadId}
                        onSelect={() => handleSelectThread(thread.id)}
                        onDelete={(e) => handleDelete(e, thread.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Older Group */}
              {groups.older.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-tech">
                    Older
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {groups.older.map((thread) => (
                      <ThreadItem
                        key={thread.id}
                        thread={thread}
                        isActive={thread.id === activeThreadId}
                        onSelect={() => handleSelectThread(thread.id)}
                        onDelete={(e) => handleDelete(e, thread.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="p-3 border-t border-white/5 flex flex-col gap-2">
          {/* Engine Status Card */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="font-medium text-slate-200">System Ready</span>
            </div>
            <span className="font-mono text-[10px] text-amber-400">Groq + Pinecone</span>
          </div>

          {/* Clear all conversations */}
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer w-full"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear conversations</span>
          </button>
        </div>
      </aside>

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[#14151B] border border-rose-500/30 p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Clear All Conversations?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              This will permanently delete your stored conversation history from this browser. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors cursor-pointer"
              >
                Yes, clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ThreadItem({ thread, isActive, onSelect, onDelete }) {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
        isActive
          ? 'bg-amber-500/15 text-amber-200 font-bold border-l-2 border-amber-400 shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
        <span className="truncate">{thread.title || 'Conversation'}</span>
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all flex-shrink-0 cursor-pointer"
        aria-label="Delete conversation"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

import { create } from 'zustand';

export const INITIAL_PIPELINE = [
  {
    id: 'retrieval',
    label: 'Retrieval',
    description: 'Hybrid BM25 + Pinecone dense search over 807 page-chunks across Doc A & B.',
    status: 'pending',
  },
  {
    id: 'reranking',
    label: 'Reranking',
    description: 'Cross-encoder re-scored candidate pool to isolate the highest-relevance evidence.',
    status: 'pending',
  },
  {
    id: 'context_build',
    label: 'Context Build',
    description: 'Assembled verified chunks with page citations into the LLM context window.',
    status: 'pending',
  },
  {
    id: 'generation',
    label: 'Generation',
    description: 'Groq openai/gpt-oss-20b drafted the answer with inline citations and table.',
    status: 'pending',
  },
  {
    id: 'verification',
    label: 'Verification',
    description: 'Checked every cited page against retrieved sources; marked Grounded.',
    status: 'pending',
  },
];

const loadStoredThreads = () => {
  try {
    const raw = localStorage.getItem('etr.threads.v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load threads from localStorage', e);
  }
  const defaultId = 'thread_' + Date.now();
  return [{
    id: defaultId,
    title: 'New conversation',
    createdAt: Date.now(),
    messages: []
  }];
};

export const useChatStore = create((set, get) => ({
  threads: loadStoredThreads(),
  activeThreadId: null,
  isStreaming: false,
  streamingStage: null,
  streamingText: '',
  streamingPipeline: JSON.parse(JSON.stringify(INITIAL_PIPELINE)),
  abortController: null,

  initStore: () => {
    const threads = get().threads;
    if (!get().activeThreadId && threads.length > 0) {
      set({ activeThreadId: threads[0].id });
    }
  },

  getActiveThread: () => {
    const { threads, activeThreadId } = get();
    return threads.find((t) => t.id === activeThreadId) || threads[0] || null;
  },

  createThread: (initialMessage = null) => {
    const newId = 'thread_' + Date.now();
    const newThread = {
      id: newId,
      title: initialMessage ? initialMessage.slice(0, 40) : 'New conversation',
      createdAt: Date.now(),
      messages: initialMessage ? [{
        role: 'user',
        id: 'msg_' + Date.now(),
        content: initialMessage,
        ts: Date.now()
      }] : []
    };

    set((state) => {
      const updated = [newThread, ...state.threads];
      localStorage.setItem('etr.threads.v1', JSON.stringify(updated));
      return {
        threads: updated,
        activeThreadId: newId,
        streamingText: '',
        isStreaming: false,
        streamingPipeline: JSON.parse(JSON.stringify(INITIAL_PIPELINE))
      };
    });
    return newId;
  },

  selectThread: (threadId) => {
    set({
      activeThreadId: threadId,
      streamingText: '',
      isStreaming: false,
      streamingPipeline: JSON.parse(JSON.stringify(INITIAL_PIPELINE))
    });
  },

  deleteThread: (threadId) => {
    set((state) => {
      const filtered = state.threads.filter((t) => t.id !== threadId);
      const nextThreads = filtered.length > 0 ? filtered : [{
        id: 'thread_' + Date.now(),
        title: 'New conversation',
        createdAt: Date.now(),
        messages: []
      }];
      const nextActive = state.activeThreadId === threadId ? nextThreads[0].id : state.activeThreadId;
      localStorage.setItem('etr.threads.v1', JSON.stringify(nextThreads));
      return { threads: nextThreads, activeThreadId: nextActive };
    });
  },

  clearAllThreads: () => {
    const freshId = 'thread_' + Date.now();
    const freshThreads = [{
      id: freshId,
      title: 'New conversation',
      createdAt: Date.now(),
      messages: []
    }];
    localStorage.setItem('etr.threads.v1', JSON.stringify(freshThreads));
    set({
      threads: freshThreads,
      activeThreadId: freshId,
      streamingText: '',
      isStreaming: false,
      streamingPipeline: JSON.parse(JSON.stringify(INITIAL_PIPELINE))
    });
  },

  addUserMessage: (content) => {
    const { activeThreadId, threads } = get();
    const userMsg = {
      role: 'user',
      id: 'msg_u_' + Date.now(),
      content,
      ts: Date.now(),
    };

    const updatedThreads = threads.map((t) => {
      if (t.id === activeThreadId) {
        const isFirst = t.messages.length === 0;
        return {
          ...t,
          title: isFirst ? (content.length > 40 ? content.slice(0, 38) + '...' : content) : t.title,
          messages: [...t.messages, userMsg],
        };
      }
      return t;
    });

    localStorage.setItem('etr.threads.v1', JSON.stringify(updatedThreads));
    set({
      threads: updatedThreads,
      isStreaming: true,
      streamingText: '',
      streamingPipeline: JSON.parse(JSON.stringify(INITIAL_PIPELINE)),
    });
  },

  updatePipelineStage: (stageId, status, durationMs) => {
    set((state) => {
      const pipeline = state.streamingPipeline.map((s) => {
        if (s.id === stageId) {
          return {
            ...s,
            status,
            ...(durationMs !== undefined ? { durationMs } : {}),
          };
        }
        return s;
      });
      return {
        streamingPipeline: pipeline,
        streamingStage: status === 'running' ? stageId : state.streamingStage,
      };
    });
  },

  appendStreamingToken: (delta) => {
    set((state) => ({ streamingText: state.streamingText + delta }));
  },

  finalizeAssistantResponse: (meta) => {
    const { activeThreadId, threads, streamingText, streamingPipeline, isStreaming } = get();
    if (!isStreaming) return;

    // Fallback if text is completely empty
    let finalText = (streamingText || '').trim();
    if (!finalText && meta.kind !== 'blocked') {
      finalText = 'No disclosures matching this query were returned from the report index. Please try asking with different keywords or fiscal year.';
    }

    // Determine card kind from meta (server authoritative)
    const kind = meta.kind || 'answer';
    
    // Ensure all pipeline stages are marked done
    const finalPipeline = streamingPipeline.map((s) => ({
      ...s,
      status: s.status === 'failed' ? 'failed' : 'done',
    }));

    let assistantMsg;
    if (kind === 'blocked') {
      assistantMsg = {
        role: 'assistant',
        id: 'msg_a_' + Date.now(),
        ts: Date.now(),
        kind: 'blocked',
        reason: meta.reason || 'prompt_injection',
        message: meta.message || finalText || 'I can only answer questions about the contents of the FY 2024-25 and FY 2025-26 annual reports.',
        pipeline: finalPipeline,
      };
    } else if (kind === 'not_found') {
      assistantMsg = {
        role: 'assistant',
        id: 'msg_a_' + Date.now(),
        ts: Date.now(),
        kind: 'not_found',
        content: finalText,
        reason: meta.reason || 'Not found in either report.',
        pipeline: finalPipeline,
        suggestedFollowups: meta.suggestedFollowups || [],
      };
    } else if (kind === 'clarification' && meta.clarification) {
      assistantMsg = {
        role: 'assistant',
        id: 'msg_a_' + Date.now(),
        ts: Date.now(),
        kind: 'clarification',
        question: meta.clarification.question || finalText,
        options: meta.clarification.options || ['Consolidated figures', 'Standalone figures'],
        allowOther: true,
        pipeline: finalPipeline,
      };
    } else {
      assistantMsg = {
        role: 'assistant',
        id: 'msg_a_' + Date.now(),
        ts: Date.now(),
        kind: 'answer',
        content: finalText,
        citations: meta.citations || [],
        unverifiedCitations: meta.unverifiedCitations || [],
        isGrounded: meta.isGrounded !== false,
        pipeline: finalPipeline,
        chunksUsed: meta.chunksUsed || [],
        suggestedFollowups: meta.suggestedFollowups || [],
      };
    }

    const updatedThreads = threads.map((t) => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: [...t.messages, assistantMsg],
        };
      }
      return t;
    });

    localStorage.setItem('etr.threads.v1', JSON.stringify(updatedThreads));
    set({
      threads: updatedThreads,
      isStreaming: false,
      streamingText: '',
      streamingStage: null,
    });
  },

  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isStreaming: false, abortController: null });
  },

  setAbortController: (abortController) => set({ abortController }),
}));

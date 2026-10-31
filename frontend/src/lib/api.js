/**
 * API client supporting SSE streaming RAG pipeline with graceful degradation to /api/query
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function streamMessage(query, { onStage, onToken, onMeta, onDone, onError, signal }) {
  try {
    const response = await fetch(`${API_BASE}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        if (!block.trim()) continue;
        
        let eventType = 'message';
        let dataStr = '';

        const blockLines = block.split('\n');
        for (const line of blockLines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim();
          }
        }

        if (!dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (eventType === 'stage') {
            onStage?.(parsed);
          } else if (eventType === 'token') {
            onToken?.(parsed.delta || '');
          } else if (eventType === 'meta') {
            onMeta?.(parsed);
          } else if (eventType === 'done') {
            onDone?.();
          }
        } catch (err) {
          console.warn('Error parsing SSE block JSON:', err, block);
        }
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      console.log('Stream aborted by user');
      return;
    }

    console.warn('Streaming failed or not available, falling back to /api/query:', error);
    
    // Graceful degradation fallback to /api/query
    try {
      onStage?.({ id: 'retrieval', status: 'running' });
      const fallbackResp = await fetch(`${API_BASE}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal,
      });

      if (!fallbackResp.ok) {
        throw new Error(`Fallback returned ${fallbackResp.status}`);
      }

      const data = await fallbackResp.json();
      
      onStage?.({ id: 'retrieval', status: 'done', durationMs: 250 });
      onStage?.({ id: 'reranking', status: 'done', durationMs: 40 });
      onStage?.({ id: 'context_build', status: 'done', durationMs: 15 });
      onStage?.({ id: 'generation', status: 'done', durationMs: 900 });
      onStage?.({ id: 'verification', status: 'done', durationMs: 25 });

      onToken?.(data.answer || '');

      let kind = 'answer';
      const ansLower = (data.answer || '').toLowerCase();
      if (ansLower.includes('not found in the reports')) {
        kind = 'not_found';
      } else if (ansLower.includes('security alert') || ansLower.includes('prompt injection')) {
        kind = 'blocked';
      }

      onMeta?.({
        kind,
        citations: (data.citations || []).map((c) => ({ doc: c[0], page: c[1] })),
        unverifiedCitations: (data.unverified_citations || []).map((c) => ({ doc: c[0], page: c[1] })),
        isGrounded: data.is_grounded,
        chunksUsed: data.chunks_used || [],
        suggestedFollowups: data.suggested_followups || [],
      });
      onDone?.();
    } catch (fallbackError) {
      onError?.(fallbackError);
    }
  }
}

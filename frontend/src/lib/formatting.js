/**
 * Formatting helpers for citations, timestamps, and thread grouping
 */

export function groupThreadsByDate(threads = []) {
  const groups = {
    today: [],
    yesterday: [],
    older: [],
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;

  for (const thread of threads) {
    const ts = thread.createdAt || Date.now();
    if (ts >= startOfToday) {
      groups.today.push(thread);
    } else if (ts >= startOfYesterday) {
      groups.yesterday.push(thread);
    } else {
      groups.older.push(thread);
    }
  }

  return groups;
}

export function parseCitationsFromText(text = '') {
  const regex = /Doc(?:ument)?[\s\u202f]*([ABab])[^\d\n\r]{1,15}?(?:Page|P\.?|p\.?)[\s\u202f]*(\d+)/gi;
  const citations = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    citations.push({
      doc: match[1].toUpperCase(),
      page: parseInt(match[2], 10),
    });
  }
  return citations;
}

export function formatDuration(ms) {
  if (!ms && ms !== 0) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

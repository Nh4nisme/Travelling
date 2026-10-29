import type { FaqItem } from '../types';

/** Chữ thường + bỏ dấu để tìm kiếm không phân biệt hoa/thường và dấu. */
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

/** Từ phổ biến trong câu hỏi tự nhiên, không giúp phân biệt FAQ ("how do I cancel my booking"). */
const STOP_WORDS = new Set([
  'how', 'do', 'does', 'did', 'can', 'could', 'should', 'would', 'what', 'when', 'where', 'why', 'which', 'who',
  'is', 'are', 'was', 'were', 'be', 'am', 'the', 'my', 'me', 'we', 'you', 'your', 'it', 'its', 'to', 'of', 'in',
  'on', 'at', 'for', 'and', 'or', 'an', 'if', 'but', 'not', 'with', 'from', 'about', 'get', 'have', 'has',
]);

const tokenize = (value: string) => {
  const all = normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
  const meaningful = all.filter((token) => !STOP_WORDS.has(token));
  // Truy vấn toàn từ dừng (vd. "how to") thì vẫn dùng nguyên từ gốc thay vì trả về rỗng.
  return meaningful.length > 0 ? meaningful : all;
};

type Scored = { item: FaqItem; score: number; matched: number; index: number };

/**
 * Tìm FAQ theo câu hỏi, từ khoá và nội dung trả lời (khớp chuỗi con: "cancel" khớp "cancellation").
 * - Ưu tiên kết quả chứa MỌI từ khoá trong truy vấn.
 * - Nếu không có, trả về kết quả khớp MỘT PHẦN (xếp theo số từ khớp) thay vì danh sách trống.
 * - Xếp hạng: khớp ở câu hỏi > từ khoá > nội dung trả lời.
 */
export function searchFaqs(query: string, items: FaqItem[]): FaqItem[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored: Scored[] = items.map((item, index) => {
    const question = normalize(item.question);
    const keywords = normalize((item.keywords ?? []).join(' '));
    const answer = normalize(item.answer);

    let score = 0;
    let matched = 0;
    for (const token of tokens) {
      const inQuestion = question.includes(token);
      const inKeywords = keywords.includes(token);
      const inAnswer = answer.includes(token);
      if (inQuestion || inKeywords || inAnswer) matched += 1;
      score += (inQuestion ? 3 : 0) + (inKeywords ? 2 : 0) + (inAnswer ? 1 : 0);
    }
    return { item, score, matched, index };
  });

  const byRelevance = (a: Scored, b: Scored) => b.matched - a.matched || b.score - a.score || a.index - b.index;

  const full = scored.filter((entry) => entry.matched === tokens.length);
  const pool = full.length > 0 ? full : scored.filter((entry) => entry.matched > 0);
  return pool.sort(byRelevance).map((entry) => entry.item);
}

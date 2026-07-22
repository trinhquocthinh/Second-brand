// src/workers/search.types.ts
import { NoteMetadata } from "./types";

// Cấu trúc dữ liệu trả về cho Menu Gợi ý (Dropdown Suggestion)
export interface SearchResultItem {
  id: string; // Tên file (vd: 'Architecture.md')
  title: string; // Tiêu đề H1
  matchType: "exact" | "prefix" | "contains";
}

// Lệnh từ Main Thread gửi xuống Search Worker
export type SearchWorkerRequest =
  | { type: "INDEX_NOTES"; payload: { notes: NoteMetadata[] } }
  | { type: "SEARCH_SUGGESTIONS"; payload: { query: string; limit?: number } }
  | { type: "GET_BACKLINKS"; payload: { targetId: string } };

// Phản hồi từ Search Worker gửi về Main Thread
export type SearchWorkerResponse =
  | { type: "INDEX_COMPLETE"; payload: { totalIndexed: number; durationMs: number } }
  | { type: "SUGGESTIONS_RESULT"; payload: { results: SearchResultItem[]; query: string } }
  | { type: "BACKLINKS_RESULT"; payload: { targetId: string; backlinks: string[] } }
  | { type: "SEARCH_ERROR"; payload: { message: string } };

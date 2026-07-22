// src/workers/search.worker.ts
import { NoteSearchEngine } from "./search.engine";
import { SearchWorkerRequest, SearchWorkerResponse } from "./search.types";

const engine = new NoteSearchEngine();

self.onmessage = (event: MessageEvent<SearchWorkerRequest>) => {
  const { type, payload } = event.data;

  try {
    if (type === "INDEX_NOTES") {
      const startTime = performance.now();
      engine.indexNotes(payload.notes);
      const durationMs = Math.round(performance.now() - startTime);

      const response: SearchWorkerResponse = {
        type: "INDEX_COMPLETE",
        payload: { totalIndexed: payload.notes.length, durationMs },
      };
      self.postMessage(response);
    } else if (type === "SEARCH_SUGGESTIONS") {
      const { query, limit = 10 } = payload;
      const results = engine.searchSuggestions(query, limit);

      const response: SearchWorkerResponse = {
        type: "SUGGESTIONS_RESULT",
        payload: { results, query },
      };
      self.postMessage(response);
    } else if (type === "GET_BACKLINKS") {
      const { targetId } = payload;
      const backlinks = engine.getBacklinks(targetId);

      const response: SearchWorkerResponse = {
        type: "BACKLINKS_RESULT",
        payload: { targetId, backlinks },
      };
      self.postMessage(response);
    }
  } catch (error: unknown) {
    const response: SearchWorkerResponse = {
      type: "SEARCH_ERROR",
      payload: { message: error instanceof Error ? error.message : "Lỗi không xác định trên Search Worker" },
    };
    self.postMessage(response);
  }
};

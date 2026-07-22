import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto"; // <-- Kích hoạt In-memory IndexedDB cho Dexie.js
import { beforeEach, vi } from "vitest";

// Reset mọi mocks trước mỗi test case để đảm bảo tính cô lập (Isolation)
beforeEach(() => {
  vi.restoreAllMocks();
});

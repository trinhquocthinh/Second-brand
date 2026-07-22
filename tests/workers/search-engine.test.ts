// tests/workers/search-engine.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { NoteSearchEngine } from "@/workers/search.engine";
import { NoteMetadata } from "@/workers/types";

describe("NoteSearchEngine & Backlinks O(1) Indexer", () => {
  let engine: NoteSearchEngine;
  const sampleNotes: NoteMetadata[] = [
    {
      id: "Architecture.md",
      title: "Kiến trúc Second Brain",
      links: ["SolidJS", "Web Workers"],
      tags: ["tech"],
      size: 100,
    },
    { id: "SolidJS.md", title: "SolidJS Reactivity", links: ["Web Workers"], tags: ["frontend"], size: 80 },
    { id: "Web-Workers.md", title: "Web Workers Engine", links: [], tags: ["performance"], size: 120 },
    { id: "Daily-Plan.md", title: "Kế hoạch ngày", links: ["SolidJS"], tags: ["daily"], size: 50 },
  ];

  beforeEach(() => {
    engine = new NoteSearchEngine();
    engine.indexNotes(sampleNotes);
  });

  it("[Prefix Search] nên tìm thấy note chính xác khi gõ từ khóa gợi ý cho cú pháp [[", () => {
    // Gõ 'Sol' -> Phải gợi ý ra 'SolidJS.md'
    const results = engine.searchSuggestions("Sol");

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("SolidJS.md");
    expect(results[0].title).toBe("SolidJS Reactivity");
  });

  it("[Case-Insensitive & Partial Match] nên tìm kiếm không phân biệt hoa/thường và khớp từ ở giữa", () => {
    // Gõ 'engine' -> Phải tìm thấy 'Web Workers Engine'
    const results = engine.searchSuggestions("engine");

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((r) => r.id === "Web-Workers.md")).toBe(true);
  });

  it("[Backlinks O(1)] nên truy xuất chính xác danh sách các note đang link tới note đích", () => {
    // 'SolidJS' được nhắc đến bởi 'Architecture.md' và 'Daily-Plan.md'
    const backlinks = engine.getBacklinks("SolidJS");

    expect(backlinks).toHaveLength(2);
    expect(backlinks).toContain("Architecture.md");
    expect(backlinks).toContain("Daily-Plan.md");

    // 'Web Workers' được nhắc đến bởi 'Architecture.md' và 'SolidJS.md'
    const workerBacklinks = engine.getBacklinks("Web Workers");
    expect(workerBacklinks).toHaveLength(2);
    expect(workerBacklinks).toContain("SolidJS.md");
  });

  it("[Performance] phải tìm kiếm trên tập 5,000 note dưới 5ms", () => {
    // 1. Tạo 5,000 note giả lập
    const massiveNotes: NoteMetadata[] = Array.from({ length: 5000 }, (_, i) => ({
      id: `Note-${i}.md`,
      title: `Kiến thức đồ sộ số ${i}`,
      links: [`Note-${(i + 1) % 5000}`], // Link vòng tròn
      tags: [],
      size: 100,
    }));

    const perfEngine = new NoteSearchEngine();
    perfEngine.indexNotes(massiveNotes);

    // 2. Bấm giờ tìm kiếm
    const startTime = performance.now();
    const results = perfEngine.searchSuggestions("Kiến thức đồ sộ số 499");
    const duration = performance.now() - startTime;

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(5); // Ngưỡng tối đa 5ms cho trải nghiệm Real-time
  });
});

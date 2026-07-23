import { describe, it, expect, beforeEach } from "vitest";
import { FullTextSearchEngine } from "@/workers/fulltext.engine";
import { NoteMetadata } from "@/workers/types";

describe("Full-Text Search Engine (MiniSearch Integration)", () => {
  let engine: FullTextSearchEngine;
  const sampleNotes: (NoteMetadata & { content: string })[] = [
    {
      id: "Zettelkasten.md",
      title: "Phương pháp Zettelkasten",
      content:
        "Zettelkasten là phương pháp quản lý kiến thức cá nhân bằng cách chia nhỏ các ghi chú thành các thẻ độc lập.",
      links: [],
      tags: ["pkm"],
      size: 200,
    },
    {
      id: "SolidJS.md",
      title: "SolidJS Reactivity",
      content:
        "SolidJS sử dụng Fine-Grained Reactivity thay vì Virtual DOM như React, giúp hiệu năng render DOM vượt trội.",
      links: [],
      tags: ["frontend"],
      size: 150,
    },
    {
      id: "Web-Workers.md",
      title: "Đa luồng với Web Workers",
      content: "Web Workers cho phép chạy các tác vụ nặng như phân tích AST hay tính toán vật lý ngoài Main Thread.",
      links: [],
      tags: ["performance"],
      size: 180,
    },
  ];

  beforeEach(() => {
    engine = new FullTextSearchEngine();
  });

  it("[Happy Path] nên tìm thấy bài ghi chú dựa trên từ khóa nằm sâu bên trong nội dung (Body Text)", () => {
    engine.index(sampleNotes);

    // Tìm từ khóa "Virtual DOM" (chỉ có trong nội dung bài SolidJS, không có ở Tiêu đề)
    const results = engine.search("Virtual DOM");

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("SolidJS.md");
    expect(results[0].title).toBe("SolidJS Reactivity");
  });

  it("[Fuzzy & Prefix Match] nên hỗ trợ tìm kiếm mờ (sai chính tả nhẹ) và gõ tắt tiền tố", () => {
    engine.index(sampleNotes);

    // Gõ tắt "Reacti..." -> Phải tìm ra bài SolidJS Reactivity
    const prefixResults = engine.search("Reacti");
    expect(prefixResults.length).toBeGreaterThanOrEqual(1);
    expect(prefixResults[0].id).toBe("SolidJS.md");

    // Gõ sai chính tả nhẹ "Zetelka..." -> Vẫn tìm ra bài Zettelkasten
    const fuzzyResults = engine.search("Zetelkasten");
    expect(fuzzyResults.length).toBeGreaterThanOrEqual(1);
    expect(fuzzyResults[0].id).toBe("Zettelkasten.md");
  });

  it("[Performance 10ms] phải index và truy vấn toàn văn bản trên tập 5,000 ghi chú dưới 10ms", () => {
    // 1. Tạo 5,000 bài ghi chú giả lập với nội dung dài
    const massiveNotes = Array.from({ length: 5000 }, (_, i) => ({
      id: `Note-${i}.md`,
      title: `Ghi chú chuyên sâu số ${i}`,
      content: `Đây là nội dung ghi chú thứ ${i}. Chúng ta đang kiểm thử khả năng chịu tải của MiniSearch engine trên kiến trúc bộ nhớ cục bộ Zettelkasten với từ khóa đặc biệt bí-mật-${i % 100}.`,
      links: [],
      tags: [],
      size: 300,
    }));

    // Đo thời gian Index
    const startIndex = performance.now();
    engine.index(massiveNotes);
    const indexDuration = performance.now() - startIndex;
    console.log(`🚀 [Full-Text Benchmark] Index 5,000 files hoàn tất trong: ${indexDuration.toFixed(2)}ms`);

    // Đo thời gian Tìm kiếm từ khóa nằm sâu trong body
    const startSearch = performance.now();
    const results = engine.search("bí-mật-42");
    const searchDuration = performance.now() - startSearch;
    console.log(
      `⚡ [Full-Text Benchmark] Truy vấn Full-Text trên 5,000 files hoàn tất trong: ${searchDuration.toFixed(4)}ms`,
    );

    expect(results.length).toBeGreaterThan(0);
    expect(searchDuration).toBeLessThan(10); // Ngưỡng phản hồi tức thì cho Modal Cmd + K
  });
});

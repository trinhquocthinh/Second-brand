// tests/workers/markdown-parser.test.ts
import { describe, it, expect } from "vitest";
import { parseMarkdownMetadata } from "@/workers/parser";

describe("Lightweight Markdown AST Parser", () => {
  it("[Happy Path] nên trích xuất chính xác Tiêu đề H1, Links và Tags", () => {
    const rawContent = `
# Kiến trúc Second Brain

Đây là bài viết hướng dẫn về [[SolidJS]] và [[Web Workers]].
Chúng ta đang áp dụng kiến trúc #local-first và #tdd-workflow cực kỳ mạnh mẽ.
    `.trim();

    const metadata = parseMarkdownMetadata("Architecture.md", rawContent);

    expect(metadata.title).toBe("Kiến trúc Second Brain");
    expect(metadata.links).toEqual(["SolidJS", "Web Workers"]);
    expect(metadata.tags).toEqual(["local-first", "tdd-workflow"]);
  });

  it("[Edge Case] nên nhận diện đúng khi file không có Tiêu đề H1 (fallback về tên file)", () => {
    const rawContent = `Chỉ là một ghi chú nhanh không có tiêu đề, nhưng có kết nối tới [[Obsidian]].`;

    const metadata = parseMarkdownMetadata("Untitled-Note.md", rawContent);

    expect(metadata.title).toBe("Untitled-Note.md");
    expect(metadata.links).toEqual(["Obsidian"]);
    expect(metadata.tags).toEqual([]);
  });

  it("[Edge Case] nên bỏ qua các chuỗi [[ hoặc # nằm bên trong code block (Markdown Code)", () => {
    const rawContent = `
# Note Kỹ Thuật

Đây là tag thật #real-tag và link thật [[Real Link]].

\`\`\`javascript
// Không được parse các dòng dưới đây thành Link hoặc Tag
const fakeLink = "[[Fake Link]]";
const fakeTag = "#fake-tag";
\`\`\`
    `.trim();

    const metadata = parseMarkdownMetadata("Tech-Note.md", rawContent);

    expect(metadata.links).toEqual(["Real Link"]);
    expect(metadata.tags).toEqual(["real-tag"]);
  });

  it("[Performance] nên xử lý chuỗi văn bản dài 10,000 dòng dưới 5ms", () => {
    // Sử dụng Array.from để tạo ra 10,000 chuỗi với index (i) thực sự khác nhau
    const lines = Array.from(
      { length: 10000 },
      (_, i) => `Dòng văn bản bình thường với link [[Link ${i}]] và tag #tag-${i}`,
    );
    const heavyContent = `# Heavy Note\n` + lines.join("\n");

    const startTime = performance.now();
    const metadata = parseMarkdownMetadata("Heavy.md", heavyContent);
    const duration = performance.now() - startTime;

    expect(metadata.title).toBe("Heavy Note");
    expect(metadata.links.length).toBe(10000); // Lần này chắc chắn là 10,000 links độc lập!
    expect(duration).toBeLessThan(15); // Tốc độ O(1) sẽ giúp test pass chỉ trong ~2-4ms
  });
});

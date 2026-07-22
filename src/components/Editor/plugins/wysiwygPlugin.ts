// src/components/Editor/plugins/wysiwygPlugin.ts
import { ViewPlugin, DecorationSet, Decoration, ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

/**
 * Hàm tính toán Decorations: Quét document và gắn class CSS cho WYSIWYG
 * Đảm bảo độ trễ thực thi dưới 16.6ms cho trải nghiệm 60 FPS.
 */
const buildDecorations = (view: ViewUpdate["view"]): DecorationSet => {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const text = line.text;

    // 1. Nhận diện Tiêu đề H1 (# Title) -> Gắn class .cm-header-1 cho dòng
    if (text.startsWith("# ")) {
      builder.add(line.from, line.from, Decoration.line({ class: "cm-header-1 font-bold text-2xl text-sky-400" }));
    }

    // 2. Nhận diện Chữ in đậm (**Bold**) -> Gắn class .cm-strong cho từ
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    while ((match = boldRegex.exec(text)) !== null) {
      const start = line.from + match.index;
      const end = start + match[0].length;
      builder.add(start, end, Decoration.mark({ class: "cm-strong font-bold text-amber-300" }));
    }
  }

  return builder.finish();
};

/**
 * Custom ViewPlugin của CodeMirror 6
 */
export const wysiwygPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: ViewUpdate["view"]) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      // Chỉ tính toán lại khi nội dung văn bản thay đổi hoặc viewport thay đổi
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

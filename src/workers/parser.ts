import { NoteMetadata } from "./types";

export const parseMarkdownMetadata = (filename: string, content: string, size: number = 0): NoteMetadata => {
  // 1. Loại bỏ Code Blocks
  const cleanContent = content.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");

  // 2. Trích xuất H1 Title
  const titleMatch = cleanContent.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : filename;

  // 3. Trích xuất Links với cấu trúc Set O(1) để không bị nghẽn CPU khi file siêu lớn
  const linksSet = new Set<string>();
  const linkRegex = /\[\[([^[\]]+)\]\]/g;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(cleanContent)) !== null) {
    const linkTarget = linkMatch[1].split("|")[0].trim();
    linksSet.add(linkTarget);
  }

  // 4. Trích xuất Tags với cấu trúc Set O(1)
  const tagsSet = new Set<string>();
  const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-/]+)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(cleanContent)) !== null) {
    tagsSet.add(tagMatch[1].trim());
  }

  return {
    id: filename,
    title,
    links: Array.from(linksSet),
    tags: Array.from(tagsSet),
    size,
  };
};

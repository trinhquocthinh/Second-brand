// tests/mocks/massive-vault.ts
import { MockFileSystemDirectoryHandle, MockFileSystemFileHandle } from "./fs-access-api";

/**
 * Tạo ra một cây thư mục giả lập chứa đúng 5,000 file markdown
 * Mỗi file có nội dung độ dài trung bình, chứa H1 Title, 2-5 Links và 1-3 Tags
 */
export const createMassiveVaultMock = (fileCount: number = 5000): MockFileSystemDirectoryHandle => {
  const root = new MockFileSystemDirectoryHandle("Massive-Second-Brain-Vault");

  for (let i = 0; i < fileCount; i++) {
    const filename = `Note-${i.toString().padStart(4, "0")}.md`;

    // Tạo nội dung ngẫu nhiên mô phỏng ghi chú thực tế
    const content = `
# Kiến thức cốt lõi số ${i}

Đây là bài ghi chú tổng hợp về hệ thống [[Architecture ${i % 100}]] và kết nối với [[Design Pattern ${(i + 1) % 50}]].
Chúng ta đang áp dụng nguyên lý TDD mạnh mẽ để kiểm thử hiệu năng.

Tham khảo thêm tại [[React Server Components]] và [[Web Workers Engine]].

#second-brain #performance-test #cluster-${i % 10}
    `.trim();

    const fileHandle = new MockFileSystemFileHandle(filename, content);
    root.addChild(fileHandle);
  }

  return root;
};

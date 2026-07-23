import { vaultCacheDB } from "./db";

// Chuẩn hóa kiểu dữ liệu trả về theo mô hình Result Pattern an toàn type-safe
export type VaultOpenResult =
  | { success: true; handle: FileSystemDirectoryHandle }
  | {
      success: false;
      error: { code: "PERMISSION_DENIED" | "BROWSER_NOT_SUPPORTED" | "UNKNOWN_ERROR"; message: string };
    };

export class VaultStorageService {
  /**
   * Yêu cầu người dùng chọn thư mục Vault cục bộ từ máy tính
   */
  async openVault(): Promise<VaultOpenResult> {
    // 1. Kiểm tra tính tương thích của trình duyệt (Browser Incompatibility Check)
    if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
      return {
        success: false,
        error: {
          code: "BROWSER_NOT_SUPPORTED",
          message: "Trình duyệt của bạn không hỗ trợ File System Access API. Vui lòng sử dụng Chrome, Edge hoặc Brave.",
        },
      };
    }

    try {
      // 2. Kích hoạt hộp thoại xin quyền đọc/ghi ổ cứng từ Native Browser
      const handle = await (window as any).showDirectoryPicker();

      // 3. Cache handle xuống IndexedDB cho các phiên làm việc sau
      await vaultCacheDB.saveHandle(handle);

      return {
        success: true,
        handle,
      };
    } catch (err: unknown) {
      // 4. Bắt lỗi người dùng bấm Hủy (Cancel) trên popup xin quyền
      if (err instanceof DOMException && (err.name === "AbortError" || err.code === 20)) {
        return {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Người dùng đã từ chối cấp quyền truy cập vào thư mục Vault.",
          },
        };
      }

      // Xử lý các lỗi ngoại lệ không xác định khác
      return {
        success: false,
        error: {
          code: "UNKNOWN_ERROR",
          message: err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định khi mở Vault.",
        },
      };
    }
  }

  /**
   * Lấy handle thư mục đã cache từ IndexedDB
   */
  async getCachedVaultHandle(): Promise<FileSystemDirectoryHandle | undefined> {
    return await vaultCacheDB.getHandle();
  }

  /**
   * Quét toàn bộ file .md bằng Async Generator (Stream Iteration)
   * Sử dụng đệ quy (Recursion) để đọc sâu vào cả các thư mục con (Sub-folders)
   */
  async *scanMarkdownFiles(dirHandle: FileSystemDirectoryHandle): AsyncGenerator<FileSystemFileHandle> {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === "file" && entry.name.endsWith(".md")) {
        // Trả về stream từng file .md ngay khi tìm thấy
        yield entry as FileSystemFileHandle;
      } else if (entry.kind === "directory") {
        // Đệ quy lặp xuống các thư mục con bên trong Vault
        yield* this.scanMarkdownFiles(entry as FileSystemDirectoryHandle);
      }
    }
  }
}

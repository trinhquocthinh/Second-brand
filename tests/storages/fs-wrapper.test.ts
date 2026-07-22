import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupFSMocks, MockFileSystemDirectoryHandle } from "../mocks/fs-access-api";
import { VaultStorageService } from "@/storages/fs-wrapper";
import { vaultCacheDB } from "@/storages/db";

describe("VaultStorageService (File System Access API Wrapper)", () => {
  let fsMocks: ReturnType<typeof setupFSMocks>;
  let storageService: VaultStorageService;

  beforeEach(async () => {
    // 1. Reset IndexedDB cache trước mỗi test case
    await vaultCacheDB.clearCache();
    // 2. Thiết lập lại Mock cho Trình duyệt
    fsMocks = setupFSMocks();
    storageService = new VaultStorageService();
  });

  it("[Happy Path] nên mở được thư mục Vault, trả về handle và lưu vào IndexedDB thành công", async () => {
    // Thực thi
    const result = await storageService.openVault();

    // Kiểm chứng kết quả trả về
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.handle.name).toBe("My-Second-Brain-Vault");
      expect(fsMocks.showDirectoryPickerMock).toHaveBeenCalledTimes(1);

      // Kiểm chứng handle đã được cache xuống IndexedDB để dùng cho phiên sau
      const cachedHandle = await storageService.getCachedVaultHandle();
      expect(cachedHandle).toBeDefined();
      expect(cachedHandle?.name).toBe("My-Second-Brain-Vault");
    }
  });

  it("[Permission Denial] nên xử lý an toàn khi người dùng bấm Hủy (Cancel) trên hộp thoại xin quyền", async () => {
    // Giả lập người dùng từ chối cấp quyền
    fsMocks.simulatePermissionDenied();

    // Thực thi
    const result = await storageService.openVault();

    // Kiểm chứng hệ thống không bị crash và trả về Error state chuẩn hóa
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("PERMISSION_DENIED");
      expect(result.error.message).toContain("Người dùng đã từ chối cấp quyền");
    }
  });

  it("[Browser Incompatibility] nên trả về lỗi FALLBACK_REQUIRED nếu trình duyệt không hỗ trợ File System Access API", async () => {
    // Giả lập môi trường Firefox / Trình duyệt không hỗ trợ
    fsMocks.simulateBrowserIncompatibility();

    // Thực thi
    const result = await storageService.openVault();

    // Kiểm chứng
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("BROWSER_NOT_SUPPORTED");
      expect(result.error.message).toContain("Trình duyệt của bạn không hỗ trợ File System Access API");
    }
  });

  it("[Stream Reader] nên đếm và đọc chính xác số lượng file .md trong Vault", async () => {
    // Mở vault thành công
    const openResult = await storageService.openVault();
    expect(openResult.success).toBe(true);

    if (openResult.success) {
      // Quét stream file
      const files: string[] = [];
      for await (const fileHandle of storageService.scanMarkdownFiles(
        openResult.handle as unknown as FileSystemDirectoryHandle,
      )) {
        files.push(fileHandle.name);
      }

      // Đảm bảo lấy đúng 2 file .md từ bộ Mock
      expect(files).toHaveLength(2);
      expect(files).toContain("Architecture.md");
      expect(files).toContain("SolidJS.md");
    }
  });

  it("[Stream Reader] nên đếm và đọc chính xác số lượng file .md trong Vault", async () => {
    const openResult = await storageService.openVault();
    expect(openResult.success).toBe(true);

    if (openResult.success) {
      const files: string[] = [];
      for await (const fileHandle of storageService.scanMarkdownFiles(
        openResult.handle as unknown as FileSystemDirectoryHandle,
      )) {
        files.push(fileHandle.name);
      }

      expect(files).toHaveLength(2);
      expect(files).toContain("Architecture.md");
      expect(files).toContain("SolidJS.md");
    }
  }); // <-- CHÚ Ý: Phải có dấu }); ở đây để đóng test case Stream Reader cũ!

  // --- BẮT ĐẦU 2 TEST CASE MỚI BỔ SUNG ---

  it("[Error Handling] nên trả về lỗi UNKNOWN_ERROR khi openVault gặp ngoại lệ không xác định (như lỗi phần cứng/ổ cứng)", async () => {
    // Giả lập một lỗi không phải do người dùng hủy (mô phỏng lỗi ổ cứng bị ngắt kết nối)
    fsMocks.showDirectoryPickerMock.mockRejectedValueOnce(new Error("Fatal Disk Failure"));

    const result = await storageService.openVault();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UNKNOWN_ERROR");
      expect(result.error.message).toContain("Fatal Disk Failure");
    }
  });

  it("[Stream Reader] nên tự động bỏ qua các file không phải .md (như hình ảnh .png, file hệ thống .DS_Store)", async () => {
    // 1. Thêm các file rác phi-markdown vào thư mục gốc trong RAM
    const { MockFileSystemFileHandle } = await import("../mocks/fs-access-api");
    const mockImage = new MockFileSystemFileHandle("architecture.png", "fake image binary");
    const mockSystemFile = new MockFileSystemFileHandle(".DS_Store", "system config");
    const mockTextFile = new MockFileSystemFileHandle("todo.txt", "not a markdown file");

    fsMocks.mockRoot.addChild(mockImage);
    fsMocks.mockRoot.addChild(mockSystemFile);
    fsMocks.mockRoot.addChild(mockTextFile);

    // 2. Mở vault và quét stream
    const openResult = await storageService.openVault();
    expect(openResult.success).toBe(true);

    if (openResult.success) {
      const files: string[] = [];
      for await (const fileHandle of storageService.scanMarkdownFiles(
        openResult.handle as unknown as FileSystemDirectoryHandle,
      )) {
        files.push(fileHandle.name);
      }

      // 3. Kiểm chứng: Stream reader chỉ lấy đúng 2 file .md cũ, bỏ qua hoàn toàn 3 file rác vừa thêm
      expect(files).toHaveLength(2);
      expect(files).not.toContain("architecture.png");
      expect(files).not.toContain(".DS_Store");
      expect(files).not.toContain("todo.txt");
    }
  });
});

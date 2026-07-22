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
});

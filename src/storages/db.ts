import Dexie, { type EntityTable } from "dexie";

// Define Interface cho cấu trúc bảng cache
export interface VaultCacheRecord {
  id: string; // Luôn dùng khóa 'PRIMARY_VAULT' cho bản MVP
  handle: FileSystemDirectoryHandle;
  lastOpened: number;
}

// Khởi tạo Database với Dexie
const db = new Dexie("SecondBrainMetadataDB") as Dexie & {
  vaults: EntityTable<VaultCacheRecord, "id">;
};

// Khai báo Schema cho IndexedDB (chỉ đánh index cho các trường cần query)
db.version(1).stores({
  vaults: "id, lastOpened",
});

export const vaultCacheDB = {
  /**
   * Lưu handle của thư mục Vault xuống IndexedDB
   */
  saveHandle: async (handle: FileSystemDirectoryHandle): Promise<void> => {
    await db.vaults.put({
      id: "PRIMARY_VAULT",
      handle,
      lastOpened: Date.now(),
    });
  },

  /**
   * Truy xuất handle đã lưu từ lần mở app trước
   */
  getHandle: async (): Promise<FileSystemDirectoryHandle | undefined> => {
    const record = await db.vaults.get("PRIMARY_VAULT");
    return record?.handle;
  },

  /**
   * Xóa sạch cache (dùng cho Unit Test hoặc khi người dùng muốn đổi Vault khác)
   */
  clearCache: async (): Promise<void> => {
    await db.vaults.clear();
  },
};

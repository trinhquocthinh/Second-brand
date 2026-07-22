import { VaultStorageService } from "@/storages/fs-wrapper";
import { parseMarkdownMetadata } from "./parser";
import { WorkerRequest, WorkerResponse, NoteMetadata } from "./types";

const storageService = new VaultStorageService();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data;

  if (type === "START_SCAN") {
    const { dirHandle, batchSize = 100 } = payload;
    const startTime = performance.now();

    let batch: NoteMetadata[] = [];
    let totalScanned = 0;

    try {
      // Dùng Async Generator để duyệt qua cây thư mục
      for await (const fileHandle of storageService.scanMarkdownFiles(dirHandle)) {
        const file = await fileHandle.getFile();
        const content = await file.text();

        // Phân tích AST siêu nhẹ
        const metadata = parseMarkdownMetadata(fileHandle.name, content, file.size);
        batch.push(metadata);
        totalScanned++;

        // Khi gom đủ batch size (ví dụ: 100 files), gửi PostMessage về Main Thread
        if (batch.length >= batchSize) {
          const response: WorkerResponse = {
            type: "SCAN_PROGRESS",
            payload: { batch: [...batch], totalScanned },
          };
          self.postMessage(response);
          batch = []; // Reset batch
        }
      }

      // Gửi nốt số file còn dư trong batch cuối cùng (nếu có)
      if (batch.length > 0) {
        self.postMessage({
          type: "SCAN_PROGRESS",
          payload: { batch, totalScanned },
        } as WorkerResponse);
      }

      // Báo cáo hoàn tất
      const durationMs = Math.round(performance.now() - startTime);
      self.postMessage({
        type: "SCAN_COMPLETE",
        payload: { totalFiles: totalScanned, durationMs },
      } as WorkerResponse);
    } catch (error: unknown) {
      self.postMessage({
        type: "SCAN_ERROR",
        payload: { message: error instanceof Error ? error.message : "Lỗi không xác định khi quét file trên Worker." },
      } as WorkerResponse);
    }
  }
};

export interface NoteMetadata {
  id: string; // Tên file (ví dụ: 'Architecture.md')
  title: string; // Tiêu đề H1
  links: string[]; // Danh sách liên kết chéo [[Link]]
  tags: string[]; // Danh sách thẻ #tag
  size: number; // Dung lượng file (bytes)
}

// Lệnh từ Main Thread gửi xuống Worker
export type WorkerRequest = {
  type: "START_SCAN";
  payload: {
    dirHandle: FileSystemDirectoryHandle;
    batchSize?: number; // Mặc định 100
  };
};

// Phản hồi từ Worker gửi về Main Thread
export type WorkerResponse =
  | { type: "SCAN_PROGRESS"; payload: { batch: NoteMetadata[]; totalScanned: number } }
  | { type: "SCAN_COMPLETE"; payload: { totalFiles: number; durationMs: number } }
  | { type: "SCAN_ERROR"; payload: { message: string } };

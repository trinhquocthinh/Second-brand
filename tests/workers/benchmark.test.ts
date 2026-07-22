import { describe, it, expect } from 'vitest';
import { createMassiveVaultMock } from '../mocks/massive-vault';
import { VaultStorageService } from '@/storages/fs-wrapper';
import { parseMarkdownMetadata } from '@/workers/parser';
import { NoteMetadata } from '@/workers/types';

describe('[Milestone Sprint 1] 5,000 Files Architecture Benchmark', () => {
  it('phải quét, parse AST và phân lô (batching) 5,000 file markdown dưới 1,500ms', async () => {
    // 1. Chuẩn bị bộ dataset 5,000 file trong RAM
    const massiveRoot = createMassiveVaultMock(5000);
    const storageService = new VaultStorageService();
    
    const BATCH_SIZE = 100;
    const allBatches: NoteMetadata[][] = [];
    let currentBatch: NoteMetadata[] = [];
    let totalFilesScanned = 0;

    // 2. Bắt đầu bấm giờ (Start Timer)
    const startTime = performance.now();

    // 3. Thực thi mô phỏng chính xác luồng chạy bên trong Web Worker (ast.worker.ts)
    for await (const fileHandle of storageService.scanMarkdownFiles(massiveRoot as unknown as FileSystemDirectoryHandle)) {
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      // Parse metadata
      const metadata = parseMarkdownMetadata(fileHandle.name, content, file.size);
      currentBatch.push(metadata);
      totalFilesScanned++;

      // Kiểm tra cơ chế Batching (Gom đủ 100 file thì gửi đi 1 lần)
      if (currentBatch.length >= BATCH_SIZE) {
        allBatches.push([...currentBatch]);
        currentBatch = [];
      }
    }

    // Đẩy nốt số file còn dư trong batch cuối cùng
    if (currentBatch.length > 0) {
      allBatches.push(currentBatch);
    }

    // 4. Kết thúc bấm giờ (End Timer)
    const durationMs = performance.now() - startTime;
    console.log(`🚀 [Benchmark Result] Quét và Index 5,000 files hoàn tất trong: ${durationMs.toFixed(2)}ms`);

    // 5. NGHIỆM THU TIÊU CHÍ DOD (Definition of Done)
    // - Tiêu chí 1: Đọc chính xác không thiếu 1 file nào (5,000 files)
    expect(totalFilesScanned).toBe(5000);

    // - Tiêu chí 2: Cơ chế Batching chia đúng 50 đợt (5000 / 100 = 50 batches)
    expect(allBatches.length).toBe(50);
    expect(allBatches[0].length).toBe(100);

    // - Tiêu chí 3: Kiểm tra tính chính xác của Metadata trích xuất từ file bất kỳ
    const sampleNote = allBatches[0][0]; // Note-0000.md
    expect(sampleNote.title).toContain('Kiến thức cốt lõi số 0');
    expect(sampleNote.links.length).toBeGreaterThanOrEqual(2);
    expect(sampleNote.tags).toContain('second-brain');

    // - Tiêu chí 4 (Quan trọng nhất): Tổng thời gian phải DƯỚI 1,500ms (1.5 giây)
    expect(durationMs).toBeLessThan(1500);
  }, 10000); // Set timeout 10s cho test case chịu tải
});
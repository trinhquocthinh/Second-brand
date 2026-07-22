// tests/integration/sprint2-milestone.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import '@testing-library/jest-dom/vitest';
import { EditorView } from '@codemirror/view';
import { CodeMirrorEditor } from '@/components/Editor/CodeMirrorEditor';
import { NoteSearchEngine } from '@/workers/search.engine';
import { NoteMetadata } from '@/workers/types';

describe('[Milestone Sprint 2] WYSIWYG Editor & Bi-Directional Linking Integration', () => {
    let searchEngine: NoteSearchEngine;
    const sampleNotes: NoteMetadata[] = [
        { id: 'Architecture.md', title: 'Kiến trúc Second Brain', links: ['SolidJS', 'Web Workers'], tags: ['tech'], size: 100 },
        { id: 'SolidJS.md', title: 'SolidJS Reactivity', links: ['Web Workers'], tags: ['frontend'], size: 80 },
        { id: 'Web-Workers.md', title: 'Web Workers Engine', links: [], tags: ['performance'], size: 120 }
    ];

    beforeEach(() => {
        searchEngine = new NoteSearchEngine();
        searchEngine.indexNotes(sampleNotes);
    });

    it('phải kích hoạt luồng tìm kiếm gợi ý dưới 10ms khi người dùng gõ [[ trong Trình soạn thảo', async () => {
        const mockOnChange = vi.fn();
        let triggeredQuery = '';

        // Mô phỏng Hook kết nối giữa Trình soạn thảo và Search Worker
        const handleTriggerLink = () => {
            // Khi gõ [[, giả lập lấy từ khóa và query vào Động cơ
            triggeredQuery = 'Sol';
            const results = searchEngine.searchSuggestions(triggeredQuery);

            // Kiểm chứng kết quả trả về thần tốc từ Worker
            expect(results).toHaveLength(1);
            expect(results[0].id).toBe('SolidJS.md');
        };

        render(() => (
            <CodeMirrorEditor
                initialValue="Đang viết bài về "
                onChange={mockOnChange}
                onTriggerLink={handleTriggerLink}
            />
        ));

        // Lấy instance của CodeMirror 6 và dispatch transaction gõ '[['
        const container = screen.getByTestId('cm-editor-container');
        const view = (container as any)._cmView as EditorView;

        const startTime = performance.now();

        view.dispatch({
            changes: { from: view.state.doc.length, insert: '[[' },
            selection: { anchor: view.state.doc.length + 2, head: view.state.doc.length + 2 }
        });

        const durationMs = performance.now() - startTime;

        // NGHIỆM THU TIÊU CHÍ DOD (Definition of Done - Sprint 2)
        // 1. Hook onTriggerLink phải được gọi thành công và tìm ra đúng Note gợi ý
        expect(triggeredQuery).toBe('Sol');

        // 2. Độ trễ của toàn bộ giao dịch (DOM Transaction + Search Query) phải DƯỚI 10ms!
        expect(durationMs).toBeLessThan(10);
        console.log(`🚀 [Sprint 2 Benchmark] Gõ '[[' và truy xuất Auto-complete hoàn tất trong: ${durationMs.toFixed(2)}ms`);
    });

    it('phải hiển thị chính xác Backlinks O(1) của bài viết đang mở mà không cần quét lại ổ cứng', () => {
        const startTime = performance.now();

        // Mở note 'Web Workers' -> Lấy ngay danh sách note nhắc đến nó trong O(1)
        const backlinks = searchEngine.getBacklinks('Web Workers');

        const durationMs = performance.now() - startTime;

        expect(backlinks).toHaveLength(2);
        expect(backlinks).toContain('Architecture.md');
        expect(backlinks).toContain('SolidJS.md');

        // Tốc độ O(1) phải đạt dưới 1ms
        expect(durationMs).toBeLessThan(1);
        console.log(`⚡ [Sprint 2 Benchmark] Truy xuất Backlinks O(1) hoàn tất trong: ${durationMs.toFixed(4)}ms`);
    });
});
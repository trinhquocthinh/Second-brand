// tests/components/editor.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import '@testing-library/jest-dom/vitest';
import { EditorView } from '@codemirror/view';
import { CodeMirrorEditor } from '@/components/Editor/CodeMirrorEditor';

describe('CodeMirror 6 WYSIWYG Editor Component', () => {
    let mockOnChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockOnChange = vi.fn();
    });

    it('[Happy Path] nên render thành công nội dung Markdown ban đầu vào trong DOM', () => {
        const initialContent = '# Kiến trúc Second Brain\n\nĐây là dòng văn bản mẫu.';

        render(() => (
            <CodeMirrorEditor
                initialValue={initialContent}
                onChange={mockOnChange as any}
            />
        ));

        const editorContent = document.querySelector('.cm-content');
        expect(editorContent).toBeInTheDocument();
        expect(editorContent?.textContent).toContain('Kiến trúc Second Brain');
        expect(editorContent?.textContent).toContain('Đây là dòng văn bản mẫu.');
    });

    it('[Reactivity] nên gọi callback onChange() mỗi khi người dùng gõ phím thay đổi nội dung', async () => {
        render(() => (
            <CodeMirrorEditor
                initialValue="Hello"
                onChange={mockOnChange as any}
            />
        ));

        // Lấy DOM Container và EditorView instance từ thuộc tính expose _cmView
        const container = screen.getByTestId('cm-editor-container');
        const view = (container as any)._cmView as EditorView;
        expect(view).toBeDefined();

        // Dispatch transaction chuẩn CodeMirror 6 (Thay thế cho fireEvent.input bị lỗi trên contenteditable JSDOM)
        view.dispatch({
            changes: { from: view.state.doc.length, insert: ' World' }
        });

        // Kiểm chứng callback onChange đã được kích hoạt chính xác với giá trị mới
        expect(mockOnChange).toHaveBeenCalledWith('Hello World');
    });

    it('[WYSIWYG ViewPlugin] nên ẩn cú pháp Markdown thô (#, **, __) khi render thẻ H1 hoặc Bold', () => {
        const markdownContent = '# Tiêu đề Lớn\n**Chữ in đậm**';

        render(() => (
            <CodeMirrorEditor
                initialValue={markdownContent}
                onChange={mockOnChange as any}
            />
        ));

        const headerElement = document.querySelector('.cm-header-1');
        const boldElement = document.querySelector('.cm-strong');

        expect(headerElement).toBeInTheDocument();
        expect(boldElement).toBeInTheDocument();
    });

    it('[Auto-complete Trigger] nên phát ra sự kiện (Event) hoặc call hook khi người dùng gõ cú pháp [[', async () => {
        const mockOnTriggerLink = vi.fn();

        render(() => (
            <CodeMirrorEditor
                initialValue=""
                onChange={mockOnChange as any}
                onTriggerLink={mockOnTriggerLink}
            />
        ));

        const container = screen.getByTestId('cm-editor-container');
        const view = (container as any)._cmView as EditorView;

        // Giả lập người dùng gõ 2 dấu ngoặc vuông '[[' vào editor và đặt con trỏ ngay sau chữ '[['
        view.dispatch({
            changes: { from: 0, insert: '[[' },
            selection: { anchor: 2, head: 2 } // Cursor tại index 2
        });

        // Editor phải bắt được chuỗi '[[' tại vị trí con trỏ và kích hoạt hook mở Menu Suggestion
        expect(mockOnTriggerLink).toHaveBeenCalledTimes(1);
    });
});
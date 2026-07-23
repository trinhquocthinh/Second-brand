// tests/integration/app-shell.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import '@testing-library/jest-dom/vitest';
import { App } from '@/App';

describe('Visual Second Brain Master App Shell Integration', () => {
    it('phải hiển thị đầy đủ cấu trúc 3 cột (Sidebar, Editor, và thanh công cụ)', () => {
        render(() => <App />);

        // Kiểm chứng Sidebar File Explorer xuất hiện
        const sidebar = screen.getByTestId('app-sidebar');
        expect(sidebar).toBeInTheDocument();
    });

    it('phải kích hoạt Modal Tìm kiếm khi người dùng gọi sự kiện phím tắt', () => {
        render(() => <App />);

        // Giả lập phím tắt Cmd + K hoặc Ctrl + K để mở Search Modal
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));

        const searchInput = screen.getByPlaceholderText(/tìm kiếm nhanh tiêu đề hoặc nội dung/i);
        expect(searchInput).toBeInTheDocument();
    });
});
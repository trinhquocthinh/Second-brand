import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@solidjs/testing-library';
import '@testing-library/jest-dom/vitest';
import { GraphView } from '@/components/Graph/GraphView';
import { NoteMetadata } from '@/workers/types';
import { FLOATS_PER_NODE } from '@/workers/physics.types';

describe('WebGL2 PixiJS Force-Directed Graph View Component', () => {
    const sampleNotes: NoteMetadata[] = [
        { id: 'Core.md', title: 'Core MVP', links: ['SolidJS.md'], tags: ['tech'], size: 100 },
        { id: 'SolidJS.md', title: 'SolidJS Reactivity', links: [], tags: ['frontend'], size: 80 }
    ];

    let mockOnNodeClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockOnNodeClick = vi.fn();
    });

    it('[Happy Path] nên render thành công DOM Container và khởi tạo thẻ <canvas> cho WebGL2', () => {
        render(() => (
            <GraphView
                notes={sampleNotes}
                onNodeClick={mockOnNodeClick}
            />
        ));

        // Kiểm chứng container tồn tại
        const container = screen.getByTestId('graph-view-container');
        expect(container).toBeInTheDocument();

        // PixiJS tự động tạo ra một thẻ <canvas> bên trong container
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeInTheDocument();
    });

    it('[Zero-Copy Memory Sync] khi truyền notes vào, component phải tự động cấp phát SharedArrayBuffer đúng kích thước', () => {
        render(() => (
            <GraphView
                notes={sampleNotes}
                onNodeClick={mockOnNodeClick}
            />
        ));

        const container = screen.getByTestId('graph-view-container');

        // Kiểm chứng instance nội bộ (chỉ dành cho test) đã khởi tạo buffer
        const sharedBuffer = (container as any)._sharedBuffer as SharedArrayBuffer;
        expect(sharedBuffer).toBeDefined();

        // Kích thước mong đợi: 2 notes * 4 floats * 4 bytes = 32 bytes
        const expectedBytes = sampleNotes.length * FLOATS_PER_NODE * Float32Array.BYTES_PER_ELEMENT;
        expect(sharedBuffer.byteLength).toBe(expectedBytes);
    });

    it('[Node Interaction] nên kích hoạt callback onNodeClick khi người dùng click vào một Node trên bản đồ', () => {
        render(() => (
            <GraphView
                notes={sampleNotes}
                onNodeClick={mockOnNodeClick}
            />
        ));

        const container = screen.getByTestId('graph-view-container');

        // Giả lập trigger event click từ bộ điều khiển PixiJS (Expose ra container)
        const simulatePixiClick = (container as any)._simulateNodeClick;
        if (simulatePixiClick) {
            simulatePixiClick('Core.md');
        }

        expect(mockOnNodeClick).toHaveBeenCalledWith('Core.md');
        expect(mockOnNodeClick).toHaveBeenCalledTimes(1);
    });
});
// src/components/Editor/CodeMirrorEditor.tsx
import { onMount, onCleanup } from 'solid-js';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { wysiwygPlugin } from './plugins/wysiwygPlugin';

export interface CodeMirrorEditorProps {
    initialValue: string;
    onChange: (value: string) => void;
    onTriggerLink?: () => void;
}

export const CodeMirrorEditor = (props: CodeMirrorEditorProps) => {
    let containerRef!: HTMLDivElement;
    let view: EditorView | undefined;

    onMount(() => {
        // 1. Lắng nghe thay đổi từ Editor (Reactivity & Bi-directional Link Trigger)
        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                const newValue = update.state.doc.toString();

                // Gọi callback onChange cập nhật state cho SolidJS
                props.onChange(newValue);

                // Kiểm tra cú pháp trigger liên kết 2 chiều '[['
                const head = update.state.selection.main.head;
                const sliceBeforeCursor = update.state.doc.sliceString(Math.max(0, head - 2), head);

                if (sliceBeforeCursor === '[[' || newValue.endsWith('[[')) {
                    props.onTriggerLink?.();
                }
            }
        });

        // 2. Khởi tạo EditorState với các Extensions cấp độ Senior
        const state = EditorState.create({
            doc: props.initialValue,
            extensions: [
                keymap.of(defaultKeymap),
                markdown(),
                wysiwygPlugin,
                updateListener,
                EditorView.theme({
                    "&": { height: "100%", backgroundColor: "transparent", color: "#f8fafc" },
                    ".cm-content": { padding: "16px", caretColor: "#38bdf8", fontFamily: "monospace" },
                    "&.cm-focused .cm-cursor": { borderLeftColor: "#38bdf8" },
                    "&.cm-focused": { outline: "none" }
                })
            ]
        });

        // 3. Gắn EditorView vào DOM Container
        view = new EditorView({
            state,
            parent: containerRef
        });

        // CHUẨN SENIOR: Expose EditorView instance ra DOM để phục vụ Unit Test / E2E Automation
        (containerRef as any)._cmView = view;
    });

    onCleanup(() => {
        if (view) {
            view.destroy();
        }
    });

    return (
        <div
            ref={containerRef}
            data-testid="cm-editor-container"
            class="w-full h-full min-h-[500px] border border-slate-700 rounded-lg overflow-hidden bg-slate-900 text-slate-100"
        />
    );
};
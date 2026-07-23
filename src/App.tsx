// src/App.tsx
import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { useAppStore } from '@/store/appStore';
import { CodeMirrorEditor } from '@/components/Editor/CodeMirrorEditor';
import { GraphView } from '@/components/Graph/GraphView';
import { SearchModal } from '@/components/Search/SearchModal';
import { NoteMetadata } from '@/workers/types';

export const App = () => {
  const { state, setCurrentNote, setNotes, toggleGraph, toggleSearchModal } = useAppStore();
  const [activeTab, setActiveTab] = createSignal<'editor' | 'graph'>('editor');

  // Mẫu dữ liệu giả lập khởi tạo cho Local-First App Shell
  const sampleNotes: (NoteMetadata & { content?: string })[] = [
    {
      id: 'Architecture.md',
      title: 'Kiến trúc Second Brain',
      content: '# Kiến trúc Second Brain\nHệ thống sử dụng **SolidJS** kết hợp **CodeMirror 6** và **WebGL2 PixiJS**.',
      links: ['SolidJS.md'], tags: ['tech'], size: 100
    },
    {
      id: 'SolidJS.md',
      title: 'SolidJS Reactivity',
      content: '# SolidJS Reactivity\nFine-Grained Reactivity giúp tối ưu hóa hiệu năng render DOM.',
      links: [], tags: ['frontend'], size: 80
    }
  ];

  onMount(() => {
    setNotes(sampleNotes);
    if (sampleNotes.length > 0) {
      setCurrentNote(sampleNotes[0].id, sampleNotes[0].content || '');
    }

    // Lắng nghe phím tắt toàn cục Cmd + K hoặc Ctrl + K để gọi Search Modal
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearchModal();
      }
    };
    window.addEventListener('keydown', handleGlobalKeydown);
    onCleanup(() => window.removeEventListener('keydown', handleGlobalKeydown));
  });

  return (
    <div class="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* CỘT TRÁI: SIDEBAR FILE EXPLORER */}
      <aside data-testid="app-sidebar" class="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <h1 class="font-bold text-sky-400 tracking-wide text-sm uppercase">Second Brain</h1>
          <button
            onClick={() => toggleSearchModal(true)}
            class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1"
          >
            <span>⌘K</span>
          </button>
        </div>

        {/* Danh sách ghi chú */}
        <div class="flex-1 overflow-y-auto p-2">
          <div class="text-xs font-semibold text-slate-500 px-2 py-1 mb-1 uppercase tracking-wider">Danh sách Note</div>
          {state.notes.map((note) => (
            <div
              onClick={() => setCurrentNote(note.id, note.title)}
              class={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors mb-1 truncate ${state.currentNoteId === note.id ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'text-slate-300 hover:bg-slate-800/60'
                }`}
            >
              📄 {note.title}
            </div>
          ))}
        </div>

        {/* Thanh chuyển đổi tab dưới Sidebar */}
        <div class="p-3 border-t border-slate-800 flex gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            class={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${activeTab() === 'editor' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            Soạn thảo
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            class={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${activeTab() === 'graph' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            Graph View
          </button>
        </div>
      </aside>

      {/* VÙNG TRUNG TÂM / PHẢI: HIỂN THỊ EDITOR HOẶC WEBGL GRAPH */}
      <main class="flex-1 flex flex-col h-full overflow-hidden relative">
        <Show when={activeTab() === 'editor'} fallback={
          <div class="w-full h-full p-4">
            <GraphView notes={state.notes} onNodeClick={(id) => setCurrentNote(id, '')} />
          </div>
        }>
          <div class="w-full h-full flex flex-col p-4">
            <div class="mb-2 text-xs text-slate-400 font-mono">
              Đang chỉnh sửa: <span class="text-sky-400 font-semibold">{state.currentNoteId || 'Chưa chọn file'}</span>
            </div>
            <div class="flex-1 rounded-xl overflow-hidden border border-slate-800">
              <CodeMirrorEditor
                initialValue={state.currentContent}
                onChange={(val) => {
                  // Cập nhật state nội dung
                }}
                onTriggerLink={() => {
                  // Kích hoạt gợi ý liên kết [[
                }}
              />
            </div>
          </div>
        </Show>
      </main>

      {/* MODAL TÌM KIẾM TOÀN VĂN BẢN (Cmd + K) */}
      <SearchModal
        isOpen={state.isSearchModalOpen}
        onClose={() => toggleSearchModal(false)}
        notes={sampleNotes}
        onSelectNote={(id) => {
          setCurrentNote(id, '');
          setActiveTab('editor');
        }}
      />
    </div>
  );
};
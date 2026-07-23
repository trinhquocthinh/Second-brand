// src/components/Search/SearchModal.tsx
import { createSignal, For, Show, onMount, onCleanup } from 'solid-js';
import { FullTextSearchEngine, FullTextSearchResult } from '@/workers/fulltext.engine';
import { NoteMetadata } from '@/workers/types';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    notes: (NoteMetadata & { content?: string })[];
    onSelectNote: (noteId: string) => void;
}

export const SearchModal = (props: SearchModalProps) => {
    let inputRef!: HTMLInputElement;
    const [query, setQuery] = createSignal('');
    const [results, setResults] = createSignal<FullTextSearchResult[]>([]);

    const searchEngine = new FullTextSearchEngine();

    // Index notes khi modal mở hoặc danh sách notes thay đổi
    onMount(() => {
        searchEngine.index(props.notes);
        inputRef?.focus();

        // Lắng nghe phím tắt ESC để đóng modal
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') props.onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
    });

    const handleInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        setQuery(val);
        setResults(searchEngine.search(val));
    };

    return (
        <Show when={props.isOpen}>
            <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/80 backdrop-blur-sm">
                <div class="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                    {/* Input tìm kiếm */}
                    <div class="flex items-center px-4 py-3 border-b border-slate-800">
                        <svg class="w-5 h-5 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query()}
                            onInput={handleInput}
                            placeholder="Tìm kiếm nhanh tiêu đề hoặc nội dung ghi chú (Cmd + K)..."
                            class="w-full bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-lg"
                        />
                        <button
                            onClick={props.onClose}
                            class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded border border-slate-700"
                        >
                            ESC
                        </button>
                    </div>

                    {/* Danh sách kết quả */}
                    <div class="max-h-96 overflow-y-auto p-2">
                        <Show when={results().length > 0} fallback={
                            <div class="py-8 text-center text-slate-500 text-sm">
                                {query() ? 'Không tìm thấy ghi chú phù hợp.' : 'Nhập từ khóa để bắt đầu tìm kiếm toàn văn bản...'}
                            </div>
                        }>
                            <For each={results()}>
                                {(item) => (
                                    <div
                                        onClick={() => { props.onSelectNote(item.id); props.onClose(); }}
                                        class="flex flex-col px-4 py-3 hover:bg-slate-800/80 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-700/50 mb-1"
                                    >
                                        <span class="text-sky-400 font-semibold text-base">{item.title}</span>
                                        <span class="text-slate-400 text-xs font-mono mt-0.5">{item.id}</span>
                                    </div>
                                )}
                            </For>
                        </Show>
                    </div>
                </div>
            </div>
        </Show>
    );
}
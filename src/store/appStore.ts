// src/store/appStore.ts
import { createStore } from "solid-js/store";
import { NoteMetadata } from "@/workers/types";

interface AppState {
  currentNoteId: string | null;
  currentContent: string;
  notes: NoteMetadata[];
  isGraphOpen: boolean;
  isSearchModalOpen: boolean;
}

const [state, setState] = createStore<AppState>({
  currentNoteId: null,
  currentContent: "",
  notes: [],
  isGraphOpen: false,
  isSearchModalOpen: false,
});

export const useAppStore = () => {
  return {
    state,
    setCurrentNote: (id: string, content: string) => setState({ currentNoteId: id, currentContent: content }),
    setNotes: (notes: NoteMetadata[]) => setState({ notes }),
    toggleGraph: () => setState("isGraphOpen", (prev) => !prev),
    toggleSearchModal: (isOpen?: boolean) =>
      setState("isSearchModalOpen", (prev) => (isOpen !== undefined ? isOpen : !prev)),
  };
};

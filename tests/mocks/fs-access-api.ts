import { vi } from "vitest";

// 1. Mock FileSystemFileHandle
export class MockFileSystemFileHandle {
  kind = "file" as const;
  name: string;
  private content: string;

  constructor(name: string, content: string = "") {
    this.name = name;
    this.content = content;
  }

  async getFile(): Promise<File> {
    const blob = new Blob([this.content], { type: "text/markdown" });
    return new File([blob], this.name, { type: "text/markdown", lastModified: Date.now() });
  }

  async createWritable() {
    return {
      write: async (data: string) => {
        this.content = data;
      },
      close: async () => {},
    };
  }
}

// 2. Mock FileSystemDirectoryHandle (Hỗ trợ Async Iteration cho stream reader)
export class MockFileSystemDirectoryHandle {
  kind = "directory" as const;
  name: string;
  private entriesMap: Map<string, MockFileSystemFileHandle | MockFileSystemDirectoryHandle>;

  constructor(name: string) {
    this.name = name;
    this.entriesMap = new Map();
  }

  addChild(handle: MockFileSystemFileHandle | MockFileSystemDirectoryHandle) {
    this.entriesMap.set(handle.name, handle);
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    if (this.entriesMap.has(name)) {
      const handle = this.entriesMap.get(name);
      if (handle?.kind === "directory") return handle;
    }
    if (options?.create) {
      const newDir = new MockFileSystemDirectoryHandle(name);
      this.addChild(newDir);
      return newDir;
    }
    throw new DOMException(
      "An attempt was made to reference a Node in a context where it does not exist.",
      "NotFoundError",
    );
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    if (this.entriesMap.has(name)) {
      const handle = this.entriesMap.get(name);
      if (handle?.kind === "file") return handle;
    }
    if (options?.create) {
      const newFile = new MockFileSystemFileHandle(name, "");
      this.addChild(newFile);
      return newFile;
    }
    throw new DOMException(
      "A requested file or directory could not be found at the time an operation was processed.",
      "NotFoundError",
    );
  }

  async *values() {
    for (const value of this.entriesMap.values()) {
      yield value;
    }
  }

  async *entries() {
    for (const [key, value] of this.entriesMap.entries()) {
      yield [key, value];
    }
  }

  [Symbol.asyncIterator]() {
    return this.entries();
  }
}

// 3. Helper trình điều khiển Mock cho Test Cases
export const setupFSMocks = () => {
  const mockRoot = new MockFileSystemDirectoryHandle("My-Second-Brain-Vault");
  const mockNote1 = new MockFileSystemFileHandle("Architecture.md", "# Architecture\n\n[[SolidJS]] is great.");
  const mockNote2 = new MockFileSystemFileHandle("SolidJS.md", "# SolidJS\n\nFine-grained reactivity.");

  mockRoot.addChild(mockNote1);
  mockRoot.addChild(mockNote2);

  const showDirectoryPickerMock = vi.fn().mockResolvedValue(mockRoot);

  // Inject vào global window object
  Object.defineProperty(window, "showDirectoryPicker", {
    value: showDirectoryPickerMock,
    writable: true,
    configurable: true,
  });

  return {
    mockRoot,
    showDirectoryPickerMock,
    simulatePermissionDenied: () => {
      showDirectoryPickerMock.mockRejectedValueOnce(new DOMException("The user aborted a request.", "AbortError"));
    },
    simulateBrowserIncompatibility: () => {
      // @ts-expect-error Xóa API để giả lập trình duyệt không hỗ trợ (Safari cũ / Firefox)
      delete window.showDirectoryPicker;
    },
  };
};

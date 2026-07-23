# PRODUCT REQUIREMENTS DOCUMENT (PRD) & TECHNICAL SPECIFICATION (TECH SPEC)
**Project Name:** Visual "Second Brain" – Local-First Markdown Knowledge Base & Graph Explorer  
**Document Owner:** Senior / Staff Frontend Architect  
**Version:** 1.0.0-MVP  
**Status:** Approved for Engineering Implementation — In Development (Sprint 1–2)

> 📘 Xem thêm: [Hướng dẫn sử dụng](./USER_GUIDE.md) dành cho người dùng cuối · [README dự án](../README.md) dành cho developer.

---

## 0. Tình trạng triển khai hiện tại (Implementation Status Snapshot)

Bảng dưới đây đối chiếu Scope Matrix ở [Phần 3](#part-3-implementation-plan--scope-matrix) với mã nguồn thực tế trong repo tại thời điểm cập nhật tài liệu này, nhằm giúp đội ngũ kỹ thuật nắm chính xác phần nào đã hoàn thiện, phần nào đang dở dang.

| Module | Thành phần mã nguồn | Trạng thái |
| --- | --- | --- |
| Storage & FS Layer | `src/storages/fs-wrapper.ts` (`VaultStorageService`), `src/storages/db.ts` (Dexie cache) | ✅ Hoàn thiện tầng lõi + unit test (`tests/storages/fs-wrapper.test.ts`) |
| AST & Indexing Worker | `src/workers/ast.worker.ts`, `src/workers/parser.ts` | ✅ Hoàn thiện parser Regex trích xuất Title/Links/Tags |
| Kết nối UI ⇄ Vault thật | `src/App.tsx` | 🚧 Đang dùng dữ liệu mẫu (`sampleNotes`) để dựng khung UI; chưa gọi `VaultStorageService.openVault()` từ giao diện |
| Editor (CodeMirror 6 + WYSIWYG nhẹ) | `src/components/Editor/CodeMirrorEditor.tsx`, `plugins/wysiwygPlugin.ts` | ✅ Hoạt động — nhận diện H1, in đậm, trigger `[[` |
| Search Engine (Suggestion/Backlinks) | `src/workers/search.engine.ts` | ✅ Engine lõi hoàn thiện (indexing, backlink HashMap O(1)) |
| Search Engine (Full-text `Cmd+K`) | `src/workers/fulltext.engine.ts` (MiniSearch) | ✅ Hoạt động, tích hợp trong `SearchModal.tsx` |
| Graph View (PixiJS WebGL2 + Physics Worker) | `src/components/Graph/GraphView.tsx`, `src/workers/physics.worker.ts`, `physics.engine.ts` | ✅ Hoạt động, có fallback an toàn khi thiếu GPU/SharedArrayBuffer |
| Backlinks Panel (UI hiển thị) | — | 🚧 Chưa có component UI riêng, engine đã sẵn sàng |
| File Watcher / Multi-vault / Export-Import | — | ⏳ Chưa triển khai (Should-have / Nice-to-have) |

---

# PART 1: PRODUCT REQUIREMENTS DOCUMENT (PRD) & SPEC-DRIVEN DEVELOPMENT (SDD)

## 1. Executive Summary & Core Vision
* **Tóm tắt vấn đề:** Các ứng dụng ghi chú hiện nay trên thị trường bị chia thành hai thái cực: (1) Nhóm Cloud-first (Notion, Roam Research) phụ thuộc 100% vào máy chủ, tốc độ tải chậm khi dữ liệu phình to và mang rủi ro khóa dữ liệu người dùng (vendor lock-in); (2) Nhóm Desktop Native (Obsidian) mang lại hiệu năng cao và sở hữu dữ liệu cục bộ, nhưng dựa trên nền tảng Electron nặng nề, tiêu tốn nhiều RAM và thiếu sự linh hoạt của nền tảng Web thuần túy (Pure Web Engine).
* **Giải pháp (USP - Unique Selling Proposition):** Xây dựng nền tảng Quản lý Kiến thức Cá nhân (PKM - Personal Knowledge Management) hoạt động **100% tại trình duyệt web (Zero-Cloud, Local-First)** dựa trên phương pháp Zettelkasten. Sử dụng **File System Access API** để đọc/ghi trực tiếp vào ổ cứng máy tính mà không cần bất kỳ máy chủ cơ sở dữ liệu nào.
* **Mục tiêu cốt lõi:** Mang lại trải nghiệm gõ phím với độ trễ dưới **16.6ms (chuẩn 60 FPS)**, khả năng kết nối ý tưởng đa chiều (Bi-directional linking) và trực quan hóa mạng lưới kiến thức bằng **Interactive Graph View** với khả năng xử lý mượt mà **10,000+ file ghi chú**.

## 2. Target Audience & Personas
* **Power Users / Researchers / Writers:** Những người cần xử lý khối lượng thông tin phức tạp, muốn tư duy theo mạng lưới liên kết thay vì cấu trúc thư mục phân cấp cứng nhắc.
* **Senior Developers / Software Architects:** Những người ưu tiên quyền làm chủ dữ liệu tuyệt đối (Data Ownership), yêu cầu các file markdown thuần (`.md`) có thể lưu trữ trong Git, đồng thời đòi hỏi tốc độ phản hồi tức thì (Instant feedback).

## 3. Spec-Driven Development (SDD) - User Stories & Acceptance Criteria

| ID | User Story (Với vai trò là...) | Mong muốn (Tôi muốn...) | Mục đích (Để...) | Acceptance Criteria (Tiêu chí nghiệm thu chuẩn Senior) |
| :--- | :--- | :--- | :--- | :--- |
| **US-01** | Power User | Cấp quyền truy cập vào một thư mục `.md` cục bộ trên máy tính chỉ với 1 cú click. | Không phải upload dữ liệu lên Cloud hay đăng ký tài khoản rườm rà. | • Trình duyệt sử dụng `window.showDirectoryPicker()` để nhận quyền đọc/ghi.<br>• Thư mục gốc (Vault Handle) được lưu vào `IndexedDB` để tự động kết nối lại ở các phiên làm việc sau mà không cần chọn lại folder.<br>• Quét và index 5,000 file `.md` ban đầu trong thời gian dưới **1.5 giây**. |
| **US-02** | Writer / Dev | Gõ cú pháp `[[Tên Ghi Chú]]` trong trình soạn thảo Markdown WYSIWYG. | Tạo liên kết hai chiều (Bi-directional link) giữa các bài ghi chú một cách thần tốc. | • Khi gõ `[[`, một Auto-complete Dropdown hiện ra trong dưới **10ms**.<br>• Hỗ trợ tìm kiếm gần đúng (Fuzzy search) tên note trong menu gợi ý.<br>• Khi tạo link, hệ thống tự động cập nhật danh sách **Backlinks** (Các bài viết dẫn link tới bài hiện tại) ở background thread. |
| **US-03** | Visual Thinker | Mở chế độ **Interactive Graph View** để xem toàn bộ mạng lưới ý tưởng. | Khám phá các vùng kiến thức (Clusters) và phát hiện các ý tưởng cô lập (Orphan notes). | • Render đồ thị Force-Directed cho tối thiểu **5,000 nodes và 15,000 edges**.<br>• Duy trì tốc độ khung hình ổn định ở mức **60 FPS** khi cuộn, zoom hoặc kéo thả node.<br>• Kích thước node tự động phình to dựa trên độ đo trung tâm (PageRank / Degree Centrality). |
| **US-04** | Researcher | Sử dụng phím tắt `Ctrl/Cmd + K` để tìm kiếm toàn văn bản (Full-text search) trên toàn bộ Vault. | Tìm ra thông tin chính xác trong hàng ngàn bài viết chỉ trong nháy mắt. | • Thời gian phản hồi từ lúc gõ phím đến lúc hiển thị kết quả highlight phải dưới **16ms**.<br>• Tích hợp bộ gõ tìm kiếm chịu lỗi chính tả (Typo-tolerance) và hỗ trợ tìm kiếm theo cú pháp Boolean (`AND`, `OR`, `NOT`). |

## 4. Non-Functional Requirements (NFRs) & Performance Budgets
* **Typing Latency Budget:** Độ trễ từ lúc sự kiện `keydown` xảy ra đến khi DOM cập nhật ký tự và render syntax highlight không vượt quá **16.6ms** (đảm bảo 60 FPS frame time).
* **Memory Footprint:** Tổng lượng RAM tiêu thụ của trình duyệt không vượt quá **250MB** khi mở Vault chứa 10,000 file markdown (nhờ cơ chế Virtualization và Offloading).
* **Zero Network Dependency:** 100% các tính năng cốt lõi (đọc/ghi file, dựng Graph, tìm kiếm) phải hoạt động ngoại tuyến (Offline-first) hoàn toàn.

---

# PART 2: TECHNICAL SPECIFICATION (TECH SPEC) & ARCHITECTURE DESIGN

## 1. High-Level System Architecture (Sơ đồ kiến trúc tổng thể)
Hệ thống được thiết kế theo mô hình **Multi-Threaded Actor Architecture**, cô lập hoàn toàn luồng giao diện (Main UI Thread) khỏi các tác vụ tính toán nặng (Parsing, Physics computation, Indexing) thông qua **Web Workers** và **Message Passing**.

```
+-----------------------------------------------------------------------------------------------+
|                                  MAIN THREAD (UI & Reactivity)                                |
|  +-------------------------+  +---------------------------+  +-----------------------------+  |
|  |   SolidJS UI Components |  |   CodeMirror 6 Editor     |  |     PixiJS / WebGL Canvas   |  |
|  |   (Sidebar, Tabs, CMD+K)|  |   (WYSIWYG Markdown Core) |  |     (Graph View Renderer)   |  |
|  +-------------------------+  +---------------------------+  +-----------------------------+  |
+-----------------------------------------------^-----------------------------------------------+
                                                |  PostMessage / SharedArrayBuffer (Zero-Copy)
+-----------------------------------------------v-----------------------------------------------+
|                             WORKER LAYER (Multi-Threading Engine)                             |
|  +-------------------------+  +---------------------------+  +-----------------------------+  |
|  |     FS & AST Worker     |  |   Search & Index Worker   |  |     Physics Graph Worker    |  |
|  |  • File Stream Reader   |  |  • MiniSearch / FlexSearch|  |  • D3-Force Math Calculation|  |
|  |  • Markdown AST Parser  |  |  • In-memory Inverted Ind.|  |  • PageRank Centrality Calc.|  |
|  +-------------------------+  +---------------------------+  +-----------------------------+  |
+-----------------------------------------------^-----------------------------------------------+
                                                |  Async Read/Write Streams
+-----------------------------------------------v-----------------------------------------------+
|                          STORAGE EDGE & HARDWARE LAYER (Local-First)                          |
|  +---------------------------------------------------+  +----------------------------------+  |
|  |           File System Access API (FS)             |  |        IndexedDB (Dexie.js)      |  |
|  |   • Read/Write pure .md files directly to disk    |  |   • Cache Directory Handles      |  |
|  |   • Zero database lock-in, 100% data ownership    |  |   • Store AST Metadata & Vector  |  |
|  +---------------------------------------------------+  +----------------------------------+  |
+-----------------------------------------------------------------------------------------------+
```

## 2. Core Tech Stack Selection & Senior Justification
* **Core Framework: SolidJS + Vite**
  * *Justification:* SolidJS không sử dụng Virtual DOM (VDOM), tiến hành biên dịch code thành các DOM node thực tế với cơ chế **Fine-Grained Reactivity**. Khi một node trong cây thư mục 10,000 file cập nhật trạng thái, chỉ đúng DOM text-node đó được cập nhật mà không gây re-render component cha.
* **Rich-Text & Markdown Engine: CodeMirror 6**
  * *Justification:* CodeMirror 6 được xây dựng từ đầu với kiến trúc **Functional State & Immutable Data Structures**. Hỗ trợ cực tốt việc viết Custom Extension (Plugin), quản lý Viewport Virtualization (chỉ render các dòng code đang hiển thị trên màn hình), và xử lý cú pháp `[[Link]]` qua cơ chế State Field cực kỳ tối ưu cho hiệu năng gõ phím.
* **Graph Rendering Engine: PixiJS (WebGL2 Canvas) + Web Worker**
  * *Justification:* Thay vì dùng SVG thuần (D3.js SVG renderer sẽ làm sập trình duyệt khi vượt quá 1,000 DOM nodes do chi phí tính toán layout của trình duyệt), hệ thống sử dụng **PixiJS** để render các Node/Edge dưới dạng **WebGL GPU Shaders**.
* **Search Engine: MiniSearch / FlexSearch (Chạy trên Web Worker)**
  * *Justification:* Thư viện tìm kiếm toàn văn bản trong bộ nhớ (In-memory Inverted Indexing) với khả năng nén index theo thuật toán Radix Tree, giúp tìm kiếm trên 10,000 tài liệu chỉ tốn dưới **10ms** mà không làm đơ UI.
* **Local Storage Layer: File System Access API + Dexie.js (IndexedDB)**
  * *Justification:* Trình duyệt giao tiếp trực tiếp với hệ điều hành thông qua `FileSystemDirectoryHandle`. `IndexedDB` chỉ đóng vai trò là "Metadata Cache Layer" (lưu vị trí tọa độ node trên Graph, lưu cache của AST) để khởi động app tức thì (Instant Startup).

## 3. Deep Dive 1: Local-First File System & AST Indexing Pipeline
Khi người dùng bấm "Open Vault", thách thức lớn nhất là làm sao đọc và quét cú pháp của 10,000 file `.md` mà không làm treo trình duyệt.

```
[User Selects Folder] 
       │
       ▼ (FileSystemDirectoryHandle)
[FS & AST Worker] ──(Async Iteration)──► Read File Streams (100 concurrent batches)
       │
       ▼
[Markdown AST Parser] ──(Regex/Remark)──► Extract Metadata (Titles, [[Links]], #Tags)
       │
       ├────────────────────────────────────────┬────────────────────────────────────────┐
       ▼                                        ▼                                        ▼
[Update Inverted Index]               [Build Graph Topology]                   [Cache to IndexedDB]
(Send to Search Worker)              (Nodes & Edges Matrix)                 (Fast Boot for Next Session)
```

**Chiến lược kỹ thuật:**
1. **Batching Stream Reader:** Web Worker sử dụng vòng lặp bất đồng bộ (`for await...of`) qua các `FileSystemFileHandle`, đọc file theo từng cụm (batch 100 files/lần) bằng `file.text()`.
2. **Lightweight AST Parsing:** Thay vì parse toàn bộ cây AST nặng nề, Worker chạy một bộ State-Machine Regex siêu nhẹ chỉ để trích xuất 3 thực thể cốt lõi: Tiêu đề H1 (`# Title`), Liên kết hai chiều (`[[Target Note]]`), và Thẻ phân loại (`#tag`).
3. **Incremental Indexing:** Ngay khi parse xong batch 100 file đầu tiên, Worker gửi `PostMessage` chứa Metadata về Main Thread để hiển thị danh sách lên UI ngay lập tức (Progressive Rendering), người dùng có thể tương tác ngay trong khi 9,900 file còn lại đang được index ngầm ở background.

## 4. Deep Dive 2: Bi-Directional Linking & Auto-Complete Engine
Để tính năng gõ `[[` đạt tốc độ phản hồi dưới **10ms**:
* **In-Memory Prefix Tree (Trie):** Search Worker duy trì một cây Radix Trie chứa tiêu đề của toàn bộ các note trong Vault.
* **Zero-Latency Trigger:** Khi CodeMirror 6 phát hiện chuỗi `[[` tại vị trí con trỏ (Cursor Position), một sự kiện được dispatch xuống Worker. Worker duyệt cây Trie và trả về danh sách Top 10 gợi ý trong dưới 3ms.
* **O(1) Backlink Resolution:** Khi một file `A.md` có chứa `[[B]]` được lưu, Engine cập nhật Bảng băm (HashMap) liên kết: `BacklinksMap.get('B').add('A')`. Danh sách Backlinks dưới chân mỗi bài viết được truy xuất với độ phức tạp **O(1)** mà không cần quét lại toàn bộ ổ cứng.

## 5. Deep Dive 3: High-Performance Force-Directed Graph Architecture
Đây là "điểm chạm Senior" giải quyết bài toán nút thắt cổ chai (Bottleneck) của đồ họa trình duyệt:

1. **Offloading Physics Calculation:** Toàn bộ thuật toán tính toán lực đẩy tĩnh điện (Coulomb's Law) và lực kéo lò xo (Hooke's Law) của D3-Force được chạy hoàn toàn bên trong **Physics Web Worker**.
2. **SharedArrayBuffer for Zero-Copy Data Transfer:** Để tránh chi phí serialize/deserialize JSON qua lại giữa Worker và Main Thread cho 10,000 tọa độ `(X, Y)` sau mỗi khung hình (60 lần/giây), hệ thống cấp phát một vùng nhớ chia sẻ **`SharedArrayBuffer`**.
   * Worker ghi tọa độ mới thẳng vào bộ nhớ đệm nhị phân (Float32Array).
   * Main Thread đọc trực tiếp từ bộ nhớ đệm này để đẩy vào WebGL Buffer.
3. **PageRank Algorithm Integration:** Worker tính toán điểm số Centrality cho từng Node:
   $$	ext{PR}(u) = rac{1-d}{N} + d \sum_{v \in B(u)} rac{	ext{PR}(v)}{L(v)}$$
   * Node có điểm PageRank cao sẽ được quy định bán kính vẽ lớn hơn và màu sắc nổi bật hơn trên PixiJS Canvas.

---

# PART 3: IMPLEMENTATION PLAN & SCOPE MATRIX

## 1. Scope Matrix (Ma trận Phân bổ Tính năng)

| Module / Tính năng | Must-Have (MVP - Giai đoạn 1) | Should-Have (Giai đoạn 2 - Scale) | Nice-to-Have (Giai đoạn 3 - Bleeding-Edge) |
| :--- | :--- | :--- | :--- |
| **Storage & FS Layer** | • Kết nối thư mục qua File System Access API.<br>• Quét & đọc file `.md` cục bộ.<br>• Cache quyền truy cập vào IndexedDB. | • Theo dõi thay đổi file từ bên ngoài (File Watcher / Polling).<br>• Hỗ trợ cấu trúc nhiều Vault độc lập. | • Tự động commit & push ngầm lên Git Repo cục bộ (via `isomorphic-git` WASM). |
| **Markdown Editor** | • Trình soạn thảo CodeMirror 6 WYSIWYG.<br>• Syntax Highlight cho Markdown.<br>• Auto-complete menu cho cú pháp `[[ ]]`. | • Split-Pane Multi-Tab (Mở 2-3 note song song trên màn hình).<br>• Hỗ trợ render Bảng (Table), Checkbox, và Katex Math. | • Tích hợp chế độ Vim / Emacs Keybindings.<br>• Live Collaboration (Cộng tác thời gian thực qua LAN). |
| **Graph View Engine** | • Vẽ mạng lưới Node/Edge bằng PixiJS (WebGL).<br>• Tính toán lực đẩy D3-Force trên Web Worker.<br>• Zoom, Pan, Drag & Drop Node mượt mà ở 60FPS. | • Tự động tô màu Node theo Thẻ (`#tag`) hoặc Thư mục.<br>• Tính năng "Local Graph" (Chỉ hiện các node có liên kết cấp 1-2 với note hiện tại). | • Time-lapse Animation (Phát lại quá trình hình thành "Bộ não thứ hai" theo thời gian tạo note). |
| **Search & Navigation** | • Full-text Search bằng MiniSearch dưới 16ms.<br>• Modal Quick Open (`Cmd + K`).<br>• Hiển thị danh sách Backlinks & Outgoing Links. | • Tìm kiếm theo toán tử nâng cao (`path:`, `tag:`, `content:`).<br>• Lịch sử điều hướng (Back / Forward history buttons). | • **AI Semantic Search:** Chạy Local LLM (Transformers.js / WebGPU) để tìm các bài viết có ngữ cảnh tương tự mà không cần trùng từ khóa. |
| **Sync & P2P** | *(Không áp dụng cho MVP - Tập trung 100% Local)* | • Xuất/Nhập cấu hình và dữ liệu Vault ra file nén `.zip`. | • **P2P Wi-Fi Sync:** Đồng bộ ngang hàng qua WebRTC Data Channels giữa Laptop và Điện thoại không cần Server. |

## 2. Phased Implementation Plan (Lộ trình Thực thi 6 Tuần)

### Sprint 1 (Tuần 1 - 2): Foundation, Local Storage Engine & AST Worker Pipeline
* **Mục tiêu:** Xây dựng bộ khung Monorepo (Vite + SolidJS), thiết lập lớp giao tiếp ổ cứng và hệ thống phân tích cú pháp ngầm.
* **Công việc kỹ thuật:**
  1. Viết Wrapper cho `File System Access API`, xử lý các edge-case về quyền truy cập (Permissions Policy) trên các trình duyệt Chromium.
  2. Xây dựng **FS & AST Web Worker**: Triển khai thuật toán đọc file stream theo batch và viết parser bằng Regex để trích xuất metadata (`titles`, `links`, `tags`).
  3. Thiết lập **Dexie.js (IndexedDB)** làm tầng Cache Metadata, đảm bảo thời gian khởi động ứng dụng cho lần thứ hai dưới **300ms**.
* **Milestone Nghiệm thu:** App mở được folder chứa 5,000 file markdown mẫu, quét và hiển thị danh sách cây thư mục lên UI mà Main Thread không bị rớt một frame nào (0% UI Freeze).

### Sprint 2 (Tuần 3 - 4): CodeMirror 6 WYSIWYG Editor & Bi-Directional Linking
* **Mục tiêu:** Hoàn thiện trải nghiệm soạn thảo siêu tốc và hệ thống tự động nhận diện liên kết hai chiều.
* **Công việc kỹ thuật:**
  1. Tích hợp **CodeMirror 6**, viết Custom ViewPlugin để render trực tiếp các cú pháp Markdown (bôi đậm, in nghiêng, tiêu đề) thành Rich-Text ngay khi gõ.
  2. Viết Custom Auto-complete Extension cho cú pháp `[[`: Kết nối sự kiện gõ phím với Search Worker qua `PostMessage` để trả về danh sách gợi ý note trong dưới **10ms**.
  3. Xây dựng **Backlinks Panel**: Khi một file `.md` được mở, tự động truy vấn HashMap từ Worker để hiển thị danh sách các note đang link tới nó kèm theo đoạn văn bản ngữ cảnh (Context snippet).
* **Milestone Nghiệm thu:** Gõ phím mượt mà ở tốc độ 60FPS, tính năng tạo link `[[ ]]` hoạt động tức thì, nhấp vào link chuyển bài viết với độ trễ dưới **5ms**.

### Sprint 3 (Tuần 5 - 6): WebGL Force-Directed Graph View & Instant Search Engine
* **Mục tiêu:** Trực quan hóa mạng lưới kiến thức bằng GPU và tích hợp bộ máy tìm kiếm toàn văn bản tốc độ cao.
* **Công việc kỹ thuật:**
  1. Khởi tạo Canvas **PixiJS (WebGL2)**, viết shader để vẽ hàng nghìn hình tròn (Nodes) và đường thẳng (Edges) với chi phí draw-call thấp nhất.
  2. Xây dựng **Physics Worker**: Tích hợp `d3-force-3d` hoặc thuật toán lực đẩy tự viết, kết nối với Main Thread thông qua **`SharedArrayBuffer`** để truyền tọa độ nhị phân theo thời gian thực (Zero-copy).
  3. Tích hợp **MiniSearch** vào Search Worker: Index toàn bộ nội dung text của 5,000 file `.md`, xây dựng modal `Cmd + K` với trải nghiệm tìm kiếm highlight tức thì.
* **Milestone Nghiệm thu:** Graph View trực quan hóa thành công 5,000 nodes, thao tác zoom/pan đạt chuẩn **60 FPS**; Modal tìm kiếm phản hồi kết quả trong dưới **16ms**.

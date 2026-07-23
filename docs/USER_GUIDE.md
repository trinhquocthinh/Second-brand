# 📘 Hướng Dẫn Sử Dụng — Second Brain

> Tài liệu dành cho người dùng cuối (end-user) của ứng dụng **Second Brain** — nền tảng quản lý kiến thức cá nhân (PKM) chạy 100% cục bộ trên trình duyệt.

**Phiên bản tài liệu:** 1.0 · **Áp dụng cho:** `second-brain` v1.0.0 (giai đoạn MVP / Sprint 1–2)

---

## Mục lục

1. [Giới thiệu nhanh](#1-giới-thiệu-nhanh)
2. [Yêu cầu hệ thống](#2-yêu-cầu-hệ-thống)
3. [Cài đặt & khởi chạy](#3-cài-đặt--khởi-chạy)
4. [Làm quen giao diện](#4-làm-quen-giao-diện)
5. [Soạn thảo ghi chú Markdown](#5-soạn-thảo-ghi-chú-markdown)
6. [Liên kết hai chiều `[[...]]` và Tags `#tag`](#6-liên-kết-hai-chiều--và-tags-tag)
7. [Tìm kiếm toàn văn bản (Cmd/Ctrl + K)](#7-tìm-kiếm-toàn-văn-bản-cmdctrl--k)
8. [Graph View — Bản đồ tri thức](#8-graph-view--bản-đồ-tri-thức)
9. [Phím tắt](#9-phím-tắt)
10. [Dữ liệu được lưu ở đâu?](#10-dữ-liệu-được-lưu-ở-đâu)
11. [Xử lý sự cố (Troubleshooting)](#11-xử-lý-sự-cố-troubleshooting)
12. [Câu hỏi thường gặp (FAQ)](#12-câu-hỏi-thường-gặp-faq)
13. [Trạng thái tính năng hiện tại](#13-trạng-thái-tính-năng-hiện-tại)

---

## 1. Giới thiệu nhanh

**Second Brain** là ứng dụng ghi chú theo phương pháp **Zettelkasten** (liên kết ý tưởng phi tuyến tính), hoạt động hoàn toàn trong trình duyệt web mà **không cần server, không cần tài khoản, không upload dữ liệu lên Cloud**.

Ba trụ cột chính của ứng dụng:

| Tính năng | Mô tả ngắn gọn |
| --- | --- |
| ✍️ **Soạn thảo Markdown** | Trình soạn thảo dựa trên CodeMirror 6, hỗ trợ định dạng WYSIWYG nhẹ (tiêu đề, in đậm...) khi gõ. |
| 🔗 **Liên kết hai chiều** | Gõ `[[Tên ghi chú]]` để liên kết các ý tưởng với nhau, tự động dò ngược (backlink). |
| 🕸️ **Graph View** | Trực quan hóa toàn bộ mạng lưới ghi chú dưới dạng đồ thị lực hấp dẫn (force-directed graph) chạy trên WebGL. |
| 🔍 **Tìm kiếm tức thì** | Tìm kiếm toàn văn bản với gợi ý chịu lỗi chính tả (fuzzy search) qua tổ hợp phím `Cmd/Ctrl + K`. |

> 💡 Toàn bộ dữ liệu ghi chú của bạn (khi tính năng đọc/ghi ổ cứng được kết nối đầy đủ ở các bản phát hành sau) sẽ là các file `.md` thuần túy nằm trên máy tính của bạn — không khóa định dạng, có thể đồng bộ bằng Git, Dropbox, v.v.

---

## 2. Yêu cầu hệ thống

Ứng dụng sử dụng các API trình duyệt hiện đại, vì vậy cần lưu ý:

| Yêu cầu | Chi tiết |
| --- | --- |
| **Trình duyệt** | Google Chrome, Microsoft Edge hoặc Brave phiên bản mới (Chromium ≥ 108). Đây là các trình duyệt duy nhất hỗ trợ **File System Access API** (`showDirectoryPicker`). |
| ⚠️ **Không hỗ trợ** | Firefox và Safari **chưa** hỗ trợ đầy đủ File System Access API tại thời điểm viết tài liệu này — một số tính năng đọc/ghi thư mục cục bộ sẽ không khả dụng. |
| **Bộ nhớ** | Khuyến nghị ≥ 4GB RAM trống để xử lý mượt các vault lớn (hàng nghìn ghi chú). |
| **Card đồ họa / WebGL2** | Cần thiết để hiển thị Graph View (PixiJS render bằng WebGL2). Nếu môi trường không có GPU (ví dụ máy ảo/headless), Graph View sẽ tự động rơi vào chế độ dự phòng an toàn. |
| **Kết nối mạng** | **Không bắt buộc** — ứng dụng hoạt động ngoại tuyến hoàn toàn sau khi tải lần đầu. |

---

## 3. Cài đặt & khởi chạy

### Dành cho người dùng kỹ thuật (chạy từ mã nguồn)

```bash
# 1. Cài đặt Node.js phiên bản >= 20 (khuyến nghị dùng nvm)
node -v

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Chạy ứng dụng ở chế độ phát triển
npm run dev
```

Sau khi chạy `npm run dev`, mở trình duyệt và truy cập:

```
http://localhost:5173
```

### Build bản triển khai (production)

```bash
npm run build     # Kiểm tra type + đóng gói vào thư mục dist/
npm run preview   # Xem trước bản build production tại http://localhost:4173
```

> 🔒 **Lưu ý bảo mật quan trọng:** Ứng dụng yêu cầu các header `Cross-Origin-Opener-Policy: same-origin` và `Cross-Origin-Embedder-Policy: require-corp` để có thể sử dụng `SharedArrayBuffer` (phục vụ tính toán Graph vật lý hiệu năng cao). Các header này đã được cấu hình sẵn trong [vite.config.ts](../vite.config.ts) cho môi trường `dev` và `preview`. Nếu bạn tự triển khai lên hosting khác (Vercel, Nginx, Cloudflare Pages...), hãy đảm bảo cấu hình lại 2 header này ở tầng server/CDN.

---

## 4. Làm quen giao diện

Giao diện chính được chia thành 3 khu vực:

```
┌───────────────┬────────────────────────────────────────────┐
│               │                                            │
│   SIDEBAR     │            KHU VỰC NỘI DUNG CHÍNH          │
│  (danh sách   │     (Trình soạn thảo  ⇄  Graph View)       │
│   ghi chú)    │                                            │
│               │                                            │
│  [⌘K]         │                                            │
│               │                                            │
│  📄 Note A    │                                            │
│  📄 Note B    │                                            │
│               │                                            │
│ [Soạn thảo]   │                                            │
│ [Graph View]  │                                            │
└───────────────┴────────────────────────────────────────────┘
```

- **Sidebar (trái):** liệt kê toàn bộ ghi chú hiện có trong phiên làm việc. Nhấp vào một ghi chú để mở nó trong trình soạn thảo. Nút **⌘K** ở góc trên mở hộp thoại tìm kiếm nhanh.
- **Thanh chuyển tab (dưới sidebar):** chuyển đổi giữa chế độ **Soạn thảo** và **Graph View**.
- **Khu vực nội dung chính (phải):** hiển thị trình soạn thảo Markdown hoặc bản đồ đồ thị tri thức tùy theo tab đang chọn.

---

## 5. Soạn thảo ghi chú Markdown

Trình soạn thảo được xây dựng trên nền **CodeMirror 6**, hỗ trợ cú pháp Markdown chuẩn cùng một số hiệu ứng WYSIWYG nhẹ giúp đọc dễ hơn ngay khi gõ:

| Cú pháp bạn gõ | Hiệu ứng hiển thị |
| --- | --- |
| `# Tiêu đề` | Dòng được tô đậm, phóng to như tiêu đề (H1). |
| `**chữ đậm**` | Chữ được tô màu vàng nhạt và in đậm ngay khi gõ. |
| `[[Tên ghi chú]]` | Kích hoạt gợi ý liên kết hai chiều (xem [mục 6](#6-liên-kết-hai-chiều--và-tags-tag)). |
| `#tag` | Được nhận diện là thẻ phân loại (tag) của ghi chú. |

Nội dung soạn thảo được cập nhật theo thời gian thực (fine-grained reactivity của SolidJS) và không yêu cầu thao tác "Lưu" thủ công.

---

## 6. Liên kết hai chiều `[[...]]` và Tags `#tag`

Đây là tính năng cốt lõi theo phương pháp **Zettelkasten**:

1. Trong khi soạn thảo, gõ `[[` để bắt đầu tạo liên kết đến một ghi chú khác.
2. Hệ thống sẽ trích xuất tên ghi chú nằm giữa `[[` và `]]` (ví dụ: `[[Kiến trúc Hệ thống]]`) làm liên kết đi (outgoing link).
3. Có thể đặt tên hiển thị khác bằng cú pháp pipe: `[[Tên-file-thật|Tên hiển thị]]`.
4. Mọi liên kết được lập chỉ mục vào một **Bảng băm Backlink (Backlinks HashMap)** ngay khi lưu, cho phép tra cứu "Ghi chú nào đang trỏ tới ghi chú này?" với độ phức tạp **O(1)** — tức thời, không cần quét lại toàn bộ vault.
5. Gõ `#ten-the` (chữ, số, gạch nối, gạch chéo) ở bất kỳ đâu trong nội dung để gắn thẻ phân loại cho ghi chú. Một ghi chú có thể có nhiều tag.

> 📝 Mẹo: Dùng tag để nhóm chủ đề (`#tech`, `#frontend`...) và dùng liên kết `[[...]]` để nối các ý tưởng liên quan — đây chính là cách tạo ra "bản đồ tri thức" hiển thị ở Graph View.

---

## 7. Tìm kiếm toàn văn bản (Cmd/Ctrl + K)

- Nhấn **`Cmd + K`** (macOS) hoặc **`Ctrl + K`** (Windows/Linux) ở bất kỳ đâu trong ứng dụng để mở hộp thoại tìm kiếm nhanh.
- Gõ từ khóa để tìm theo **tiêu đề**, **nội dung** hoặc **tag** — công cụ tìm kiếm hỗ trợ:
  - **Prefix search:** gõ `Reacti` cũng tìm ra `Reactivity`.
  - **Fuzzy search (chịu lỗi chính tả):** cho phép sai lệch tối đa ~20% ký tự của từ khóa.
  - **Trọng số ưu tiên:** kết quả khớp tiêu đề được xếp hạng cao hơn khớp nội dung.
- Nhấp vào một kết quả (hoặc dùng phím mũi tên + Enter) để mở ngay ghi chú đó trong trình soạn thảo.
- Nhấn **`ESC`** để đóng hộp thoại tìm kiếm.

---

## 8. Graph View — Bản đồ tri thức

Chuyển sang tab **Graph View** ở sidebar để xem toàn bộ mạng lưới ghi chú dưới dạng đồ thị:

- Mỗi **node (nút tròn)** đại diện cho một ghi chú; mỗi **cạnh (edge)** đại diện cho một liên kết `[[...]]` giữa hai ghi chú.
- Vị trí các node được tính toán bằng thuật toán mô phỏng lực vật lý (force-directed layout — lực đẩy Coulomb & lực kéo lò xo Hooke), chạy hoàn toàn trên một **Web Worker riêng** để không làm giật giao diện chính.
- Nhấp vào một node để mở ghi chú tương ứng trong trình soạn thảo.
- Đồ thị được render bằng **WebGL2 (PixiJS)**, cho phép hiển thị mượt hàng nghìn node/cạnh mà không làm treo trình duyệt.

> ⚙️ Nếu trình duyệt/máy của bạn không có GPU khả dụng (ví dụ chạy trong máy ảo hoặc môi trường CI), Graph View sẽ tự động chuyển sang chế độ hiển thị rút gọn an toàn thay vì gây lỗi ứng dụng.

---

## 9. Phím tắt

| Phím tắt | Chức năng |
| --- | --- |
| `Cmd/Ctrl + K` | Mở hộp thoại tìm kiếm toàn văn bản |
| `ESC` | Đóng hộp thoại tìm kiếm |
| `[[` | Kích hoạt gợi ý liên kết hai chiều trong trình soạn thảo |
| Phím soạn thảo mặc định (Ctrl/Cmd + B, Z, Y...) | Kế thừa từ bộ `defaultKeymap` của CodeMirror 6 |

---

## 10. Dữ liệu được lưu ở đâu?

Second Brain vận hành theo triết lý **Local-First — không Cloud, không server**:

- **File Markdown gốc:** khi tính năng "Mở Vault" được kết nối trực tiếp với giao diện (xem [mục 13](#13-trạng-thái-tính-năng-hiện-tại)), toàn bộ ghi chú vẫn là các file `.md` thuần túy nằm nguyên trên ổ cứng của bạn — ứng dụng chỉ đọc/ghi trực tiếp qua **File System Access API**, không sao chép dữ liệu lên máy chủ nào.
- **IndexedDB (trình duyệt):** chỉ lưu **metadata cache** nhẹ (ví dụ: tham chiếu thư mục Vault đã cấp quyền trước đó) để giúp ứng dụng khởi động nhanh hơn ở phiên làm việc sau — không lưu bản sao nội dung ghi chú của bạn.
- **Không có tài khoản, không đăng nhập, không đồng bộ Cloud** ở phiên bản hiện tại.

---

## 11. Xử lý sự cố (Troubleshooting)

| Sự cố | Nguyên nhân khả dĩ | Cách khắc phục |
| --- | --- | --- |
| Trình duyệt báo *"không hỗ trợ chọn thư mục"* | Bạn đang dùng Firefox/Safari hoặc trình duyệt Chromium quá cũ. | Chuyển sang Chrome, Edge hoặc Brave bản mới nhất. |
| Graph View hiển thị màn hình trống | GPU/WebGL2 không khả dụng trong môi trường hiện tại. | Kiểm tra driver đồ họa, thử trình duyệt khác, hoặc chấp nhận chế độ dự phòng (ứng dụng vẫn hoạt động, chỉ Graph không hiển thị animation). |
| Gõ `[[` không hiện gợi ý | Chưa có ghi chú nào được lập chỉ mục, hoặc đang thao tác ở phiên bản demo dữ liệu mẫu. | Đảm bảo vault đã được mở/lập chỉ mục; kiểm tra lại ở bản phát hành mới nhất. |
| Ứng dụng chạy chậm với vault rất lớn | Thao tác đọc/parse/tính toán đồ thị đang chạy ngầm ở Web Worker lần đầu. | Chờ quá trình lập chỉ mục nền hoàn tất — giao diện chính không bị đứng trong lúc này. |
| Lỗi liên quan `SharedArrayBuffer is not defined` | Thiếu header COOP/COEP khi tự triển khai lên hosting riêng. | Cấu hình lại header `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` trên server/CDN (xem [mục 3](#3-cài-đặt--khởi-chạy)). |

---

## 12. Câu hỏi thường gặp (FAQ)

**Ứng dụng có gửi dữ liệu ghi chú của tôi lên internet không?**
Không. Second Brain được thiết kế Zero-Cloud — mọi xử lý (parse markdown, tìm kiếm, tính toán đồ thị) đều diễn ra cục bộ trong trình duyệt của bạn.

**Tôi có cần tài khoản để sử dụng không?**
Không. Không có bước đăng ký/đăng nhập nào.

**Ghi chú của tôi có bị khóa định dạng độc quyền không?**
Không. Dữ liệu là các file `.md` (Markdown thuần) — có thể mở bằng bất kỳ trình soạn thảo văn bản nào, đồng bộ qua Git, hoặc di chuyển sang công cụ PKM khác bất cứ lúc nào.

**Ứng dụng có hoạt động ngoại tuyến không?**
Có. Sau lần tải đầu tiên, toàn bộ tính năng cốt lõi hoạt động không cần kết nối mạng.

**Tôi có thể dùng trên điện thoại không?**
Hiện tại File System Access API (đọc/ghi thư mục cục bộ) chủ yếu khả dụng trên trình duyệt desktop. Trải nghiệm trên di động chưa được tối ưu ở giai đoạn MVP này.

---

## 13. Trạng thái tính năng hiện tại

Second Brain đang trong giai đoạn phát triển **MVP (Sprint 1–2 theo lộ trình kỹ thuật)**. Bảng dưới đây phản ánh trung thực mức độ hoàn thiện của từng tính năng tại thời điểm viết tài liệu:

| Tính năng | Trạng thái |
| --- | --- |
| Đọc/ghi thư mục qua File System Access API (`VaultStorageService`) | ✅ Đã cài đặt ở tầng lõi (`src/storages/fs-wrapper.ts`), có kiểm thử đầy đủ |
| Cache Vault Handle vào IndexedDB (Dexie) | ✅ Đã hoàn thiện (`src/storages/db.ts`) |
| Quét & phân tích AST Markdown trên Web Worker | ✅ Đã cài đặt (`src/workers/ast.worker.ts`, `parser.ts`) |
| Giao diện "Mở Vault" kết nối trực tiếp với ổ cứng thật | 🚧 Đang tích hợp — giao diện hiện dùng **dữ liệu mẫu (sample notes)** để trình diễn luồng UI/UX |
| Soạn thảo Markdown + WYSIWYG nhẹ | ✅ Hoạt động |
| Liên kết hai chiều `[[...]]` + gợi ý auto-complete | ✅ Cơ chế lõi hoạt động; UI dropdown gợi ý đang tiếp tục hoàn thiện |
| Backlinks Panel (danh sách ghi chú trỏ ngược) | 🚧 Engine đã có (`search.engine.ts`), UI hiển thị đang phát triển |
| Tìm kiếm toàn văn bản `Cmd/Ctrl+K` | ✅ Hoạt động (dựa trên dữ liệu đã nạp trong phiên) |
| Graph View WebGL (PixiJS + Physics Worker) | ✅ Hoạt động, có chế độ dự phòng an toàn khi thiếu GPU |
| Đồng bộ P2P / xuất-nhập `.zip` | ⏳ Chưa triển khai (nằm trong roadmap Should-have / Nice-to-have) |

> Xem chi tiết lộ trình kỹ thuật đầy đủ tại [docs/Second_Brain_PKM_PRD_TechSpec.md](./Second_Brain_PKM_PRD_TechSpec.md).

---

<p align="center">📬 Nếu gặp vấn đề khi sử dụng, vui lòng tạo issue trên kho mã nguồn của dự án kèm mô tả các bước tái hiện lỗi.</p>

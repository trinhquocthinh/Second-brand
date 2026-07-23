// vite.config.ts
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { resolve } from "path";

export default defineConfig({
  plugins: [solidPlugin()],

  // Thiết lập đường dẫn tuyệt đối @/
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  // Cấu hình bảo mật bắt buộc cho SharedArrayBuffer (Zero-Copy Physics Worker)
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },

  // Tối ưu hóa quá trình Build Production
  build: {
    target: "esnext",
    minify: "esbuild", // Sử dụng esbuild siêu tốc để nén code
    sourcemap: false, // Tắt sourcemap ở production để bảo mật mã nguồn
    rollupOptions: {
      output: {
        // Tách các thư viện bên thứ 3 (Vendor Chunks) để tối ưu caching
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("pixi.js")) {
              return "vendor-pixi";
            }
            if (id.includes("codemirror") || id.includes("@codemirror")) {
              return "vendor-codemirror";
            }
            if (id.includes("minisearch")) {
              return "vendor-search";
            }
            return "vendor-core"; // Các package nhỏ khác
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Nâng ngưỡng cảnh báo chunk size cho PixiJS
  },
});

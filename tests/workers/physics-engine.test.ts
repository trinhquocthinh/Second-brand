import { describe, it, expect, beforeEach } from "vitest";
import { PhysicsEngine } from "@/workers/physics.engine";
import { NoteMetadata } from "@/workers/types";
import { FLOATS_PER_NODE } from "@/workers/physics.types";

describe("PhysicsEngine & SharedArrayBuffer Zero-Copy", () => {
  let engine: PhysicsEngine;
  let sharedBuffer: SharedArrayBuffer;
  let floatView: Float32Array;

  const sampleNotes: NoteMetadata[] = [
    { id: "Core.md", title: "Core MVP", links: ["SolidJS.md", "Worker.md"], tags: [], size: 100 },
    { id: "SolidJS.md", title: "SolidJS", links: ["Worker.md"], tags: [], size: 80 },
    { id: "Worker.md", title: "Web Worker", links: [], tags: [], size: 120 },
    { id: "Isolated.md", title: "Isolated Note", links: [], tags: [], size: 40 },
  ];

  beforeEach(() => {
    engine = new PhysicsEngine();
    // Cấp phát vùng nhớ cho 4 nodes
    sharedBuffer = new SharedArrayBuffer(sampleNotes.length * FLOATS_PER_NODE * Float32Array.BYTES_PER_ELEMENT);
    floatView = new Float32Array(sharedBuffer);
  });

  it("[PageRank / Degree Sizing] nên tính toán chính xác trọng số và bán kính Node dựa trên số kết nối", () => {
    engine.init(sampleNotes, sharedBuffer);
    const nodes = engine.getNodes();

    // 'Worker.md' được link tới bởi Core và SolidJS -> Trọng số (degree) = 2 (lớn nhất)
    const workerNode = nodes.find((n) => n.id === "Worker.md");
    const isolatedNode = nodes.find((n) => n.id === "Isolated.md");

    expect(workerNode).toBeDefined();
    expect(isolatedNode).toBeDefined();
    expect(workerNode!.weight).toBeGreaterThan(isolatedNode!.weight);
    expect(workerNode!.radius).toBeGreaterThan(isolatedNode!.radius);
  });

  it("[Zero-Copy Mutation] khi Engine step(), tọa độ trong SharedArrayBuffer phải tự động cập nhật mà không cần copy", () => {
    engine.init(sampleNotes, sharedBuffer);

    // Ghi nhận tọa độ X ban đầu của Node 0 (Core.md) trong RAM
    const initialX = floatView[0];
    const initialY = floatView[1];

    // Chạy 1 bước mô phỏng vật lý (tạo lực đẩy tĩnh điện Coulomb giữa các node)
    engine.step(0.1);

    // Kiểm chứng: Main Thread nhìn thấy ngay lập tức giá trị trong floatView đã thay đổi (Zero-Copy!)
    const newX = floatView[0];
    const newY = floatView[1];

    expect(newX).not.toBe(initialX);
    expect(newY).not.toBe(initialY);
    console.log(
      `⚡ [Zero-Copy Verify] Tọa độ Node 0 dịch chuyển từ (${initialX.toFixed(2)}, ${initialY.toFixed(2)}) -> (${newX.toFixed(2)}, ${newY.toFixed(2)})`,
    );
  });

  it("[Performance 60 FPS] mô phỏng 1 bước vật lý cho 5,000 Node phải hoàn tất dưới 16ms", () => {
    // 1. Tạo 5,000 notes
    const massiveNotes: NoteMetadata[] = Array.from({ length: 5000 }, (_, i) => ({
      id: `Note-${i}.md`,
      title: `Note ${i}`,
      links: i < 4999 ? [`Note-${i + 1}.md`] : [],
      tags: [],
      size: 100,
    }));

    const massiveBuffer = new SharedArrayBuffer(5000 * FLOATS_PER_NODE * Float32Array.BYTES_PER_ELEMENT);
    const massiveEngine = new PhysicsEngine();
    massiveEngine.init(massiveNotes, massiveBuffer);

    // 2. Đo thời gian thực thi 1 chu kỳ vật lý
    const startTime = performance.now();
    massiveEngine.step(0.1);
    const duration = performance.now() - startTime;

    console.log(`🚀 [Physics Benchmark] 1 bước mô phỏng cho 5,000 Nodes hoàn tất trong: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(16); // Ngưỡng tuyệt đối cho 60 FPS
  });
});

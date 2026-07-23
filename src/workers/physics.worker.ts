import { PhysicsEngine } from "./physics.engine";
import { PhysicsWorkerRequest, PhysicsWorkerResponse } from "./physics.types";

const engine = new PhysicsEngine();

self.onmessage = (event: MessageEvent<PhysicsWorkerRequest>) => {
  const { type, payload } = event.data;

  try {
    if (type === "INIT_PHYSICS") {
      const { nodes, sharedBuffer } = payload;
      engine.init(nodes, sharedBuffer);

      const response: PhysicsWorkerResponse = {
        type: "PHYSICS_READY",
        payload: {
          nodeCount: engine.getNodes().length,
          edgeCount: engine.getEdges().length,
        },
      };
      self.postMessage(response);
    } else if (type === "STEP_SIMULATION") {
      const { alpha } = payload;
      const startTime = performance.now();

      // Thực thi tính toán lực đẩy trực tiếp trên SharedArrayBuffer
      engine.step(alpha);

      const durationMs = performance.now() - startTime;

      // Không cần gửi tọa độ [X, Y] về! Main Thread tự động nhìn thấy RAM thay đổi!
      const response: PhysicsWorkerResponse = {
        type: "STEP_COMPLETED",
        payload: { maxVelocity: 0, durationMs },
      };
      self.postMessage(response);
    }
  } catch (error: unknown) {
    const response: PhysicsWorkerResponse = {
      type: "PHYSICS_ERROR",
      payload: { message: error instanceof Error ? error.message : "Lỗi không xác định trên Physics Worker" },
    };
    self.postMessage(response);
  }
};

// src/workers/physics.types.ts
import { NoteMetadata } from "./types";

// Mỗi Node chiếm 4 phần tử trong Float32Array: [X, Y, VX, VY]
export const FLOATS_PER_NODE = 4;
export const STRIDE_BYTES = FLOATS_PER_NODE * Float32Array.BYTES_PER_ELEMENT; // 16 bytes/node

export interface PhysicsNode {
  id: string;
  index: number; // Vị trí index trong SharedArrayBuffer (0, 1, 2, ...)
  radius: number; // Bán kính node (tính theo thuật toán PageRank)
  weight: number; // Số lượng kết nối (Degree)
}

export interface PhysicsEdge {
  sourceIndex: number;
  targetIndex: number;
}

// Lệnh từ Main Thread gửi xuống Physics Worker
export type PhysicsWorkerRequest =
  | {
      type: "INIT_PHYSICS";
      payload: {
        nodes: NoteMetadata[];
        sharedBuffer: SharedArrayBuffer;
      };
    }
  | { type: "STEP_SIMULATION"; payload: { alpha: number } }
  | { type: "UPDATE_FORCES"; payload: { repulsion: number; springLength: number; gravity: number } };

// Phản hồi từ Physics Worker
export type PhysicsWorkerResponse =
  | { type: "PHYSICS_READY"; payload: { nodeCount: number; edgeCount: number } }
  | { type: "STEP_COMPLETED"; payload: { maxVelocity: number; durationMs: number } }
  | { type: "PHYSICS_ERROR"; payload: { message: string } };

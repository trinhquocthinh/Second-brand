// src/workers/physics.types.ts
import { NoteMetadata } from "./types";

export const FLOATS_PER_NODE = 4;
export const STRIDE_BYTES = FLOATS_PER_NODE * Float32Array.BYTES_PER_ELEMENT;

export interface PhysicsNode {
  id: string;
  index: number;
  radius: number;
  weight: number;
}

export interface PhysicsEdge {
  sourceIndex: number;
  targetIndex: number;
}

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

export type PhysicsWorkerResponse =
  | { type: "PHYSICS_READY"; payload: { nodeCount: number; edgeCount: number } }
  | { type: "STEP_COMPLETED"; payload: { maxVelocity: number; durationMs: number } }
  | { type: "PHYSICS_ERROR"; payload: { message: string } };

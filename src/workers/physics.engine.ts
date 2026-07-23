// src/workers/physics.engine.ts
import { NoteMetadata } from "./types";
import { PhysicsNode, PhysicsEdge, FLOATS_PER_NODE } from "./physics.types";

export class PhysicsEngine {
  private nodes: PhysicsNode[] = [];
  private edges: PhysicsEdge[] = [];
  private floatView!: Float32Array;
  private nodeMap: Map<string, number> = new Map();

  private gridHead!: Int32Array;
  private gridNext!: Int32Array;

  // Tối ưu hóa điểm ngọt: 85px cắt giảm 28% diện tích tính toán thừa
  private readonly CELL_SIZE = 85;
  private readonly HASH_MASK = 8191;

  init(notes: NoteMetadata[], sharedBuffer: SharedArrayBuffer): void {
    if (FLOATS_PER_NODE !== 4) {
      throw new Error(
        `[Fatal Memory Error] PhysicsEngine bitwise shifts (<< 2) require FLOATS_PER_NODE to be exactly 4. Current value: ${FLOATS_PER_NODE}`,
      );
    }

    this.nodes = [];
    this.edges = [];
    this.nodeMap.clear();

    const numNodes = notes.length;
    this.floatView = new Float32Array(sharedBuffer);

    this.gridHead = new Int32Array(this.HASH_MASK + 1).fill(-1);
    this.gridNext = new Int32Array(numNodes).fill(-1);

    const degreeMap = new Map<string, number>();

    notes.forEach((note, index) => {
      this.nodeMap.set(note.id, index);
      degreeMap.set(note.id, 0);

      const angle = index * 0.5;
      const radiusInitial = Math.sqrt(index) * 10;

      // Sử dụng dịch bit << 2 thay cho index * 4
      const offset = index << 2;
      this.floatView[offset + 0] = Math.cos(angle) * radiusInitial;
      this.floatView[offset + 1] = Math.sin(angle) * radiusInitial;
      this.floatView[offset + 2] = 0;
      this.floatView[offset + 3] = 0;
    });

    notes.forEach((note) => {
      const sourceIdx = this.nodeMap.get(note.id);
      if (sourceIdx === undefined) return;

      note.links.forEach((targetId) => {
        let targetIdx = this.nodeMap.get(targetId);
        if (targetIdx === undefined && !targetId.endsWith(".md")) {
          targetIdx = this.nodeMap.get(`${targetId}.md`);
        }

        if (targetIdx !== undefined && targetIdx !== sourceIdx) {
          this.edges.push({ sourceIndex: sourceIdx, targetIndex: targetIdx });
          degreeMap.set(note.id, (degreeMap.get(note.id) || 0) + 1);
          degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
        }
      });
    });

    notes.forEach((note, index) => {
      const weight = degreeMap.get(note.id) || 0;
      const radius = Math.min(30, Math.max(5, 5 + Math.log2(weight + 1) * 8));
      this.nodes.push({ id: note.id, index, weight, radius });
    });
  }

  step(alpha: number = 0.1): void {
    const numNodes = this.nodes.length;
    if (numNodes === 0 || !this.floatView) return;

    // --- BÍ MẬT STAFF ENGINEER: CACHE LOCAL VARIABLES ---
    const floatView = this.floatView;
    const gridHead = this.gridHead;
    const gridNext = this.gridNext;
    const cellSize = this.CELL_SIZE;
    const hashMask = this.HASH_MASK;
    const edges = this.edges;

    // --- BÍ MẬT FPU: TÍNH TRƯỚC NGHỊCH ĐẢO ĐỂ DÙNG PHÉP NHÂN (*) THAY PHÉP CHIA (/) ---
    const INV_CELL_SIZE = 1 / cellSize;

    const repulsionConstant = -150 * alpha;
    const springLength = 80;
    const springStrength = 0.05 * alpha;
    const gravityStrength = 0.02 * alpha;
    const velocityDecay = 0.6;
    const maxDistSq = cellSize * cellSize;

    // BƯỚC 1: XÂY DỰNG LƯỚI KHÔNG GIAN O(N) VỚI DỊCH BIT << 2
    gridHead.fill(-1);
    for (let i = 0; i < numNodes; i++) {
      const offset = i << 2;
      const cx = Math.floor(floatView[offset + 0] * INV_CELL_SIZE);
      const cy = Math.floor(floatView[offset + 1] * INV_CELL_SIZE);

      // Dịch bit không dấu >>> 0 biến số âm thành số dương tức thì, khử Math.abs()
      const hash = (((cx * 73856093) ^ (cy * 19349663)) >>> 0) & hashMask;

      gridNext[i] = gridHead[hash];
      gridHead[hash] = i;
    }

    // BƯỚC 2: LỰC ĐẨY TĨNH ĐIỆN O(N * K) VỚI ĐỊNH LUẬT III NEWTON
    for (let i = 0; i < numNodes; i++) {
      const iOffset = i << 2;
      const xi = floatView[iOffset + 0];
      const yi = floatView[iOffset + 1];
      let vxi = floatView[iOffset + 2] - xi * gravityStrength;
      let vyi = floatView[iOffset + 3] - yi * gravityStrength;

      const cx = Math.floor(xi * INV_CELL_SIZE);
      const cy = Math.floor(yi * INV_CELL_SIZE);

      for (let dx = -1; dx <= 1; dx++) {
        const ncx = cx + dx;
        const cxHash = ncx * 73856093;

        for (let dy = -1; dy <= 1; dy++) {
          const ncy = cy + dy;
          const hash = ((cxHash ^ (ncy * 19349663)) >>> 0) & hashMask;
          let j = gridHead[hash];

          while (j !== -1) {
            // Định luật III Newton: j > i triệt tiêu 50% số lần tính toán
            if (j > i) {
              const jOffset = j << 2;
              const diffX = xi - floatView[jOffset + 0];
              const diffY = yi - floatView[jOffset + 1];
              const distSq = diffX * diffX + diffY * diffY;

              if (distSq > 0.1 && distSq < maxDistSq) {
                const dist = Math.sqrt(distSq);
                const force = repulsionConstant / distSq;
                const fx = (diffX / dist) * force;
                const fy = (diffY / dist) * force;

                vxi += fx;
                vyi += fy;
                floatView[jOffset + 2] -= fx;
                floatView[jOffset + 3] -= fy;
              }
            }
            j = gridNext[j];
          }
        }
      }

      floatView[iOffset + 2] = vxi;
      floatView[iOffset + 3] = vyi;
    }

    // BƯỚC 3: LỰC ĐÀN HỒI LÒ XO O(E) VỚI DỊCH BIT << 2
    const numEdges = edges.length;
    for (let e = 0; e < numEdges; e++) {
      const edge = edges[e];
      const sOffset = edge.sourceIndex << 2;
      const tOffset = edge.targetIndex << 2;

      const dx = floatView[tOffset + 0] - floatView[sOffset + 0];
      const dy = floatView[tOffset + 1] - floatView[sOffset + 1];
      const distSq = dx * dx + dy * dy;

      if (distSq > 0) {
        const dist = Math.sqrt(distSq);
        const displacement = dist - springLength;
        const force = displacement * springStrength;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        floatView[sOffset + 2] += fx;
        floatView[sOffset + 3] += fy;
        floatView[tOffset + 2] -= fx;
        floatView[tOffset + 3] -= fy;
      }
    }

    // BƯỚC 4: EULER INTEGRATION & ZERO-COPY MUTATION O(N)
    for (let i = 0; i < numNodes; i++) {
      const offset = i << 2;
      const vx = floatView[offset + 2] * velocityDecay;
      const vy = floatView[offset + 3] * velocityDecay;

      floatView[offset + 2] = vx;
      floatView[offset + 3] = vy;
      floatView[offset + 0] += vx;
      floatView[offset + 1] += vy;
    }
  }

  getNodes(): PhysicsNode[] {
    return this.nodes;
  }
  getEdges(): PhysicsEdge[] {
    return this.edges;
  }
}

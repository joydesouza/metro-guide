export interface LexicographicWeight {
  primary: number;
  secondary: number;
}

export interface GraphEdge<TMeta = unknown> {
  to: string;
  metadata?: TMeta;
}

export type GraphAdjacency<TMeta = unknown> = Record<
  string,
  GraphEdge<TMeta>[]
>;

export interface DijkstraLexicographicOptions<TMeta = unknown> {
  graph: GraphAdjacency<TMeta>;
  start: string;
  goal: string;
  edgeWeight: (from: string, edge: GraphEdge<TMeta>) => LexicographicWeight;
  maxIterations?: number;
}

export interface DijkstraPath {
  path: string[];
  distance: LexicographicWeight;
  visited: Set<string>;
}

const INFINITY_WEIGHT: LexicographicWeight = {
  primary: Number.POSITIVE_INFINITY,
  secondary: Number.POSITIVE_INFINITY,
};

export function createWeight(primary = 0, secondary = 0): LexicographicWeight {
  return { primary, secondary };
}

export function addWeights(
  a: LexicographicWeight,
  b: LexicographicWeight
): LexicographicWeight {
  return {
    primary: a.primary + b.primary,
    secondary: a.secondary + b.secondary,
  };
}

export function compareWeights(
  a: LexicographicWeight,
  b: LexicographicWeight
): number {
  if (a.primary < b.primary) return -1;
  if (a.primary > b.primary) return 1;
  if (a.secondary < b.secondary) return -1;
  if (a.secondary > b.secondary) return 1;
  return 0;
}

class PriorityQueue<T> {
  private readonly heap: T[] = [];

  constructor(private readonly compareFn: (a: T, b: T) => number) {}

  enqueue(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }

    const top = this.heap[0];
    const last = this.heap.pop();

    if (last !== undefined && this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }

    return top;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    let currentIndex = index;

    while (currentIndex > 0) {
      const parentIndex = Math.floor((currentIndex - 1) / 2);

      if (
        this.compareFn(this.heap[currentIndex], this.heap[parentIndex]) >= 0
      ) {
        break;
      }

      [this.heap[currentIndex], this.heap[parentIndex]] = [
        this.heap[parentIndex],
        this.heap[currentIndex],
      ];

      currentIndex = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    let currentIndex = index;

    while (currentIndex < this.heap.length) {
      const leftIndex = currentIndex * 2 + 1;
      const rightIndex = currentIndex * 2 + 2;
      let smallest = currentIndex;

      if (
        leftIndex < this.heap.length &&
        this.compareFn(this.heap[leftIndex], this.heap[smallest]) < 0
      ) {
        smallest = leftIndex;
      }

      if (
        rightIndex < this.heap.length &&
        this.compareFn(this.heap[rightIndex], this.heap[smallest]) < 0
      ) {
        smallest = rightIndex;
      }

      if (smallest === currentIndex) {
        break;
      }

      [this.heap[currentIndex], this.heap[smallest]] = [
        this.heap[smallest],
        this.heap[currentIndex],
      ];

      currentIndex = smallest;
    }
  }
}

interface QueueNode {
  nodeId: string;
  weight: LexicographicWeight;
}

export function dijkstraLexicographic<TMeta = unknown>(
  options: DijkstraLexicographicOptions<TMeta>
): DijkstraPath | null {
  const { graph, start, goal, edgeWeight, maxIterations } = options;

  const dist = new Map<string, LexicographicWeight>();
  const previous = new Map<string, string | null>();
  const visited = new Set<string>();

  const queue = new PriorityQueue<QueueNode>((a, b) =>
    compareWeights(a.weight, b.weight)
  );

  dist.set(start, createWeight());
  previous.set(start, null);
  queue.enqueue({ nodeId: start, weight: createWeight() });

  let iterations = 0;

  while (!queue.isEmpty()) {
    if (maxIterations !== undefined && iterations++ > maxIterations) {
      break;
    }

    const current = queue.dequeue();

    if (!current) {
      break;
    }

    if (visited.has(current.nodeId)) {
      continue;
    }

    visited.add(current.nodeId);

    if (current.nodeId === goal) {
      return {
        path: reconstructPath(previous, goal),
        distance: current.weight,
        visited,
      };
    }

    const edges = graph[current.nodeId] ?? [];

    for (const edge of edges) {
      const weight = edgeWeight(current.nodeId, edge);
      const candidate = addWeights(current.weight, weight);
      const existing = dist.get(edge.to) ?? INFINITY_WEIGHT;

      if (compareWeights(candidate, existing) < 0) {
        dist.set(edge.to, candidate);
        previous.set(edge.to, current.nodeId);
        queue.enqueue({ nodeId: edge.to, weight: candidate });
      }
    }
  }

  return null;
}

function reconstructPath(
  previous: Map<string, string | null>,
  goal: string
): string[] {
  const path: string[] = [];
  let current: string | null | undefined = goal;

  while (current) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }

  return path;
}

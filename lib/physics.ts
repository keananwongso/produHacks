// Physics engine for node clustering and drift effect

import { Node, Connection } from './types';
import { PHYSICS_CONSTANTS } from './constants';

/**
 * Runs a single physics simulation step
 * Applies spring forces (connected nodes attract) and repulsion forces (all nodes repel)
 */
export function simulateStep(nodes: Node[], connections: Connection[]): void {
  const {
    SPRING_STRENGTH,
    SPRING_LENGTH,
    REPULSION,
    REPULSION_RADIUS,
    DAMPING,
    MAX_VELOCITY,
  } = PHYSICS_CONSTANTS;

  // 1. Apply spring forces (connected nodes attract each other)
  for (const conn of connections) {
    const nodeA = nodes.find((n) => n.id === conn.from);
    const nodeB = nodes.find((n) => n.id === conn.to);
    if (!nodeA || !nodeB) continue;

    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    // Spring force proportional to displacement from rest length
    const force = (distance - SPRING_LENGTH) * SPRING_STRENGTH * conn.strength;
    const fx = (dx / distance) * force;
    const fy = (dy / distance) * force;

    // Apply force to both nodes (Newton's third law)
    nodeA.vx += fx;
    nodeA.vy += fy;
    nodeB.vx -= fx;
    nodeB.vy -= fy;
  }

  // 2. Apply repulsion forces (all nodes repel each other)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const distanceSquared = dx * dx + dy * dy || 1;

      // Skip if nodes are too far apart (optimization)
      if (distanceSquared > REPULSION_RADIUS * REPULSION_RADIUS) continue;

      const distance = Math.sqrt(distanceSquared);
      const force = REPULSION / distanceSquared;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      // Apply repulsion
      nodeA.vx -= fx;
      nodeA.vy -= fy;
      nodeB.vx += fx;
      nodeB.vy += fy;
    }
  }

  // 3. Update positions with damping
  for (const node of nodes) {
    if (node.isDragging) continue; // Don't move nodes being dragged

    // Apply damping (friction/air resistance)
    node.vx *= DAMPING;
    node.vy *= DAMPING;

    // Clamp velocity to maximum
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > MAX_VELOCITY) {
      node.vx = (node.vx / speed) * MAX_VELOCITY;
      node.vy = (node.vy / speed) * MAX_VELOCITY;
    }

    // Update position based on velocity
    node.x += node.vx;
    node.y += node.vy;
  }
}

/**
 * Checks if physics simulation has settled (all nodes are nearly stationary)
 * Used to pause simulation when nothing is moving
 */
export function hasSettled(nodes: Node[], threshold: number = PHYSICS_CONSTANTS.SETTLE_THRESHOLD): boolean {
  return nodes.every((node) => {
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    return speed < threshold;
  });
}

/**
 * Calculate the centroid (average position) of a group of nodes
 * Used for cluster label positioning
 */
export function calculateCentroid(nodes: Node[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 0, y: 0 };

  const sum = nodes.reduce(
    (acc, node) => ({
      x: acc.x + node.x,
      y: acc.y + node.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / nodes.length,
    y: sum.y / nodes.length,
  };
}

/**
 * Initialize a new node with random velocity for a natural "pop-in" effect
 */
export function initializeNodePhysics(node: Node): Node {
  return {
    ...node,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
  };
}

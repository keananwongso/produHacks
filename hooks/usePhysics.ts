// Physics simulation hook - runs at 60fps using requestAnimationFrame

import { useEffect, useRef, useCallback } from 'react';
import { Node, Connection } from '@/lib/types';
import { simulateStep, hasSettled } from '@/lib/physics';

interface UsePhysicsOptions {
  nodes: Node[];
  connections: Connection[];
  onUpdate: (nodes: Node[]) => void;
  enabled?: boolean;
}

export function usePhysics({ nodes, connections, onUpdate, enabled = true }: UsePhysicsOptions) {
  const nodesRef = useRef<Node[]>(nodes);
  const connectionsRef = useRef<Connection[]>(connections);
  const animationFrameRef = useRef<number>();
  const isPausedRef = useRef(false);
  const lastUpdateRef = useRef(Date.now());

  // Sync props to refs (avoid re-renders in animation loop)
  useEffect(() => {
    nodesRef.current = nodes.map((n) => ({ ...n })); // Clone to avoid mutation
  }, [nodes]);

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);

  // Wake physics when connections change
  useEffect(() => {
    if (connections.length > 0) {
      isPausedRef.current = false;
    }
  }, [connections.length]);

  // Physics animation loop
  useEffect(() => {
    if (!enabled) return;

    const animate = () => {
      const now = Date.now();
      const delta = now - lastUpdateRef.current;

      // Run at ~60fps (16ms per frame)
      if (delta > 16) {
        const currentNodes = nodesRef.current;

        // Check if physics has settled
        if (hasSettled(currentNodes, 0.1)) {
          if (!isPausedRef.current) {
            console.log('⏸️ Physics settled, pausing simulation');
            isPausedRef.current = true;
          }
        } else {
          isPausedRef.current = false;
        }

        // Run simulation step if not paused
        if (!isPausedRef.current) {
          simulateStep(currentNodes, connectionsRef.current);
          // Clone nodes for React immutability
          onUpdate(currentNodes.map((n) => ({ ...n })));
        }

        lastUpdateRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [enabled, onUpdate]);

  // Manually wake physics (e.g., after node drag)
  const wake = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  return { wake };
}

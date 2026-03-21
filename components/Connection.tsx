'use client';

import { Connection as ConnectionType, Node } from '@/lib/types';
import { useMemo } from 'react';

interface ConnectionProps {
  connection: ConnectionType;
  nodes: Node[];
}

export function Connection({ connection, nodes }: ConnectionProps) {
  const { from, to, strength } = connection;

  // Find the connected nodes
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);

  // Calculate the path
  const path = useMemo(() => {
    if (!fromNode || !toNode) return '';

    const x1 = fromNode.x;
    const y1 = fromNode.y;
    const x2 = toNode.x;
    const y2 = toNode.y;

    // Calculate control point for quadratic bezier curve
    // Place it at the midpoint, offset perpendicular to the line
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    // Slight curve for more organic feel
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * 0.15, 30);

    const controlX = midX + (dy / dist) * curvature;
    const controlY = midY - (dx / dist) * curvature;

    return `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
  }, [fromNode, toNode]);

  if (!fromNode || !toNode || !path) return null;

  // Style based on connection strength
  const opacity = 0.2 + strength * 0.3; // 0.2 to 0.5
  const strokeWidth = 1 + strength * 1.5; // 1 to 2.5

  return (
    <path
      d={path}
      stroke="rgba(99, 102, 241, 0.4)"
      strokeWidth={strokeWidth}
      fill="none"
      opacity={opacity}
      className="transition-all duration-500"
      strokeLinecap="round"
    />
  );
}

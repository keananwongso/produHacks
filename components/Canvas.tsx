'use client';

import { useDrag, usePinch } from '@use-gesture/react';
import { useState, useRef } from 'react';
import { Node as NodeComponent } from './Node';
import { Connection } from './Connection';
import { ClusterLabel } from './ClusterLabel';
import { Node as NodeType, Connection as ConnectionType, Cluster } from '@/lib/types';

interface CanvasProps {
  nodes: NodeType[];
  connections: ConnectionType[];
  clusters: Cluster[];
  onNodeDrag: (id: string, x: number, y: number, isDragging: boolean) => void;
  onCanvasClick?: () => void;
  onClusterClick?: (cluster: Cluster) => void;
  onNodeClick?: (id: string) => void;
}

export function Canvas({
  nodes,
  connections,
  clusters,
  onNodeDrag,
  onCanvasClick,
  onClusterClick,
  onNodeClick,
}: CanvasProps) {
  const [pan, setPan] = useState({ x: 400, y: 300 }); // Start with some offset
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDraggingCanvasRef = useRef(false);

  // Pan gesture (drag empty space)
  const bindPan = useDrag(
    ({ offset: [x, y], active, event }) => {
      // Only pan if we're not dragging a node
      if (!active) {
        isDraggingCanvasRef.current = false;
        return;
      }

      isDraggingCanvasRef.current = true;
      setPan({ x, y });
    },
    {
      from: () => [pan.x, pan.y],
      filterTaps: true,
      pointer: { capture: false },
    }
  );

  // Pinch-to-zoom gesture
  const bindPinch = usePinch(
    ({ offset: [scale] }) => {
      setZoom(Math.max(0.1, Math.min(3, scale)));
    },
    {
      from: () => [zoom],
      scaleBounds: { min: 0.1, max: 3 },
    }
  );

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(0.1, Math.min(3, prev + delta)));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only trigger if we clicked the canvas directly (not a node)
    if (e.target === e.currentTarget || e.target === canvasRef.current) {
      if (!isDraggingCanvasRef.current && onCanvasClick) {
        onCanvasClick();
      }
    }
  };

  return (
    <div
      ref={canvasRef}
      {...bindPan()}
      {...bindPinch()}
      className="fixed inset-0 overflow-hidden bg-[#0a0a0f] canvas-bg cursor-move"
      onWheel={handleWheel}
      onClick={handleCanvasClick}
    >
      {/* World container with pan/zoom transform */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
        className="pointer-events-none"
      >
        {/* SVG layer for connections (below nodes) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        >
          {connections.map((conn) => (
            <Connection key={conn.id} connection={conn} nodes={nodes} />
          ))}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <NodeComponent
            key={node.id}
            node={node}
            onDrag={onNodeDrag}
            onClick={onNodeClick}
          />
        ))}

        {/* Cluster labels */}
        {clusters.map((cluster) => (
          <ClusterLabel
            key={cluster.id}
            cluster={cluster}
            nodes={nodes}
            onClick={onClusterClick}
          />
        ))}
      </div>

      {/* Zoom indicator */}
      <div className="fixed bottom-4 right-4 px-3 py-1.5 bg-slate-900/60 backdrop-blur-sm
                      rounded-lg border border-slate-700/30 text-xs text-slate-400 pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

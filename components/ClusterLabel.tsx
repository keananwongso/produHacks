'use client';

import { Cluster, Node } from '@/lib/types';
import { calculateCentroid } from '@/lib/physics';
import { useMemo } from 'react';

interface ClusterLabelProps {
  cluster: Cluster;
  nodes: Node[];
  onClick?: (cluster: Cluster) => void;
}

export function ClusterLabel({ cluster, nodes, onClick }: ClusterLabelProps) {
  // Get cluster nodes
  const clusterNodes = useMemo(() => {
    return nodes.filter((n) => cluster.nodeIds.includes(n.id));
  }, [nodes, cluster.nodeIds]);

  // Calculate centroid position
  const position = useMemo(() => {
    const centroid = calculateCentroid(clusterNodes);
    // Offset label above the cluster
    return {
      x: centroid.x,
      y: centroid.y - 60,
    };
  }, [clusterNodes]);

  if (clusterNodes.length === 0) return null;

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      className="absolute pointer-events-auto"
    >
      <button
        onClick={() => onClick && onClick(cluster)}
        className="px-3 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/20
                   backdrop-blur-sm text-xs text-indigo-300/80 font-medium
                   hover:bg-indigo-950/60 hover:border-indigo-500/30 hover:text-indigo-200
                   transition-all duration-200 cursor-pointer
                   shadow-lg shadow-indigo-500/5"
      >
        {cluster.label}
      </button>
    </div>
  );
}

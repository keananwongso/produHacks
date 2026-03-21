'use client';

import { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@/components/Canvas';
import { InputBar } from '@/components/InputBar';
import { ActionPanel } from '@/components/ActionPanel';
import { Node, Connection, Cluster } from '@/lib/types';
import { usePhysics } from '@/hooks/usePhysics';
import { generateId, debounce } from '@/lib/utils';
import { initializeNodePhysics } from '@/lib/physics';

export default function DriftPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Physics simulation
  const { wake } = usePhysics({
    nodes,
    connections,
    onUpdate: setNodes,
    enabled: true,
  });

  // Analyze nodes with Gemini (debounced)
  const analyzeNodes = useCallback(async (nodesToAnalyze: Node[]) => {
    if (nodesToAnalyze.length < 2) return;

    setIsAnalyzing(true);
    console.log('🧠 Analyzing', nodesToAnalyze.length, 'nodes...');

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: nodesToAnalyze }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const { connections: newConnections, clusters: newClusters } = await response.json();

      console.log('✅ Analysis complete:', newConnections.length, 'connections,', newClusters.length, 'clusters');

      // Add IDs to connections and clusters
      const connectionsWithIds = newConnections.map((conn: any) => ({
        ...conn,
        id: generateId(),
      }));

      const clustersWithCentroids = newClusters.map((cluster: any) => ({
        ...cluster,
        id: generateId(),
        centroid: { x: 0, y: 0 }, // Will be calculated by ClusterLabel component
      }));

      setConnections(connectionsWithIds);
      setClusters(clustersWithCentroids);

      // Update node cluster IDs
      setNodes((prev) =>
        prev.map((node) => {
          const cluster = clustersWithCentroids.find((c: Cluster) =>
            c.nodeIds.includes(node.id)
          );
          return { ...node, clusterId: cluster?.id };
        })
      );
    } catch (error) {
      console.error('❌ Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Debounced analysis trigger
  const debouncedAnalyze = useCallback(
    debounce((nodes: Node[]) => analyzeNodes(nodes), 1000),
    [analyzeNodes]
  );

  // Add a new thought node
  const addNode = useCallback(
    (text: string) => {
      const newNode: Node = initializeNodePhysics({
        id: generateId(),
        text,
        x: Math.random() * 600 + 200, // Random position near center
        y: Math.random() * 400 + 200,
        vx: 0,
        vy: 0,
        isAI: false,
        isDragging: false,
        nodeType: 'thought',
        metadata: {},
        relatedNodeIds: [],
      });

      setNodes((prev) => {
        const updated = [...prev, newNode];
        // Trigger analysis after adding node
        debouncedAnalyze(updated);
        return updated;
      });

      wake(); // Wake physics
    },
    [debouncedAnalyze, wake]
  );

  // Handle node drag
  const handleNodeDrag = useCallback(
    (id: string, x: number, y: number, isDragging: boolean) => {
      setNodes((prev) =>
        prev.map((node) =>
          node.id === id
            ? { ...node, x, y, isDragging, vx: 0, vy: 0 }
            : node
        )
      );

      if (!isDragging) {
        wake(); // Wake physics after drag ends
      }
    },
    [wake]
  );

  // Handle cluster click
  const handleClusterClick = useCallback((cluster: Cluster) => {
    setSelectedCluster(cluster);
  }, []);

  // Handle brainstorm action
  const handleBrainstorm = useCallback(async () => {
    if (!selectedCluster) return;

    const clusterNodes = nodes.filter((n) =>
      selectedCluster.nodeIds.includes(n.id)
    );

    console.log('🧠 Brainstorming for cluster:', selectedCluster.label);

    try {
      const response = await fetch('/api/ai/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clusterLabel: selectedCluster.label,
          thoughts: clusterNodes.map((n) => n.text),
          nodeIds: selectedCluster.nodeIds,
        }),
      });

      if (!response.ok) throw new Error('Brainstorm failed');

      const { ideas } = await response.json();

      console.log('✅ Generated', ideas.length, 'new ideas');

      // Add AI idea nodes
      const aiNodes: Node[] = ideas.map((idea: any) =>
        initializeNodePhysics({
          id: generateId(),
          text: idea.text,
          x: clusterNodes[0].x + (Math.random() - 0.5) * 200,
          y: clusterNodes[0].y + (Math.random() - 0.5) * 200,
          vx: 0,
          vy: 0,
          isAI: true,
          isDragging: false,
          nodeType: 'ai_idea',
          metadata: {},
          relatedNodeIds: idea.relatedNodeIds,
        })
      );

      setNodes((prev) => [...prev, ...aiNodes]);

      // Create connections to related nodes
      const newConnections: Connection[] = aiNodes.flatMap((aiNode) =>
        aiNode.relatedNodeIds.map((relatedId) => ({
          id: generateId(),
          from: aiNode.id,
          to: relatedId,
          strength: 0.7,
        }))
      );

      setConnections((prev) => [...prev, ...newConnections]);
      wake();
    } catch (error) {
      console.error('❌ Brainstorm error:', error);
    }
  }, [selectedCluster, nodes, wake]);

  return (
    <main className="w-screen h-screen overflow-hidden">
      {/* Canvas with nodes and connections */}
      <Canvas
        nodes={nodes}
        connections={connections}
        clusters={clusters}
        onNodeDrag={handleNodeDrag}
        onCanvasClick={() => setSelectedCluster(null)}
        onClusterClick={handleClusterClick}
      />

      {/* Input bar */}
      <InputBar
        onAddNode={addNode}
        placeholder={
          isAnalyzing
            ? 'Analyzing connections...'
            : "What's on your mind?"
        }
      />

      {/* Action panel */}
      <ActionPanel
        cluster={selectedCluster}
        nodes={nodes}
        onClose={() => setSelectedCluster(null)}
        onBrainstorm={handleBrainstorm}
        isLoading={{}}
      />

      {/* Status indicator */}
      {isAnalyzing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-indigo-950/60 backdrop-blur-sm
                        rounded-full border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          Analyzing connections...
        </div>
      )}
    </main>
  );
}

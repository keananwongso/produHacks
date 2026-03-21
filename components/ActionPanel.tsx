'use client';

import { Cluster, Node } from '@/lib/types';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ActionPanelProps {
  cluster: Cluster | null;
  nodes: Node[];
  onClose: () => void;
  onBrainstorm?: () => void;
  onResearch?: () => void;
  onWrite?: () => void;
  onMockup?: () => void;
  isLoading?: {
    brainstorm?: boolean;
    research?: boolean;
    write?: boolean;
    mockup?: boolean;
  };
}

export function ActionPanel({
  cluster,
  nodes,
  onClose,
  onBrainstorm,
  onResearch,
  onWrite,
  onMockup,
  isLoading = {},
}: ActionPanelProps) {
  if (!cluster) return null;

  const clusterNodes = nodes.filter((n) => cluster.nodeIds.includes(n.id));

  return (
    <div
      className="fixed right-0 top-0 h-full w-[360px] bg-slate-900/95 backdrop-blur-xl
                 border-l border-slate-700/40 shadow-2xl shadow-black/20
                 z-50 overflow-y-auto
                 animate-in slide-in-from-right duration-250"
    >
      {/* Header */}
      <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/40 p-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">{cluster.label}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{clusterNodes.length} thoughts</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Thoughts */}
      <div className="p-4 space-y-2">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Related Thoughts
        </h3>
        {clusterNodes.map((node) => (
          <div
            key={node.id}
            className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/20 text-sm text-slate-300"
          >
            {node.text}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Actions
        </h3>

        <ActionButton
          onClick={onBrainstorm}
          isLoading={isLoading.brainstorm}
          icon="🧠"
          label="Brainstorm More Ideas"
          description="AI generates related ideas"
        />

        <ActionButton
          onClick={onResearch}
          isLoading={isLoading.research}
          icon="🔍"
          label="Research This"
          description="Find facts and insights"
        />

        <ActionButton
          onClick={onWrite}
          isLoading={isLoading.write}
          icon="📝"
          label="Draft Document"
          description="Create structured content"
        />

        <ActionButton
          onClick={onMockup}
          isLoading={isLoading.mockup}
          icon="🎨"
          label="Generate Mockup"
          description="Visualize as UI design"
        />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  icon: string;
  label: string;
  description: string;
}

function ActionButton({ onClick, isLoading, icon, label, description }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full p-3 bg-slate-800/40 hover:bg-slate-800/60
                 rounded-lg border border-slate-700/30 hover:border-slate-600/40
                 text-left transition-all duration-200
                 disabled:opacity-50 disabled:cursor-not-allowed
                 group"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200 group-hover:text-slate-100">
            {isLoading ? 'Processing...' : label}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        </div>
      </div>
    </button>
  );
}

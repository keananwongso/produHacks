'use client';

import { useDrag } from '@use-gesture/react';
import { Node as NodeType } from '@/lib/types';
import { NODE_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';

interface NodeProps {
  node: NodeType;
  onDrag: (id: string, x: number, y: number, isDragging: boolean, throwVx?: number, throwVy?: number) => void;
  onDoubleClick?: (id: string) => void;
  onClick?: (id: string) => void;
  zoom?: number;
}

function ChecklistContent({ metadata }: { metadata: Record<string, any> }) {
  const items = metadata?.items || [];
  return (
    <div className="space-y-1.5 mt-1">
      {items.slice(0, 6).map((item: any, i: number) => (
        <div key={i} className="flex items-start gap-2 text-xs">
          <div className="w-3.5 h-3.5 mt-0.5 rounded border border-[#B8A8D4]/60 flex-shrink-0" />
          <div>
            <span className="text-[#1A1A1A]">{item.text}</span>
            {item.due && (
              <span className="ml-1 text-[10px] text-[#1A1A1A]/40">{item.due}</span>
            )}
          </div>
        </div>
      ))}
      {items.length > 6 && (
        <div className="text-[10px] text-[#1A1A1A]/40">+{items.length - 6} more</div>
      )}
    </div>
  );
}

function DocumentContent({ metadata }: { metadata: Record<string, any> }) {
  const markdown = metadata?.markdown || '';
  // Simple markdown rendering — bold, headers, bullets
  const lines = markdown.split('\n').slice(0, 8);
  return (
    <div className="space-y-1 mt-1 text-xs text-[#1A1A1A]/80 leading-relaxed">
      {lines.map((line: string, i: number) => {
        if (line.startsWith('# ')) return <div key={i} className="font-semibold text-sm">{line.slice(2)}</div>;
        if (line.startsWith('## ')) return <div key={i} className="font-semibold text-xs">{line.slice(3)}</div>;
        if (line.startsWith('- ')) return <div key={i} className="pl-2">• {line.slice(2)}</div>;
        if (line.startsWith('**') && line.endsWith('**')) return <div key={i} className="font-semibold">{line.slice(2, -2)}</div>;
        if (line.trim() === '') return null;
        return <div key={i}>{line}</div>;
      })}
      {markdown.split('\n').length > 8 && (
        <div className="text-[10px] text-[#1A1A1A]/40">... click to expand</div>
      )}
    </div>
  );
}

function MockupContent({ metadata }: { metadata: Record<string, any> }) {
  const html = metadata?.html || '';
  return (
    <div className="mt-1 rounded-lg overflow-hidden border border-[#D4A857]/20">
      <iframe
        srcDoc={html}
        sandbox="allow-same-origin"
        className="w-full pointer-events-none"
        style={{ height: '180px', border: 'none' }}
        title="Mockup preview"
      />
    </div>
  );
}

export function Node({ node, onDrag, onDoubleClick, onClick, zoom = 1 }: NodeProps) {
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const lastPosRef = useRef({ x: node.x, y: node.y });

  const styles = NODE_STYLES[node.nodeType] || NODE_STYLES.thought;

  const isRichNode = node.nodeType === 'checklist' || node.nodeType === 'document' || node.nodeType === 'mockup';

  // Drag gesture with throw velocity
  const bind = useDrag(
    ({ offset: [x, y], active, velocity: [vxGesture, vyGesture], direction: [dx, dy] }) => {
      setIsDraggingLocal(active);

      if (active) {
        // Track velocity for throw
        velocityRef.current = {
          vx: vxGesture * dx * 3,
          vy: vyGesture * dy * 3,
        };
        lastPosRef.current = { x, y };
        onDrag(node.id, x, y, true);
      } else {
        // Release: pass throw velocity
        const throwVx = Math.abs(vxGesture) > 0.2 ? velocityRef.current.vx : 0;
        const throwVy = Math.abs(vyGesture) > 0.2 ? velocityRef.current.vy : 0;
        onDrag(node.id, x, y, false, throwVx, throwVy);
      }
    },
    {
      from: () => [node.x, node.y],
    }
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(node.id);
  };

  return (
    <div
      {...bind()}
      style={{
        transform: `translate(${node.x}px, ${node.y}px) scale(${isDraggingLocal ? 1.05 : 1})`,
        touchAction: 'none',
        transition: isDraggingLocal ? 'none' : 'transform 0.15s ease-out',
      }}
      className={cn(
        'absolute select-none',
        isDraggingLocal ? 'cursor-grabbing z-10' : 'cursor-grab'
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          'px-4 py-3 rounded-xl border',
          isRichNode ? 'max-w-[320px]' : 'max-w-[240px]',
          'transition-all duration-200',
          'node-spawn',
          styles.bg,
          styles.border,
          styles.glow,
          // Hover: brighter border, stronger shadow
          'hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)]',
          isDraggingLocal && 'shadow-[0_8px_30px_rgba(0,0,0,0.15)]'
        )}
      >
        {/* Title */}
        <p className={cn('text-sm leading-relaxed font-medium', styles.text)}>
          {node.text}
        </p>

        {/* Rich content by type */}
        {node.nodeType === 'checklist' && <ChecklistContent metadata={node.metadata} />}
        {node.nodeType === 'document' && <DocumentContent metadata={node.metadata} />}
        {node.nodeType === 'mockup' && <MockupContent metadata={node.metadata} />}

        {/* Node type indicator */}
        <div className="mt-1 flex items-center gap-2 text-[10px]">
          {node.isAI && (
            <span className="text-[#D4A857]/70 font-medium">AI</span>
          )}
          {styles.icon && (
            <span className="opacity-60">{styles.icon}</span>
          )}
        </div>
      </div>
    </div>
  );
}

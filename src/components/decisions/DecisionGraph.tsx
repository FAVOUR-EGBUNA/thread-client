import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type {
  DecisionRelationType,
  DecisionStatus,
} from "../../types/decision";

export type GraphDecisionNode = {
  id: string;
  title: string;
  status: DecisionStatus;
  context: string;
  decision: string;
  reasoning: string | null;
};

export type GraphDecisionEdge = {
  id: string;
  source: string;
  target: string;
  type: DecisionRelationType;
};

type DecisionGraphProps = {
  nodes: GraphDecisionNode[];
  edges: GraphDecisionEdge[];
  impactedDecisionIds?: number[];
  rootDecisionId?: number | null;
};

type DecisionNodeData = {
  label: string;
  status: DecisionStatus;
  impacted: boolean;
  root: boolean;
};

function statusLabel(status: DecisionStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function DecisionNode({ data }: NodeProps<Node<DecisionNodeData>>) {
  return (
    <div
      className={`w-[230px] rounded-2xl border bg-white p-4 shadow-sm transition ${
        data.root
          ? "border-thread-500 ring-4 ring-thread-100"
          : data.impacted
            ? "border-amber-300 ring-4 ring-amber-50"
            : "border-zinc-200"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2.5 !border-2 !border-white !bg-zinc-400"
      />

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        {data.root ? "Impact source" : data.impacted ? "Impacted" : "Decision"}
      </p>

      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-zinc-900">
        {data.label}
      </p>

      <span className="mt-3 inline-flex rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-600">
        {statusLabel(data.status)}
      </span>

      <Handle
        type="source"
        position={Position.Right}
        className="!size-2.5 !border-2 !border-white !bg-thread-600"
      />
    </div>
  );
}

const nodeTypes = {
  decision: DecisionNode,
};

export default function DecisionGraph({
  nodes: graphNodes,
  edges: graphEdges,
  impactedDecisionIds = [],
  rootDecisionId = null,
}: DecisionGraphProps) {
  const navigate = useNavigate();

  const impactedSet = useMemo(
    () => new Set(impactedDecisionIds),
    [impactedDecisionIds],
  );

  const nodes = useMemo<Node<DecisionNodeData>[]>(
    () =>
      graphNodes.map((decision, index) => ({
        id: decision.id,
        type: "decision",
        position: {
          x: (index % 3) * 330,
          y: Math.floor(index / 3) * 210,
        },
        data: {
          label: decision.title,
          status: decision.status,
          impacted: impactedSet.has(Number(decision.id)),
          root: Number(decision.id) === rootDecisionId,
        },
      })),
    [graphNodes, impactedSet, rootDecisionId],
  );

  const edges = useMemo<Edge[]>(
    () =>
      graphEdges.map((relation) => ({
        id: relation.id,
        source: relation.source,
        target: relation.target,
        label: relation.type.replaceAll("_", " "),
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          strokeWidth: 1.5,
        },
        labelStyle: {
          fontSize: 10,
          fontWeight: 600,
        },
      })),
    [graphEdges],
  );

  if (graphNodes.length === 0) {
    return (
      <div className="flex h-[520px] items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white">
        <div className="max-w-sm text-center">
          <p className="font-medium text-zinc-800">No decisions to visualize</p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Record decisions in this project before opening the graph.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[620px] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
        minZoom={0.35}
        maxZoom={1.5}
        nodesDraggable
        onNodeClick={(_, node) => {
          navigate(`/app/decisions/${node.id}`);
        }}
      >
        <Background gap={22} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

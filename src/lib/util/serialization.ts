// lib/util/serialization.ts

// Re-export types from node-schema for convenience
export type { JsonNodeData, FlowNode, FlowNodeData } from '../../routes/graph/flow/node-schema';

import type { JsonNodeData, FlowNode } from '../../routes/graph/flow/node-schema';
import { SvelteNodeToJsonNode, JsonNodeToSvelteNode } from '../../routes/graph/flow/node-schema';

export interface ExportedGraph {
	name: string;
	nodes: JsonNodeData[];
}

/**
 * Convert in-memory graph map to JSON-serializable array.
 */
export function GraphsToJson(graphMap: Record<string, FlowNode[]>): ExportedGraph[] {
	return Object.entries(graphMap).map(([name, nodes]) => ({
		name,
		nodes: nodes.map(SvelteNodeToJsonNode)
	}));
}

/**
 * Result of parsing JSON graphs - includes computed next serial ID.
 */
export interface ParsedGraphs {
	graphs: Record<string, FlowNode[]>;
	nextSerialId: number;
}

/**
 * Parse JSON array to graph map and compute next serial ID.
 * Pure function - does not modify any stores.
 */
export function JsonToGraphs(arr: ExportedGraph[]): ParsedGraphs {
	// find the highest existing uniq_id in the imported JSON
	let nextId = 1;
	for (const { nodes } of arr) {
		for (const n of nodes) {
			const num = parseInt(n.uniq_id, 10);
			if (!isNaN(num) && num >= nextId) nextId = num + 1;
		}
	}

	// convert JSON nodes back to FlowNode instances
	const graphs: Record<string, FlowNode[]> = {};
	for (const { name, nodes } of arr) {
		graphs[name] = nodes.map(JsonNodeToSvelteNode);
	}

	return { graphs, nextSerialId: nextId };
}

/**
 * Compute the next serial ID from a list of exported graphs.
 */
export function computeNextSerialId(arr: ExportedGraph[]): number {
	let nextId = 1;
	for (const { nodes } of arr) {
		for (const n of nodes) {
			const num = parseInt(n.uniq_id, 10);
			if (!isNaN(num) && num >= nextId) nextId = num + 1;
		}
	}
	return nextId;
}

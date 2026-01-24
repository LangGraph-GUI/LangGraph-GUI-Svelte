<!-- routes/graph/flow/graphs-io.svelte -->
<script lang="ts" module>
	import { get } from 'svelte/store';
	import { graphs, usingSubgraph, serial_number } from './graphs.store.svelte';
	import { saveJsonToFile, loadJsonFromFile } from '$lib/io/json';
	import { SvelteNodeToJsonNode, JsonNodeToSvelteNode } from './node-schema';
	import type { JsonNodeData } from './node-schema';
	import { type ExportedGraph, GraphsToJson, JsonToGraphs } from '$lib/util/serialization';

	export async function saveGraphs(): Promise<void> {
		const gm = get(graphs);
		const out: ExportedGraph[] = GraphsToJson(gm);
		saveJsonToFile('graphs.json', out);
	}

	export async function loadGraphs(): Promise<void> {
		try {
			const arr = (await loadJsonFromFile()) as ExportedGraph[];
			const result = JsonToGraphs(arr);
			graphs.set(result.graphs);
			serial_number.set(result.nextSerialId);

			if (arr.length) {
				usingSubgraph.set(arr[0].name);
			}
		} catch (error) {
			alert('Failed to load graphs, errors: ' + error);
		}
	}

	/** Save *only* the current subgraph to `<subgraph-name>.json` */
	export async function saveSubGraph(): Promise<void> {
		const key = get(usingSubgraph);
		const all = get(graphs);
		const nodes = all[key] ?? [];
		const out: ExportedGraph = {
			name: key,
			nodes: nodes.map(SvelteNodeToJsonNode)
		};
		// prompts a download of e.g. "root.json" or "foo.json"
		saveJsonToFile(`${key}.json`, out);
	}

	/** Load a single subgraph JSON and replace the *current* subgraph with it */
	export async function loadSubGraph(): Promise<void> {
		try {
			// expects { name: string; nodes: JsonNodeData[] }
			const data = (await loadJsonFromFile()) as {
				name: string;
				nodes: JsonNodeData[];
			};
			const loaded = data.nodes.map(JsonNodeToSvelteNode);
			// overwrite only the current subgraph
			graphs.update((g) => {
				const current = get(usingSubgraph);
				g[current] = loaded;
				return g;
			});
		} catch (err) {
			alert('Failed to load subgraph, errors: ' + err);
		}
	}
</script>

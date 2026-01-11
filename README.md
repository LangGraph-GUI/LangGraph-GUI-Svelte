# LangGraph-GUI-svelte [LangGraph-GUI](../LangGraph-GUI-root)

## See [LangGraph-GUI](../LangGraph-GUI-root)


## 

### core design concept

SSOT is Nodes, singals to Edges
```
bind:nodes={$currentNodes}
edges={$currentEdges} 
```

Thus, everything such add edge, remove edge, that all modify node.data then signals trigger edge update

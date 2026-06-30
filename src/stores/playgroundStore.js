import { computed, ref } from "vue";
import { defineStore } from "pinia";

const STORAGE_KEY = "ric-cm-nav.playground";
const HISTORY_LIMIT = 50;

function createEmptyGraphState() {
  return {
    nodes: {},
    edges: {},
    layouts: { nodes: {} },
    nodeCounter: 1,
    edgeCounter: 1,
  };
}

function cloneGraphState(graphState) {
  return JSON.parse(JSON.stringify(graphState || createEmptyGraphState()));
}

function normalizeGraphState(graphState) {
  const state = graphState && typeof graphState === "object" ? graphState : {};
  return {
    nodes: state.nodes && typeof state.nodes === "object" ? cloneGraphState(state.nodes) : {},
    edges: state.edges && typeof state.edges === "object" ? cloneGraphState(state.edges) : {},
    layouts:
      state.layouts && typeof state.layouts === "object" && state.layouts.nodes
        ? { nodes: cloneGraphState(state.layouts.nodes) }
        : { nodes: {} },
    nodeCounter: Number.isFinite(Number(state.nodeCounter)) ? Number(state.nodeCounter) : 1,
    edgeCounter: Number.isFinite(Number(state.edgeCounter)) ? Number(state.edgeCounter) : 1,
  };
}

export const usePlaygroundStore = defineStore("playground", () => {
  const nodes = ref({});
  const edges = ref({});
  const layouts = ref({ nodes: {} });
  const nodeCounter = ref(1);
  const edgeCounter = ref(1);

  const history = ref([]);
  const historyIndex = ref(-1);
  const isRestoring = ref(false);
  const hasLoaded = ref(false);

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value >= 0 && historyIndex.value < history.value.length - 1);

  function snapshotGraphState() {
    return cloneGraphState({
      nodes: nodes.value,
      edges: edges.value,
      layouts: layouts.value,
      nodeCounter: nodeCounter.value,
      edgeCounter: edgeCounter.value,
    });
  }

  function applyGraphState(graphState) {
    const nextState = normalizeGraphState(graphState);
    isRestoring.value = true;
    nodes.value = nextState.nodes;
    edges.value = nextState.edges;
    layouts.value = nextState.layouts;
    nodeCounter.value = nextState.nodeCounter;
    edgeCounter.value = nextState.edgeCounter;
    isRestoring.value = false;
  }

  function resetHistoryToCurrent() {
    const snapshot = snapshotGraphState();
    history.value = [snapshot];
    historyIndex.value = 0;
  }

  function commitSnapshot() {
    if (isRestoring.value) return;

    const snapshot = snapshotGraphState();
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    history.value = [...history.value, snapshot];
    if (history.value.length > HISTORY_LIMIT) {
      history.value = history.value.slice(history.value.length - HISTORY_LIMIT);
    }
    historyIndex.value = history.value.length - 1;
    saveToStorage();
  }

  function loadFromStorage() {
    if (typeof window === "undefined" || !window.localStorage) {
      resetHistoryToCurrent();
      hasLoaded.value = true;
      return false;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      resetHistoryToCurrent();
      hasLoaded.value = true;
      return false;
    }

    try {
      const parsed = JSON.parse(raw);
      const graphState = parsed?.graph || parsed;
      applyGraphState(graphState);
      resetHistoryToCurrent();
      hasLoaded.value = true;
      return true;
    } catch (_error) {
      resetHistoryToCurrent();
      hasLoaded.value = true;
      return false;
    }
  }

  function saveToStorage() {
    if (typeof window === "undefined" || !window.localStorage) return;

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          graph: snapshotGraphState(),
        })
      );
    } catch (_error) {
      // Ignore storage quota or privacy errors; the in-memory store still works.
    }
  }

  function recordSnapshot() {
    commitSnapshot();
  }

  function restoreSnapshot(snapshot) {
    applyGraphState(snapshot);
    saveToStorage();
  }

  function undo() {
    if (!canUndo.value) return;
    historyIndex.value -= 1;
    restoreSnapshot(history.value[historyIndex.value]);
  }

  function redo() {
    if (!canRedo.value) return;
    historyIndex.value += 1;
    restoreSnapshot(history.value[historyIndex.value]);
  }

  function clearCanvas() {
    applyGraphState(createEmptyGraphState());
    commitSnapshot();
  }

  return {
    nodes,
    edges,
    layouts,
    nodeCounter,
    edgeCounter,
    history,
    historyIndex,
    hasLoaded,
    canUndo,
    canRedo,
    loadFromStorage,
    saveToStorage,
    recordSnapshot,
    undo,
    redo,
    clearCanvas,
  };
});
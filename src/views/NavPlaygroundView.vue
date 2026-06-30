<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { defineConfigs } from "v-network-graph";
import vSelect from "vue-select";
import { useMainStore } from "@/stores/store";
import { useLabels } from "@/composables/useLabels";
import { usePlaygroundStore } from "@/stores/playgroundStore";
import EntityCardView from "@/views/EntityCardView.vue";
import RelationCardView from "@/views/RelationCardView.vue";
import AttributeCardView from "@/views/AttributeCardView.vue";
import RelationAttributeCardView from "@/views/RelationAttributeCardView.vue";

const store = useMainStore();
const { t } = useLabels();
const playgroundStore = usePlaygroundStore();
const {
  nodes: playgroundNodes,
  edges: playgroundEdges,
  layouts: playgroundLayouts,
  nodeCounter,
  edgeCounter,
  canUndo,
  canRedo,
} = storeToRefs(playgroundStore);

const selectedEntityId = ref("");
const textNodeLabel = ref("");
const selectedRelationId = ref("");
const selectedAttributeId = ref("");
const relationSourceNodeId = ref("");
const relationTargetNodeId = ref("");
const attributeSourceNodeId = ref("");
const attributeTargetNodeId = ref("");
const selectedNodeIds = ref([]);
const selectedEdgeIds = ref([]);
const graphRef = ref(null);
const canvasRef = ref(null);
const editingTextNodeId = ref("");
const editingTextValue = ref("");
const editingInputRef = ref(null);
const editingOverlayPos = ref({ x: 0, y: 0 });
const showEntityPreviewModal = ref(false);
const previousSelectedEntityId = ref("");
const previousSelectedRelationId = ref("");
const previousSelectedAttributeId = ref("");
const previousSelectedRelattributeId = ref("");
const previewCardType = ref("entity");
const originalSelectActions = ref(null);
const showExportModal = ref(false);
const showImportModal = ref(false);
const importFile = ref(null);
const importStatus = ref("");
const importError = ref("");

const entityIdByName = computed(() => {
  const out = {};
  for (const entity of store.data.entities || []) {
    out[entity.Name] = entity.ID;
  }
  return out;
});

const descendantsByEntityId = computed(() => store.data.descendants || {});

function isEntityOrDescendant(entityId, baseEntityId) {
  if (!entityId || !baseEntityId) return false;
  if (entityId === baseEntityId) return true;
  return (descendantsByEntityId.value[baseEntityId] || []).includes(entityId);
}

function entityIdFromNode(nodeId) {
  return playgroundNodes.value[nodeId]?.entityId || "";
}

function commitGraphChange() {
  playgroundStore.recordSnapshot();
}

function isKeyboardEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true'], .vs__search"));
}

function handleKeyboardShortcuts(event) {
  if (!(event.ctrlKey || event.metaKey)) return;
  if (isKeyboardEditableTarget(event.target)) return;

  const key = event.key.toLowerCase();
  if (key === "z" && event.shiftKey) {
    event.preventDefault();
    playgroundStore.redo();
    return;
  }
  if (key === "z") {
    event.preventDefault();
    playgroundStore.undo();
    return;
  }
  if (key === "y") {
    event.preventDefault();
    playgroundStore.redo();
  }
}

async function ensureGraphVisible() {
  await nextTick();
  if (graphRef.value?.fitToContents) {
    await graphRef.value.fitToContents({ margin: 48 });
  }
}

function openExportModal() {
  showExportModal.value = true;
}

function closeExportModal() {
  showExportModal.value = false;
}

function openImportModal() {
  importFile.value = null;
  importStatus.value = "";
  importError.value = "";
  showImportModal.value = true;
}

function handleImportFileChange(event) {
  importFile.value = event?.target?.files?.[0] || null;
}

function closeImportModal() {
  showImportModal.value = false;
}

function triggerDownload(contentOrUrl, filename, mimeType = "application/octet-stream", isObjectUrl = false) {
  const a = document.createElement("a");
  if (isObjectUrl) {
    a.href = contentOrUrl;
  } else {
    const blob = new Blob([contentOrUrl], { type: mimeType });
    a.href = URL.createObjectURL(blob);
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (a.href.startsWith("blob:")) {
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}

async function getGraphSvgText() {
  if (graphRef.value?.exportAsSvgText) {
    return await graphRef.value.exportAsSvgText();
  }
  const svgEl = canvasRef.value?.querySelector("svg");
  return svgEl ? svgEl.outerHTML : "";
}

function getSvgSize(svgText) {
  try {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    const viewBox = svg?.getAttribute("viewBox");
    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3])) {
        return { width: Math.max(1, Math.round(parts[2])), height: Math.max(1, Math.round(parts[3])) };
      }
    }
  } catch (_e) {
    // Fallback to canvas size.
  }
  return {
    width: Math.max(1, Math.round(canvasRef.value?.clientWidth || 1200)),
    height: Math.max(1, Math.round(canvasRef.value?.clientHeight || 800)),
  };
}

async function exportGraphAsSvg() {
  const svgText = await getGraphSvgText();
  if (!svgText) return;
  triggerDownload(svgText, "nav-playground.svg", "image/svg+xml;charset=utf-8");
  closeExportModal();
}

async function exportGraphAsRaster(format) {
  const svgText = await getGraphSvgText();
  if (!svgText) return;
  const { width, height } = getSvgSize(svgText);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (format === "jpg") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);

    const mime = format === "jpg" ? "image/jpeg" : "image/png";
    const ext = format === "jpg" ? "jpg" : "png";
    const dataUrl = canvas.toDataURL(mime, 0.92);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `nav-playground.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    closeExportModal();
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function exportGraphAsPng() {
  return exportGraphAsRaster("png");
}

function exportGraphAsJpg() {
  return exportGraphAsRaster("jpg");
}

function exportGraphAsRiccmnav() {
  const payload = {
    format: "riccmnav",
    version: 1,
    createdAt: new Date().toISOString(),
    graph: {
      nodes: playgroundNodes.value,
      edges: playgroundEdges.value,
      layouts: playgroundLayouts.value,
      nodeCounter: nodeCounter.value,
      edgeCounter: edgeCounter.value,
    },
  };
  triggerDownload(JSON.stringify(payload, null, 2), "nav-playground.riccmnav", "application/json;charset=utf-8");
  closeExportModal();
}

function getNextCounter(prefix, obj, fallback) {
  const maxNum = Object.keys(obj || {})
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((n) => Number.isFinite(n))
    .reduce((acc, n) => Math.max(acc, n), 0);
  return Math.max(fallback, maxNum + 1);
}

async function importRiccmnav() {
  importError.value = "";
  importStatus.value = "";
  const file = importFile.value;
  if (!file) {
    importError.value = t("playground.pleaseSelectFile");
    return;
  }
  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const graph = parsed?.graph || parsed;
    if (!graph || typeof graph !== "object") {
      throw new Error(t("playground.invalidFileFormat"));
    }
    const nodes = graph.nodes || {};
    const edges = graph.edges || {};
    const layouts = graph.layouts || { nodes: {} };

    playgroundNodes.value = nodes;
    playgroundEdges.value = edges;
    playgroundLayouts.value = layouts?.nodes ? layouts : { nodes: {} };
    nodeCounter.value = getNextCounter("n", nodes, Number(graph.nodeCounter || 1));
    edgeCounter.value = getNextCounter("e", edges, Number(graph.edgeCounter || 1));
    selectedNodeIds.value = [];
    selectedEdgeIds.value = [];
    relationSourceNodeId.value = "";
    relationTargetNodeId.value = "";
    attributeSourceNodeId.value = "";
    attributeTargetNodeId.value = "";
    selectedRelationId.value = "";
    selectedAttributeId.value = "";
    importStatus.value = t("playground.importSuccess");
    commitGraphChange();
    await ensureGraphVisible();
  } catch (err) {
    importError.value = t("playground.importFailed", {
      message: err?.message || t("playground.invalidFileFormat"),
    });
  }
}

function setEditingOverlayPosition(nodeId) {
  const graphApi = graphRef.value;
  const canvasEl = canvasRef.value;
  const svgPos = playgroundLayouts.value.nodes?.[nodeId];
  if (!graphApi?.translateFromSvgToDomCoordinates || !canvasEl || !svgPos) return;

  const domPoint = graphApi.translateFromSvgToDomCoordinates({ x: svgPos.x, y: svgPos.y });
  const rect = canvasEl.getBoundingClientRect();

  const isAlreadyLocal =
    domPoint.x >= 0 &&
    domPoint.y >= 0 &&
    domPoint.x <= rect.width + 1 &&
    domPoint.y <= rect.height + 1;

  editingOverlayPos.value = isAlreadyLocal
    ? { x: domPoint.x, y: domPoint.y }
    : { x: domPoint.x - rect.left, y: domPoint.y - rect.top };
}

async function startInlineTextEdit(nodeId) {
  const nodeData = playgroundNodes.value[nodeId];
  if (!nodeData || nodeData.nodeType !== "text") return;

  editingTextNodeId.value = nodeId;
  editingTextValue.value = nodeData.displayName || nodeData.name || t("playground.textNodeDefault");
  await nextTick();
  setEditingOverlayPosition(nodeId);
  await nextTick();
  editingInputRef.value?.focus();
  editingInputRef.value?.select();
}

function saveInlineTextEdit() {
  const nodeId = editingTextNodeId.value;
  if (!nodeId || !playgroundNodes.value[nodeId]) return;
  const cleaned = editingTextValue.value.trim() || t("playground.textNodeDefault");
  playgroundNodes.value = {
    ...playgroundNodes.value,
    [nodeId]: {
      ...playgroundNodes.value[nodeId],
      name: cleaned,
      displayName: cleaned,
    },
  };
  commitGraphChange();
  editingTextNodeId.value = "";
}

function cancelInlineTextEdit() {
  editingTextNodeId.value = "";
}

function openEntityPreview() {
  if (!selectedEntityId.value) return;
  beginPreviewSession("entity");
  store.selected.entity = selectedEntityId.value;
}

function openRelationPreview() {
  if (!selectedRelationId.value) return;
  beginPreviewSession("relation");
  store.selected.relation = selectedRelationId.value;
}

function openAttributePreview() {
  if (!selectedAttributeId.value) return;
  beginPreviewSession("attribute");
  store.selected.attribute = selectedAttributeId.value;
}

function beginPreviewSession(initialCardType) {
  if (!showEntityPreviewModal.value) {
    previousSelectedEntityId.value = store.selected.entity;
    previousSelectedRelationId.value = store.selected.relation;
    previousSelectedAttributeId.value = store.selected.attribute;
    previousSelectedRelattributeId.value = store.selected.relattribute;
    if (!originalSelectActions.value) {
      originalSelectActions.value = {
        selectEntity: store.selectEntity,
        selectRelation: store.selectRelation,
        selectAttribute: store.selectAttribute,
        selectRelattribute: store.selectRelattribute,
      };
    }
    store.selectEntity = (entityCode) => {
      store.selected.entity = entityCode;
      previewCardType.value = "entity";
    };
    store.selectRelation = (relationCode) => {
      store.selected.relation = relationCode;
      previewCardType.value = "relation";
    };
    store.selectAttribute = (attributeCode) => {
      store.selected.attribute = attributeCode;
      previewCardType.value = "attribute";
    };
    store.selectRelattribute = (relattributeCode) => {
      store.selected.relattribute = relattributeCode;
      previewCardType.value = "relation-attribute";
    };
  }
  previewCardType.value = initialCardType;
  showEntityPreviewModal.value = true;
}

function closeEntityPreview() {
  showEntityPreviewModal.value = false;
  if (originalSelectActions.value) {
    store.selectEntity = originalSelectActions.value.selectEntity;
    store.selectRelation = originalSelectActions.value.selectRelation;
    store.selectAttribute = originalSelectActions.value.selectAttribute;
    store.selectRelattribute = originalSelectActions.value.selectRelattribute;
  }
  if (previousSelectedEntityId.value) {
    store.selected.entity = previousSelectedEntityId.value;
  }
  if (previousSelectedRelationId.value) {
    store.selected.relation = previousSelectedRelationId.value;
  }
  if (previousSelectedAttributeId.value) {
    store.selected.attribute = previousSelectedAttributeId.value;
  }
  if (previousSelectedRelattributeId.value) {
    store.selected.relattribute = previousSelectedRelattributeId.value;
  }
}

const previewCardComponent = computed(() => {
  if (previewCardType.value === "relation") return RelationCardView;
  if (previewCardType.value === "attribute") return AttributeCardView;
  if (previewCardType.value === "relation-attribute") return RelationAttributeCardView;
  return EntityCardView;
});

const previewCardTitle = computed(() => {
  if (previewCardType.value === "relation") return t("playground.previewRelationCardTitle");
  if (previewCardType.value === "attribute") return t("playground.previewAttributeCardTitle");
  if (previewCardType.value === "relation-attribute") return t("playground.previewRelationAttributeCardTitle");
  return t("playground.previewEntityCardTitle");
});

const entityOptions = computed(() => {
  const options = [];
  const seen = new Set();

  const pushOption = (id, name, depth) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    const levelPrefix = depth > 0 ? `${"- ".repeat(depth)}` : "";
    options.push({
      value: id,
      label: `${levelPrefix}${id} ${name || ""}`.trim(),
    });
  };

  const walkHierarchy = (nodes, depth = 0) => {
    for (const node of nodes || []) {
      pushOption(node.code, node.name, depth);
      if (Array.isArray(node.children) && node.children.length > 0) {
        walkHierarchy(node.children, depth + 1);
      }
    }
  };

  walkHierarchy(store.data.ent_hierarchy || [], 0);

  for (const entity of (store.data.entities || []).sort((a, b) => a.ID.localeCompare(b.ID))) {
    pushOption(entity.ID, entity.Name, 0);
  }

  return options;
});

const relationDefinitions = computed(() => {
  const relationRows = store.data.relations || [];
  const relationNameById = new Map();
  for (const rel of relationRows) {
    const relationId = rel["Relation ID"];
    if (!relationId || relationNameById.has(relationId)) continue;
    relationNameById.set(relationId, rel["Name"] || relationId);
  }

  const byId = new Map();
  const ensureRelation = (relationId, fallbackName = "") => {
    if (!relationId) return null;
    if (!byId.has(relationId)) {
      const relationName = relationNameById.get(relationId) || fallbackName || relationId;
      byId.set(relationId, {
        value: relationId,
        label: `${relationId} ${relationName}`.trim(),
        constraints: [],
      });
    }
    return byId.get(relationId);
  };

  const addConstraint = (relationId, domainId, rangeId, fallbackName = "") => {
    const item = ensureRelation(relationId, fallbackName);
    if (!item || !domainId || !rangeId) return;
    const key = `${domainId}=>${rangeId}`;
    if (!item.constraints.some((constraint) => constraint.key === key)) {
      item.constraints.push({
        key,
        domainId,
        rangeId,
      });
    }
  };

  for (const rel of relationRows) {
    const relationId = rel["Relation ID"];
    if (!relationId) continue;
    addConstraint(relationId, rel["DomainID"], rel["RangeID"], rel["Name"]);

    const inverseRelationId = relationId.endsWith("i") ? relationId.slice(0, -1) : `${relationId}i`;
    addConstraint(inverseRelationId, rel["RangeID"], rel["DomainID"]);
  }

  return Array.from(byId.values()).sort((a, b) => a.value.localeCompare(b.value));
});

const validRelationOptions = computed(() => {
  const sourceEntityId = entityIdFromNode(relationSourceNodeId.value);
  const targetEntityId = entityIdFromNode(relationTargetNodeId.value);

  return relationDefinitions.value.filter((relation) =>
    relation.constraints.some(
      (constraint) =>
        (!sourceEntityId || isEntityOrDescendant(sourceEntityId, constraint.domainId)) &&
        (!targetEntityId || isEntityOrDescendant(targetEntityId, constraint.rangeId))
    )
  );
});

const attributeDefinitions = computed(() =>
  (store.data.attributes || [])
    .map((attr) => {
      const validEntityCodes = new Set();
      for (const domainName of attr.Domain || []) {
        const domainId = entityIdByName.value[domainName];
        if (!domainId) continue;
        validEntityCodes.add(domainId);
        for (const descId of descendantsByEntityId.value[domainId] || []) {
          validEntityCodes.add(descId);
        }
      }
      return {
        value: attr.ID,
        label: `${attr.ID} ${attr.Name}`,
        validEntityCodes: Array.from(validEntityCodes),
      };
    })
    .sort((a, b) => a.value.localeCompare(b.value))
);

const validAttributeOptions = computed(() => {
  const sourceEntityId = entityIdFromNode(attributeSourceNodeId.value);
  if (!sourceEntityId) return attributeDefinitions.value;
  return attributeDefinitions.value.filter((attr) => attr.validEntityCodes.includes(sourceEntityId));
});

const entityNodeOptions = computed(() =>
  Object.entries(playgroundNodes.value)
    .filter(([, node]) => node.nodeType === "entity")
    .map(([id, node]) => ({ value: id, label: `${id}: ${node.displayName || node.name}` }))
    .sort((a, b) => a.label.localeCompare(b.label))
);

const relationSourceNodeOptions = computed(() =>
  entityNodeOptions.value.filter((opt) => opt.value !== relationTargetNodeId.value)
);

const relationTargetNodeOptions = computed(() =>
  entityNodeOptions.value.filter((opt) => opt.value !== relationSourceNodeId.value)
);

const textNodeOptions = computed(() =>
  Object.entries(playgroundNodes.value)
    .filter(([, node]) => node.nodeType === "text")
    .map(([id]) => ({ value: id, label: `${id}: ${t("playground.textNodeShort")}` }))
    .sort((a, b) => a.value.localeCompare(b.value))
);

const selectedNodeList = computed(() =>
  selectedNodeIds.value
    .map((id) => {
      const node = playgroundNodes.value[id];
      return node ? { id, ...node } : null;
    })
    .filter(Boolean)
);

const selectedEdgeList = computed(() =>
  selectedEdgeIds.value
    .map((id) => {
      const edge = playgroundEdges.value[id];
      return edge ? { id, ...edge } : null;
    })
    .filter(Boolean)
);

function selectedNodeListLabel(node) {
  if (node.nodeType === "text") return `${node.id}: ${t("playground.textNodeShort")}`;
  return `${node.id}: ${node.displayName || node.name}`;
}

function relationLabelById(relationId) {
  const rel = relationDefinitions.value.find((option) => option.value === relationId);
  return rel ? rel.label : relationId;
}

function attributeLabelById(attributeId) {
  const attr = attributeDefinitions.value.find((option) => option.value === attributeId);
  return attr ? attr.label : attributeId;
}

function addEntityNode() {
  if (!selectedEntityId.value) return;
  const entity = (store.data.entities || []).find((e) => e.ID === selectedEntityId.value);
  if (!entity) return;

  const id = `n${nodeCounter.value++}`;
  playgroundNodes.value = {
    ...playgroundNodes.value,
    [id]: {
      name: `${entity.ID} ${entity.Name}`,
      displayName: `${entity.ID} ${entity.Name}`,
      nodeType: "entity",
      entityId: entity.ID,
    },
  };
  const idx = Object.keys(playgroundNodes.value).length;
  playgroundLayouts.value = {
    nodes: {
      ...playgroundLayouts.value.nodes,
      [id]: {
        x: 220 + (idx % 4) * 170,
        y: 160 + (Math.floor(idx / 4) % 4) * 110,
      },
    },
  };
  commitGraphChange();
  ensureGraphVisible();
}

function addTextNode() {
  const displayName = textNodeLabel.value?.trim() || t("playground.textNodeDefault");
  const id = `n${nodeCounter.value++}`;
  playgroundNodes.value = {
    ...playgroundNodes.value,
    [id]: {
      name: displayName,
      displayName,
      nodeType: "text",
    },
  };
  const idx = Object.keys(playgroundNodes.value).length;
  playgroundLayouts.value = {
    nodes: {
      ...playgroundLayouts.value.nodes,
      [id]: {
        x: 260 + (idx % 4) * 170,
        y: 220 + (Math.floor(idx / 4) % 4) * 110,
      },
    },
  };
  commitGraphChange();
  ensureGraphVisible();
}

function addRelationEdge() {
  if (!selectedRelationId.value || !relationSourceNodeId.value || !relationTargetNodeId.value) return;
  const sourceEntityId = entityIdFromNode(relationSourceNodeId.value);
  const targetEntityId = entityIdFromNode(relationTargetNodeId.value);
  if (!sourceEntityId || !targetEntityId) return;
  const isValid = validRelationOptions.value.some((option) => option.value === selectedRelationId.value);
  if (!isValid) return;
  const edgeId = `e${edgeCounter.value++}`;
  playgroundEdges.value = {
    ...playgroundEdges.value,
    [edgeId]: {
      source: relationSourceNodeId.value,
      target: relationTargetNodeId.value,
      label: relationLabelById(selectedRelationId.value),
      edgeType: "relation",
    },
  };
  commitGraphChange();
  ensureGraphVisible();
}

function swapRelationNodes() {
  const sourceNodeId = relationSourceNodeId.value;
  relationSourceNodeId.value = relationTargetNodeId.value;
  relationTargetNodeId.value = sourceNodeId;
}

function addAttributeEdge() {
  if (!selectedAttributeId.value || !attributeSourceNodeId.value || !attributeTargetNodeId.value) return;
  const sourceEntityId = entityIdFromNode(attributeSourceNodeId.value);
  if (!sourceEntityId) return;
  const isValid = validAttributeOptions.value.some((option) => option.value === selectedAttributeId.value);
  if (!isValid) return;
  const edgeId = `e${edgeCounter.value++}`;
  playgroundEdges.value = {
    ...playgroundEdges.value,
    [edgeId]: {
      source: attributeSourceNodeId.value,
      target: attributeTargetNodeId.value,
      label: attributeLabelById(selectedAttributeId.value),
      edgeType: "attribute",
    },
  };
  commitGraphChange();
  ensureGraphVisible();
}

function removeNode(nodeId) {
  const nextNodes = { ...playgroundNodes.value };
  const nextLayouts = { ...playgroundLayouts.value.nodes };
  delete nextNodes[nodeId];
  delete nextLayouts[nodeId];

  const nextEdges = {};
  for (const [edgeId, edge] of Object.entries(playgroundEdges.value)) {
    if (edge.source !== nodeId && edge.target !== nodeId) {
      nextEdges[edgeId] = edge;
    }
  }
  playgroundNodes.value = nextNodes;
  playgroundLayouts.value = { nodes: nextLayouts };
  playgroundEdges.value = nextEdges;
  if (relationSourceNodeId.value === nodeId) relationSourceNodeId.value = "";
  if (relationTargetNodeId.value === nodeId) relationTargetNodeId.value = "";
  if (attributeSourceNodeId.value === nodeId) attributeSourceNodeId.value = "";
  if (attributeTargetNodeId.value === nodeId) attributeTargetNodeId.value = "";
  selectedNodeIds.value = selectedNodeIds.value.filter((id) => id !== nodeId);
  selectedEdgeIds.value = selectedEdgeIds.value.filter((id) => nextEdges[id]);
  commitGraphChange();
}

function removeEdge(edgeId) {
  const nextEdges = { ...playgroundEdges.value };
  delete nextEdges[edgeId];
  playgroundEdges.value = nextEdges;
  selectedEdgeIds.value = selectedEdgeIds.value.filter((id) => id !== edgeId);
  commitGraphChange();
}

function clearGraph() {
  playgroundStore.clearCanvas();
  selectedRelationId.value = "";
  selectedAttributeId.value = "";
  relationSourceNodeId.value = "";
  relationTargetNodeId.value = "";
  attributeSourceNodeId.value = "";
  attributeTargetNodeId.value = "";
  selectedNodeIds.value = [];
  selectedEdgeIds.value = [];
}

watch(validRelationOptions, (options) => {
  if (!options.some((option) => option.value === selectedRelationId.value)) {
    selectedRelationId.value = "";
  }
});

watch(validAttributeOptions, (options) => {
  if (!options.some((option) => option.value === selectedAttributeId.value)) {
    selectedAttributeId.value = "";
  }
});

watch(playgroundNodes, () => {
  selectedNodeIds.value = selectedNodeIds.value.filter((id) => Boolean(playgroundNodes.value[id]));
});

watch(playgroundEdges, () => {
  selectedEdgeIds.value = selectedEdgeIds.value.filter((id) => Boolean(playgroundEdges.value[id]));
});

const graphEventHandlers = {
  "node:dblclick": ({ node }) => {
    startInlineTextEdit(node);
  },
  "view:zoom": () => {
    if (editingTextNodeId.value) setEditingOverlayPosition(editingTextNodeId.value);
  },
  "view:pan": () => {
    if (editingTextNodeId.value) setEditingOverlayPosition(editingTextNodeId.value);
  },
  "node:dragend": () => {
    commitGraphChange();
    if (editingTextNodeId.value) setEditingOverlayPosition(editingTextNodeId.value);
  },
};

onMounted(() => {
  playgroundStore.loadFromStorage();
  window.addEventListener("keydown", handleKeyboardShortcuts);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyboardShortcuts);
});

const graphConfigs = defineConfigs({
  view: {
    scalingObjects: true,
  },
  node: {
    selectable: true,
    normal: {
      type: "rect",
      width: (node) => (node.nodeType === "entity" ? 220 : 190),
      height: (node) => (node.nodeType === "entity" ? 64 : 64),
      borderRadius: (node) => (node.nodeType === "entity" ? 14 : 10),
      radius: 0,
      color: (node) => (node.nodeType === "text" ? "#fff3cd" : "#dce8ff"),
      borderColor: (node) => (node.nodeType === "text" ? "#f59f00" : "#3457d5"),
      borderWidth: 1.5,
    },
    label: {
      visible: true,
      fontSize: 10,
      color: "#0f172a",
      direction: "center",
      lineHeight: 1.15,
    },
  },
  edge: {
    selectable: true,
    normal: {
      width: (edge) => (edge.edgeType === "attribute" ? 2.2 : 1.5),
      color: (edge) => (edge.edgeType === "attribute" ? "#f08c00" : "#6b7d90"),
      dasharray: (edge) => (edge.edgeType === "attribute" ? "8 4" : "0"),
    },
    selected: {
      width: (edge) => (edge.edgeType === "attribute" ? 3.4 : 3),
      color: (edge) => (edge.edgeType === "attribute" ? "#c56a00" : "#1f4fd6"),
      dasharray: (edge) => (edge.edgeType === "attribute" ? "8 4" : "0"),
      linecap: "round",
      animate: false,
      animationSpeed: 0,
    },
    marker: {
      target: {
        type: "arrow",
        width: 4,
        height: 4,
      },
    },
    label: {
      visible: true,
      fontSize: 10,
      color: "#334155",
      background: {
        visible: true,
        color: "#ffffff",
        padding: {
          vertical: 1,
          horizontal: 3,
        },
        borderRadius: 3,
      },
    },
  },
});
</script>

<template>
  <div class="playground-page">
    <h1>{{ t("playground.title") }}</h1>
    <p class="playground-note">
      {{ t("playground.description") }}
    </p>
    <div class="playground-legend">
      <span class="legend-item"><span class="legend-dot entity-dot"></span> {{ t("playground.legendEntityNode") }}</span>
      <span class="legend-item"><span class="legend-dot text-dot"></span> {{ t("playground.legendTextNode") }}</span>
      <span class="legend-item"><span class="legend-line rel-line"></span> {{ t("playground.legendRelationEdge") }}</span>
      <span class="legend-item"><span class="legend-line attr-line"></span> {{ t("playground.legendAttributeEdge") }}</span>
    </div>

    <div class="playground-grid">
      <aside class="playground-controls left-nav">
        <div class="left-nav-header">
          <h5 class="mb-0">{{ t("playground.configOptions") }}</h5>
        </div>
        <div class="control-group">
          <label class="form-label">{{ t("playground.addEntityNode") }}</label>
          <div class="control-row">
            <v-select class="control-select" :options="entityOptions" label="label" :reduce="(opt) => opt.value"
              :searchable="true" :clearable="true" v-model="selectedEntityId" :placeholder="t('playground.selectEntityPlaceholder')" />
            <button class="btn btn-sm btn-outline-secondary icon-btn" :disabled="!selectedEntityId"
               :title="t('playground.previewSelectedEntityCard')" @click="openEntityPreview">
              <i class="bi bi-info-circle"></i>
            </button>
            <button class="btn btn-sm btn-outline-primary" @click="addEntityNode">{{ t("playground.add") }}</button>
          </div>
        </div>

        <div class="control-group">
          <label class="form-label">{{ t("playground.addTextNode") }}</label>
          <div class="control-row">
            <input class="form-control form-control-sm" v-model="textNodeLabel" :placeholder="t('playground.textNodeLabel')" />
            <button class="btn btn-sm btn-outline-primary" @click="addTextNode">{{ t("playground.add") }}</button>
          </div>
        </div>

        <div class="control-group">
          <label class="form-label">{{ t("playground.addRelationEdge") }}</label>
          <div class="stack-row">
            <v-select class="control-select" :options="relationSourceNodeOptions" label="label"
              :reduce="(opt) => opt.value"
              :searchable="true" :clearable="true" v-model="relationSourceNodeId"
              :placeholder="t('playground.sourceEntityPlaceholder')" />
            <div class="select-info-row">
              <v-select class="control-select" :options="relationTargetNodeOptions" label="label"
                :reduce="(opt) => opt.value"
                :searchable="true" :clearable="true" v-model="relationTargetNodeId"
                :placeholder="t('playground.targetEntityPlaceholder')" />
              <button class="btn btn-sm btn-outline-secondary icon-btn"
                :disabled="!relationSourceNodeId && !relationTargetNodeId"
                 :title="t('playground.swapSourceTargetEntities')" @click="swapRelationNodes">
                <i class="bi bi-arrow-left-right"></i>
              </button>
            </div>
            <div class="select-info-row">
              <v-select class="control-select" :options="validRelationOptions" label="label"
                :reduce="(opt) => opt.value" :searchable="true" :clearable="true" v-model="selectedRelationId"
                :placeholder="t('playground.selectRelationPlaceholder')" />
              <button class="btn btn-sm btn-outline-secondary icon-btn" :disabled="!selectedRelationId"
                 :title="t('playground.previewSelectedRelationCard')" @click="openRelationPreview">
                <i class="bi bi-info-circle"></i>
              </button>
            </div>
            <button class="btn btn-sm btn-outline-primary" @click="addRelationEdge">{{ t("playground.addRelationEdge") }}</button>
          </div>
        </div>

        <div class="control-group">
          <label class="form-label">{{ t("playground.addAttributeEdge") }}</label>
          <div class="stack-row">
            <v-select class="control-select" :options="entityNodeOptions" label="label" :reduce="(opt) => opt.value"
              :searchable="true" :clearable="true" v-model="attributeSourceNodeId"
              :placeholder="t('playground.sourceEntityPlaceholder')" />
            <v-select class="control-select" :options="textNodeOptions" label="label" :reduce="(opt) => opt.value"
              :searchable="true" :clearable="true" v-model="attributeTargetNodeId" :placeholder="t('playground.targetTextPlaceholder')" />
            <div class="select-info-row">
              <v-select class="control-select" :options="validAttributeOptions" label="label"
                :reduce="(opt) => opt.value" :searchable="true" :clearable="true" v-model="selectedAttributeId"
                :placeholder="t('playground.selectAttributePlaceholder')" />
              <button class="btn btn-sm btn-outline-secondary icon-btn" :disabled="!selectedAttributeId"
                 :title="t('playground.previewSelectedAttributeCard')" @click="openAttributePreview">
                <i class="bi bi-info-circle"></i>
              </button>
            </div>
            <button class="btn btn-sm btn-outline-primary" @click="addAttributeEdge">{{ t("playground.addAttributeEdge") }}</button>
          </div>
        </div>

        <div class="control-group">
          <div class="action-row">
            <button class="btn btn-sm btn-outline-secondary" :disabled="!canUndo" @click="playgroundStore.undo()">
              {{ t("playground.undo") }}
            </button>
            <button class="btn btn-sm btn-outline-secondary" :disabled="!canRedo" @click="playgroundStore.redo()">
              {{ t("playground.redo") }}
            </button>
            <button class="btn btn-sm btn-outline-danger" @click="clearGraph">{{ t("playground.clearGraph") }}</button>
            <button class="btn btn-sm btn-outline-secondary" @click="openImportModal">{{ t("playground.import") }}</button>
            <button class="btn btn-sm btn-outline-secondary" @click="openExportModal">{{ t("playground.export") }}</button>
          </div>
        </div>

        <div class="control-group">
          <h6 class="mb-1">{{ t("playground.nodes") }}</h6>
          <ul class="side-list">
            <li v-for="node in selectedNodeList" :key="node.id">
              <span>{{ selectedNodeListLabel(node) }}</span>
              <button class="btn btn-sm btn-outline-secondary" @click="removeNode(node.id)">x</button>
            </li>
          </ul>
        </div>

        <div class="control-group">
          <h6 class="mb-1">{{ t("playground.edges") }}</h6>
          <ul class="side-list">
            <li v-for="edge in selectedEdgeList" :key="edge.id">
              <span>{{ edge.id }}: {{ edge.label }}</span>
              <button class="btn btn-sm btn-outline-secondary" @click="removeEdge(edge.id)">x</button>
            </li>
          </ul>
        </div>
      </aside>

      <div class="playground-canvas" ref="canvasRef">
        <v-network-graph ref="graphRef" :nodes="playgroundNodes" :edges="playgroundEdges" :layouts="playgroundLayouts"
          :configs="graphConfigs" :event-handlers="graphEventHandlers" v-model:selected-nodes="selectedNodeIds"
          v-model:selected-edges="selectedEdgeIds">
          <template #override-node-label="{ nodeId, x, y }">
            <g v-if="playgroundNodes[nodeId]">
              <template v-if="playgroundNodes[nodeId].nodeType === 'entity'">
                <text :x="x" :y="y - 8" :font-size="11" text-anchor="middle"
                  dominant-baseline="central" fill="#0f172a" font-weight="700">
                  {{ playgroundNodes[nodeId].displayName || playgroundNodes[nodeId].name }}
                </text>
                <text :x="x" :y="y + 9" :font-size="9" text-anchor="middle"
                  dominant-baseline="central" fill="#6b7280" font-weight="500">
                  {{ nodeId }}
                </text>
              </template>
              <template v-else>
                <text :x="x" :y="y - 8" :font-size="10" text-anchor="middle" dominant-baseline="central"
                  fill="#0f172a" font-weight="700">
                  {{ playgroundNodes[nodeId].displayName || playgroundNodes[nodeId].name }}
                </text>
                <text :x="x" :y="y + 9" :font-size="9" text-anchor="middle"
                  dominant-baseline="central" fill="#6b7280" font-weight="500">
                  {{ nodeId }}
                </text>
              </template>
            </g>
          </template>
          <template #edge-label="{ edge, area }">
            <g v-if="edge?.label">
              <text :x="(area.source.above.x + area.target.above.x) / 2" :y="(area.source.above.y + area.target.above.y) / 2"
                font-size="10" text-anchor="middle" dominant-baseline="central" fill="#334155" font-weight="600">
                {{ edge.label }}
              </text>
            </g>
          </template>
        </v-network-graph>
        <div v-if="editingTextNodeId" class="inline-node-editor"
          :style="{ left: `${editingOverlayPos.x}px`, top: `${editingOverlayPos.y}px` }">
          <input ref="editingInputRef" v-model="editingTextValue" class="form-control form-control-sm inline-node-input"
            @blur="saveInlineTextEdit" @keydown.enter.prevent="saveInlineTextEdit"
            @keydown.esc.prevent="cancelInlineTextEdit" />
        </div>
      </div>
    </div>

    <div v-if="showEntityPreviewModal" class="modal fade show d-block" tabindex="-1" role="dialog"
      aria-modal="true" @click.self="closeEntityPreview">
      <div class="modal-dialog preview-modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ previewCardTitle }}</h5>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="closeEntityPreview"></button>
          </div>
          <div class="modal-body preview-modal-body">
            <component :is="previewCardComponent" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="showEntityPreviewModal" class="modal-backdrop fade show"></div>

    <div v-if="showExportModal" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true"
      @click.self="closeExportModal">
      <div class="modal-dialog modal-sm modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ t("playground.exportGraphTitle") }}</h5>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="closeExportModal"></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">{{ t("playground.chooseExportFormat") }}</p>
            <div class="d-grid gap-2">
              <button class="btn btn-sm btn-outline-primary" @click="exportGraphAsPng">{{ t("playground.exportAsPng") }}</button>
              <button class="btn btn-sm btn-outline-primary" @click="exportGraphAsJpg">{{ t("playground.exportAsJpg") }}</button>
              <button class="btn btn-sm btn-outline-primary" @click="exportGraphAsSvg">{{ t("playground.exportAsSvg") }}</button>
              <button class="btn btn-sm btn-outline-primary" @click="exportGraphAsRiccmnav">{{ t("playground.exportAsRiccmnav") }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showExportModal" class="modal-backdrop fade show"></div>

    <div v-if="showImportModal" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true"
      @click.self="closeImportModal">
      <div class="modal-dialog modal-md modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ t("playground.importRiccmnavTitle") }}</h5>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="closeImportModal"></button>
          </div>
          <div class="modal-body">
            <label class="form-label">{{ t("playground.selectFile") }}</label>
            <input type="file" class="form-control form-control-sm" accept=".riccmnav,application/json"
              @change="handleImportFileChange" />
            <p v-if="importStatus" class="text-success small mt-2 mb-0">{{ importStatus }}</p>
            <p v-if="importError" class="text-danger small mt-2 mb-0">{{ importError }}</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-sm btn-secondary" @click="closeImportModal">{{ t("common.close") }}</button>
            <button type="button" class="btn btn-sm btn-primary" @click="importRiccmnav">{{ t("playground.import") }}</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showImportModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<style scoped>
.playground-note {
  margin-bottom: 0.5rem;
}

.playground-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
}

.legend-dot {
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 3px;
  display: inline-block;
}

.entity-dot {
  background: #e6efff;
  border: 1px solid #3b5fc0;
}

.text-dot {
  background: #fff3cd;
  border: 1px solid #f59f00;
}

.legend-line {
  width: 1.25rem;
  height: 0;
  border-top: 2px solid #6b7d90;
  display: inline-block;
}

.attr-line {
  border-top-color: #f08c00;
  border-top-style: dashed;
}

.playground-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 0.85rem;
}

.playground-controls {
  border: 1px solid #d0d7e2;
  border-radius: 10px;
  padding: 0.75rem 0.75rem 0.5rem;
  background: #ffffff;
  overflow: auto;
  max-height: 75vh;
}

.left-nav {
  position: sticky;
  top: 5.2rem;
}

.left-nav-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.45rem;
  margin-bottom: 0.65rem;
}

.playground-canvas {
  position: relative;
  height: 86vh;
  border: 1px solid #d0d7e2;
  border-radius: 10px;
  background: #fbfdff;
  overflow: hidden;
}

.inline-node-editor {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 8;
  width: 160px;
  pointer-events: auto;
}

.inline-node-input {
  text-align: center;
  font-size: 0.78rem;
  padding: 0.15rem 0.35rem;
  border-color: #f59f00;
  box-shadow: 0 0 0 0.1rem rgba(245, 159, 0, 0.2);
}

.preview-modal-body {
  max-height: 75vh;
  overflow: auto;
}

.preview-modal-dialog {
  width: min(95vw, 1400px);
  max-width: min(95vw, 1400px);
}

.playground-page {
  width: calc(100vw - 2rem);
  margin-left: calc(50% - 50vw + 1rem);
}

.control-group {
  margin-bottom: 0.9rem;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
}

.control-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.45rem;
  align-items: center;
}

.icon-btn {
  width: 2rem;
  min-width: 2rem;
  padding: 0.2rem 0.35rem;
}

.stack-row {
  display: grid;
  gap: 0.45rem;
}

.select-info-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.45rem;
  align-items: center;
}

.control-select {
  min-width: 0;
}

:deep(.control-select .vs__dropdown-toggle) {
  min-height: 31px;
  font-size: 0.875rem;
}

:deep(.control-select .vs__selected) {
  margin: 2px 0 0 4px;
}

.side-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.side-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.86rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.2rem 0.35rem;
}

@media (max-width: 992px) {
  .playground-grid {
    grid-template-columns: 1fr;
  }

  .left-nav {
    position: static;
  }

  .playground-canvas {
    height: 75vh;
  }

  .playground-page {
    width: 100%;
    margin-left: 0;
  }
}
</style>

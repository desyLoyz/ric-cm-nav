<script setup>
import { useMainStore } from '@/stores/store'
import { computed, reactive } from "vue";
import { useLabels } from '@/composables/useLabels';

const store = useMainStore()
const { t } = useLabels()

const relationColumnFilters = reactive({ code: "", name: "", domain: "", range: "" });
function clearRelationFilter(key) { relationColumnFilters[key] = ""; }

const entityNameById = computed(() => {
  const out = {};
  for (const entity of store.data.entities || []) out[entity.ID] = entity.Name || "";
  return out;
});

function getHierarchySearchText(entityCode) {
  const descendants = store.data.descendants?.[entityCode] || [];
  const tokens = [`${entityCode || ""} ${entityNameById.value[entityCode] || ""}`.trim()];
  for (const descendantCode of descendants) tokens.push(`${descendantCode || ""} ${entityNameById.value[descendantCode] || ""}`.trim());
  return tokens.join(" ").toLowerCase();
}

const filteredRelations = computed(() => {
  const codeKeyword = relationColumnFilters.code.trim().toLowerCase();
  const nameKeyword = relationColumnFilters.name.trim().toLowerCase();
  const domainKeyword = relationColumnFilters.domain.trim().toLowerCase();
  const rangeKeyword = relationColumnFilters.range.trim().toLowerCase();

  return store.getRelations.filter((item) => {
    const domainText = (item.v || []).map((rel) => getHierarchySearchText(rel.DomainID)).join(" ").toLowerCase();
    const rangeText = (item.v || []).map((rel) => getHierarchySearchText(rel.RangeID)).join(" ").toLowerCase();

    return (
      (codeKeyword === "" || (item.code || "").toLowerCase().indexOf(codeKeyword) > -1) &&
      (nameKeyword === "" || (item.name || "").toLowerCase().indexOf(nameKeyword) > -1) &&
      (domainKeyword === "" || domainText.indexOf(domainKeyword) > -1) &&
      (rangeKeyword === "" || rangeText.indexOf(rangeKeyword) > -1)
    );
  });
});

const groupedRelationRows = computed(() => filteredRelations.value.map((item) => {
  const domains = [];
  const ranges = [];
  const seenDomains = new Set();
  const seenRanges = new Set();
  for (const rel of item.v || []) {
    if (!seenDomains.has(rel.DomainID)) {
      seenDomains.add(rel.DomainID);
      domains.push({ id: rel.DomainID, name: rel.DomainName });
    }
    if (!seenRanges.has(rel.RangeID)) {
      seenRanges.add(rel.RangeID);
      ranges.push({ id: rel.RangeID, name: rel.RangeName });
    }
  }
  return { code: item.code, name: item.name, domains, ranges };
}));
</script>

<template>
  <div>
    <h1>{{ t('relationsView.title') }}</h1>
    <div class="row">
      <div class="relations-table-wrap">
        <table class="table table-sm relations-table">
          <thead>
            <tr>
              <th scope="col" class="thickcode">{{ t('common.code') }}</th>
              <th scope="col" class="thick minwidth">{{ t('common.name') }}</th>
              <th scope="col" class="thick minwidth">{{ t('common.domain') }}</th>
              <th scope="col" class="thick minwidth">{{ t('common.range') }}</th>
            </tr>
            <tr>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('common.searchCode')" v-model="relationColumnFilters.code"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearRelationFilter('code')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('common.searchName')" v-model="relationColumnFilters.name"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearRelationFilter('name')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('relationsView.searchDomain')" v-model="relationColumnFilters.domain"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearRelationFilter('domain')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('relationsView.searchRange')" v-model="relationColumnFilters.range"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearRelationFilter('range')"><i class="bi bi-x-circle"></i></button></div></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in groupedRelationRows" :key="item.code">
              <th scope="row"><a class="link-primary pnter" @click="store.selectRelation(item.code)">{{ item.code }}</a></th>
              <td class="minwidth">{{ item.name }}</td>
              <td class="minwidth"><ul class="entity-chip-list"><li class="entity-chip-item" v-for="domain in item.domains" :key="domain.id"><a class="link-primary pnter entity-chip-link" @click="store.selectEntity(domain.id)">{{ domain.id + " " + domain.name }}</a></li></ul></td>
              <td class="minwidth"><ul class="entity-chip-list"><li class="entity-chip-item" v-for="range in item.ranges" :key="range.id"><a class="link-primary pnter entity-chip-link" @click="store.selectEntity(range.id)">{{ range.id + " " + range.name }}</a></li></ul></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.thickcode { font-weight: bold; min-width: 100px; }
.thick { font-weight: bold; }
.minwidth { min-width: 200px; }
.pnter { cursor: pointer; }
.relations-table-wrap { max-height: 70vh; overflow-y: auto; overflow-x: auto; }
.relations-table thead th { background: #fff; }
.relations-table thead tr:first-child th { position: sticky; top: 0; z-index: 3; }
.relations-table thead tr:nth-child(2) th { position: sticky; top: 2.25rem; z-index: 2; }
.filter-clear-btn { padding: 0.15rem 0.4rem; }
.entity-chip-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.entity-chip-item { margin: 0; }
.entity-chip-link { display: inline-block; padding: 0.22rem 0.5rem; border: 1px solid #dbe4ff; border-radius: 999px; background: #f6f8ff; text-decoration: none; font-size: 0.92rem; line-height: 1.2; }
</style>

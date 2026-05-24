<script setup>
import { useMainStore } from '@/stores/store'
import { computed, reactive } from "vue";
import { useLabels } from '@/composables/useLabels';

const store = useMainStore()
const { t } = useLabels()

const attributeColumnFilters = reactive({ code: "", name: "", description: "", entities: "" });
function clearAttributeFilter(key) { attributeColumnFilters[key] = ""; }

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

const filteredAttributes = computed(() => {
  const codeKeyword = attributeColumnFilters.code.trim().toLowerCase();
  const nameKeyword = attributeColumnFilters.name.trim().toLowerCase();
  const descriptionKeyword = attributeColumnFilters.description.trim().toLowerCase();
  const entitiesKeyword = attributeColumnFilters.entities.trim().toLowerCase();

  return store.getAttributes.filter((item) => {
    const entitiesText = (item.entities || []).map((ent) => getHierarchySearchText(ent.code)).join(" ").toLowerCase();
    return (
      (codeKeyword === "" || (item.ID || "").toLowerCase().indexOf(codeKeyword) > -1) &&
      (nameKeyword === "" || (item.Name || "").toLowerCase().indexOf(nameKeyword) > -1) &&
      (descriptionKeyword === "" || (item.Definition || "").toLowerCase().indexOf(descriptionKeyword) > -1) &&
      (entitiesKeyword === "" || entitiesText.indexOf(entitiesKeyword) > -1)
    );
  });
});
</script>

<template>
  <div>
    <h1>{{ t('attributesView.title') }}</h1>
    <div class="row">
      <div class="attributes-table-wrap">
        <table class="table table-sm attributes-table">
          <thead>
            <tr>
              <th scope="col" class="thickcode">{{ t('common.code') }}</th>
              <th scope="col" class="thick minwidth">{{ t('common.name') }}</th>
              <th scope="col" class="thick minwidth">{{ t('common.description') }}</th>
              <th scope="col" class="thick minwidth">{{ t('nav.entities') }}</th>
            </tr>
            <tr>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('common.searchCode')" v-model="attributeColumnFilters.code"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearAttributeFilter('code')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('common.searchName')" v-model="attributeColumnFilters.name"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearAttributeFilter('name')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('common.searchDescription')" v-model="attributeColumnFilters.description"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearAttributeFilter('description')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('attributesView.searchEntities')" v-model="attributeColumnFilters.entities"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearAttributeFilter('entities')"><i class="bi bi-x-circle"></i></button></div></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredAttributes" :key="item.ID">
              <th scope="row"><a class="link-primary pnter" @click="store.selectAttribute(item['ID'])">{{ item["ID"] }}</a></th>
              <td class="minwidth">{{ item["Name"] }}</td>
              <td class="minwidth">{{ item["Definition"] }}</td>
              <td class="minwidth"><ul class="entity-chip-list"><li class="entity-chip-item" v-for="itm in item.entities" :key="itm.code"><a class="link-primary pnter entity-chip-link" @click="store.selectEntity(itm['code'])">{{ itm["code"] + " " + itm["name"] }}</a></li></ul></td>
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
.attributes-table-wrap { max-height: 70vh; overflow-y: auto; overflow-x: auto; }
.attributes-table thead th { background: #fff; }
.attributes-table thead tr:first-child th { position: sticky; top: 0; z-index: 3; }
.attributes-table thead tr:nth-child(2) th { position: sticky; top: 2.25rem; z-index: 2; }
.filter-clear-btn { padding: 0.15rem 0.4rem; }
.entity-chip-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.35rem; }
.entity-chip-item { margin: 0; }
.entity-chip-link { display: inline-block; padding: 0.22rem 0.5rem; border: 1px solid #dbe4ff; border-radius: 999px; background: #f6f8ff; text-decoration: none; font-size: 0.92rem; line-height: 1.2; }
</style>

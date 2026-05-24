<script setup>
import { useMainStore } from '@/stores/store'
import { computed, reactive } from "vue";
import { useLabels } from '@/composables/useLabels';

const store = useMainStore()
const { t } = useLabels()

const relAttrColumnFilters = reactive({ code: "", name: "", description: "", schema: "" });
function clearRelAttrFilter(key) { relAttrColumnFilters[key] = ""; }

function getSchemaParts(value) {
  return (value || "").split(/;|\|\|/).map((item) => item.trim()).filter((item) => item.length > 0);
}

const filteredRelAttributes = computed(() => {
  const codeKeyword = relAttrColumnFilters.code.trim().toLowerCase();
  const nameKeyword = relAttrColumnFilters.name.trim().toLowerCase();
  const descriptionKeyword = relAttrColumnFilters.description.trim().toLowerCase();
  const schemaKeyword = relAttrColumnFilters.schema.trim().toLowerCase();

  return (store.getRelattributes || []).filter((item) => {
    const schemaText = getSchemaParts(item["Value schema"]).join(" ").toLowerCase();
    return (
      (codeKeyword === "" || (item.ID || "").toLowerCase().indexOf(codeKeyword) > -1) &&
      (nameKeyword === "" || (item.Name || "").toLowerCase().indexOf(nameKeyword) > -1) &&
      (descriptionKeyword === "" || (item.Definition || "").toLowerCase().indexOf(descriptionKeyword) > -1) &&
      (schemaKeyword === "" || schemaText.indexOf(schemaKeyword) > -1)
    );
  });
});
</script>

<template>
  <div>
    <h1>{{ t('relationAttributesView.title') }}</h1>
    <div class="row">
      <div class="rel-attrs-table-wrap">
        <table class="table table-sm rel-attrs-table">
          <thead>
            <tr>
              <th scope="col" class="thickcode">{{ t('common.code') }}</th>
              <th scope="col" class="thick minwidth">{{ t('common.name') }}</th>
              <th scope="col" class="thick minwidth">{{ t('common.description') }}</th>
              <th scope="col" class="thick minwidth">{{ t('common.valueSchema') }}</th>
            </tr>
            <tr>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('common.searchCode')" v-model="relAttrColumnFilters.code"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearRelAttrFilter('code')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('common.searchName')" v-model="relAttrColumnFilters.name"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearRelAttrFilter('name')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('common.searchDescription')" v-model="relAttrColumnFilters.description"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearRelAttrFilter('description')"><i class="bi bi-x-circle"></i></button></div></th>
              <th scope="col"><div class="input-group input-group-sm"><input type="text" class="form-control form-control-sm" :placeholder="t('relationAttributesView.searchValueSchema')" v-model="relAttrColumnFilters.schema"><button class="btn btn-outline-secondary filter-clear-btn" type="button" @click="clearRelAttrFilter('schema')"><i class="bi bi-x-circle"></i></button></div></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredRelAttributes" :key="item.ID">
              <th scope="row"><a class="link-primary pnter" @click="store.selectRelattribute(item.ID)">{{ item.ID }}</a></th>
              <td class="minwidth">{{ item.Name }}</td>
              <td class="minwidth">{{ item.Definition }}</td>
              <td class="minwidth"><ul class="schema-chip-list"><li class="schema-chip-item" v-for="schemaPart in getSchemaParts(item['Value schema'])" :key="schemaPart"><span class="schema-chip">{{ schemaPart }}</span></li></ul></td>
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
.minwidth { min-width: 220px; }
.pnter { cursor: pointer; }
.rel-attrs-table-wrap { max-height: 70vh; overflow-y: auto; overflow-x: auto; }
.rel-attrs-table thead th { background: #fff; }
.rel-attrs-table thead tr:first-child th { position: sticky; top: 0; z-index: 3; }
.rel-attrs-table thead tr:nth-child(2) th { position: sticky; top: 2.25rem; z-index: 2; }
.filter-clear-btn { padding: 0.15rem 0.4rem; }
.schema-chip-list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.35rem; }
.schema-chip-item { margin: 0; }
.schema-chip { display: inline-block; padding: 0.18rem 0.48rem; border: 1px solid #dbe4ff; border-radius: 999px; background: #f6f8ff; font-size: 0.88rem; line-height: 1.2; }
</style>

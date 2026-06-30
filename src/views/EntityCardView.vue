<script setup>
import { useMainStore } from '@/stores/store'
import { useLabels } from '@/composables/useLabels'
import { computed, reactive, ref, watchEffect } from "vue";
import * as _ from "lodash";

// access the `store` variable anywhere in the component ✨
const store = useMainStore()
const { t } = useLabels()
const rel_type_inv = {
  "Domain": "Range",
  "Range": "Domain",
}

const activeRelationType = ref("Domain");

const relationColumnFilters = reactive({
  Domain: {
    code: "",
    name: "",
    opposite: "",
  },
  Range: {
    code: "",
    name: "",
    opposite: "",
  },
});

const groupedRelations = computed(() =>
  _.groupBy((store.getEntityInfo).entity.relations, "type")
);

const relationTypes = computed(() => _.keys(groupedRelations.value));

watchEffect(() => {
  if (relationTypes.value.length === 0) {
    activeRelationType.value = "Domain";
    return;
  }
  if (!relationTypes.value.includes(activeRelationType.value)) {
    activeRelationType.value = relationTypes.value[0];
  }
});

function setActiveRelationType(type) {
  activeRelationType.value = type;
}

function clearColumnFilter(type, key) {
  relationColumnFilters[type][key] = "";
}

function matchesFilter(value, keyword) {
  return (value || "").toLowerCase().indexOf(keyword) > -1;
}

function getFilteredRelations(type) {
  const rows = groupedRelations.value[type] || [];
  const filters = relationColumnFilters[type] || {
    code: "",
    name: "",
    opposite: "",
  };
  const codeKeyword = filters.code.trim().toLowerCase();
  const nameKeyword = filters.name.trim().toLowerCase();
  const oppositeKeyword = filters.opposite.trim().toLowerCase();

  const groupedByRelation = _.groupBy(rows, "Relation ID");
  const groupedRows = _.map(groupedByRelation, (relationRows, relationId) => {
    const oppositeMap = {};
    for (const rel of relationRows) {
      const oppositeEntity = rel[rel_type_inv[type]] || {};
      if (oppositeEntity.code && !oppositeMap[oppositeEntity.code]) {
        oppositeMap[oppositeEntity.code] = {
          code: oppositeEntity.code,
          name: oppositeEntity.name,
        };
      }
    }

    return {
      relationId,
      name: relationRows[0]?.Name || "",
      opposites: _.values(oppositeMap),
    };
  });

  return _.filter(groupedRows, (item) => {
    const oppositeText = item.opposites
      .map((o) => `${o.code || ""} ${o.name || ""}`.trim())
      .join(" ")
      .toLowerCase();

    return (
      (codeKeyword === "" || matchesFilter(item.relationId, codeKeyword)) &&
      (nameKeyword === "" || matchesFilter(item.name, nameKeyword)) &&
      (oppositeKeyword === "" || oppositeText.indexOf(oppositeKeyword) > -1)
    );
  });
}

const activeRelations = computed(() => {
  return getFilteredRelations(activeRelationType.value);
});

const activeOppositeType = computed(() => {
  return rel_type_inv[activeRelationType.value] || "Range";
});
</script>

<template>
  <div>
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"></li>
        <li class="breadcrumb-item" v-for="i in (store.getEntityInfo).entity.ancestors">
          <a href="#" @click.prevent="store.selectEntity(i.code)">{{ i.code }} {{ i.name }}</a>
        </li>
        <li class="breadcrumb-item">{{ (store.getEntityInfo).entity.code }} {{ (store.getEntityInfo).entity.name }}</li>
      </ol>
    </nav>
    <div class="row">
      <div class="col-sm-10 col">
        <h1>{{ (store.getEntityInfo).entity.code }} {{ (store.getEntityInfo).entity.name }} </h1>
      </div>
      <div class="col-sm-2 col text-end">
        <!-- <button type="button" class="btn btn-primary" @click="store.goBack">Back</button> -->
      </div>
    </div>
    <div class="row">
      <div class="col-sm-9 col">
        <div class="row">
          <div class="col-sm-12 col">
            <div class="list-group">
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.definition") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getEntityInfo).entity.definition.split('||')  ">
                  {{ i }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.scopeNotes") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getEntityInfo).entity.scopenotes.split('||')   ">
                  {{ i }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.examples") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getEntityInfo).entity.examples.split('||')    ">
                  {{ i }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.comments") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getEntityInfo).entity.comments.split('||')     ">
                  {{ i }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="row topmargin">
          <div class="col-sm-4 col">
            <div class="list-group">
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("entityCard.attributes") }}</h5>
                </div>
                <div class="overflow-auto maxheight">
                  <div class="attribute-tree">
                    <ul class="tree-root">
                      <li v-for="itm1 in (store.getEntityInfo).entity.attributes" class="tree-parent-node">
                        <div class="tree-parent-row">
                          <a class="link-primary pnter tree-parent-link" @click="store.selectEntity(itm1['code'])">
                            {{ itm1['code'] + " " + itm1['name'] }}
                          </a>
                          <span class="badge text-bg-light border">{{ itm1.attributes.length }}</span>
                        </div>
                        <ul class="tree-children">
                          <li v-for="itm2 in itm1.attributes" class="tree-child-node">
                            <a class="link-primary pnter tree-child-link" @click="store.selectAttribute(itm2['code'])">
                              {{ itm2['code'] + " " + itm2['name'] }}
                            </a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-sm-8 col">
            <div class="list-group">
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("entityCard.relations") }}</h5>
                </div>
                <div class="maxheight">
                  <div class="btn-group btn-group-sm mb-2" role="group" :aria-label="t('entityCard.relationTableToggle')">
                    <button v-for="type in relationTypes" type="button" class="btn"
                      :class="activeRelationType === type ? 'btn-primary' : 'btn-outline-primary'"
                      @click="setActiveRelationType(type)">
                      {{ type }}
                    </button>
                  </div>
                  <div v-if="relationTypes.length > 0">
                    <span class="thick">{{ t("entityCard.asType", { type: t(activeRelationType === "Domain" ? "common.domain" : "common.range") }) }}:</span>
                    <div class="relations-table-wrap">
                      <table class="table table-sm relations-table">
                        <thead>
                          <tr>
                            <th scope="col" class="thickcode">{{ t("common.code") }}</th>
                            <th scope="col" class="minwidth">{{ t("common.name") }}</th>
                            <th scope="col" class="minwidth">{{ t(activeOppositeType === "Domain" ? "common.domain" : "common.range") }}</th>
                          </tr>
                          <tr>
                            <th scope="col">
                              <div class="input-group input-group-sm">
                                <input type="text" class="form-control form-control-sm" :placeholder="t('common.searchCode')"
                                  v-model="relationColumnFilters[activeRelationType].code">
                                <button class="btn btn-outline-secondary filter-clear-btn" type="button"
                                  @click="clearColumnFilter(activeRelationType, 'code')">
                                  <i class="bi bi-x-circle"></i>
                                </button>
                              </div>
                            </th>
                            <th scope="col">
                              <div class="input-group input-group-sm">
                                <input type="text" class="form-control form-control-sm" :placeholder="t('common.searchName')"
                                  v-model="relationColumnFilters[activeRelationType].name">
                                <button class="btn btn-outline-secondary filter-clear-btn" type="button"
                                  @click="clearColumnFilter(activeRelationType, 'name')">
                                  <i class="bi bi-x-circle"></i>
                                </button>
                              </div>
                            </th>
                            <th scope="col">
                              <div class="input-group input-group-sm">
                                <input type="text" class="form-control form-control-sm"
                                  :placeholder="t('entityCard.searchType', { type: t(activeOppositeType === 'Domain' ? 'common.domain' : 'common.range') })"
                                  v-model="relationColumnFilters[activeRelationType].opposite">
                                <button class="btn btn-outline-secondary filter-clear-btn" type="button"
                                  @click="clearColumnFilter(activeRelationType, 'opposite')">
                                  <i class="bi bi-x-circle"></i>
                                </button>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="item in activeRelations">
                            <th scope="row">
                              <a class="link-primary pnter" @click="store.selectRelation(item.relationId)">
                                {{ item.relationId }}
                              </a>
                            </th>
                            <td>
                              {{ item.name }}
                            </td>
                            <td class="minwidth">
                              <ul class="entity-chip-list">
                                <li class="entity-chip-item" v-for="op in item.opposites">
                                  <a class="link-primary pnter entity-chip-link" @click="store.selectEntity(op.code)">
                                    {{ op.code }} {{ op.name }}
                                  </a>
                                </li>
                              </ul>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-3 col">
        <div class="list-group">
          <div class="list-group-item list-group-item-action flex-column align-items-start">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">{{ t("entityCard.descendants") }}</h5>
            </div>
            <div class="overflow-auto fullheight">
              <div class="desc-tree">
                <ul class="desc-root">
                  <li v-for="itm2 in _.filter((store.getEntityInfo).entity.levels, (o) => { return o['l2'] > 0 && o['l3'] == 0 && o['l4'] == 0 && o['code'] != null; })"
                    class="desc-l2">
                    <a class="link-primary pnter desc-link desc-link-l2" @click="store.selectEntity(itm2['code'])">
                      {{ itm2['code'] + " " + itm2['name'] }}
                    </a>
                    <ul class="desc-level">
                      <li v-for="itm3 in _.filter((store.getEntityInfo).entity.levels, (o) => {
                        return o['l2'] == itm2['l2']
                          && o['l3'] > 0 && o['l4'] == 0 && o['code'] != null;
                      })" class="desc-l3">
                        <a class="link-primary pnter desc-link desc-link-l3" @click="store.selectEntity(itm3['code'])">
                          {{ itm3['code'] + " " + itm3['name'] }}
                        </a>
                        <ul class="desc-level">
                          <li v-for="itm4 in _.filter((store.getEntityInfo).entity.levels, (o) => {
                            return o['l2'] == itm2['l2']
                              && o['l3'] == itm3['l3'] && o['l4'] > 0 && o['code'] != null;
                          })" class="desc-l4">
                            <a class="link-primary pnter desc-link desc-link-l4" @click="store.selectEntity(itm4['code'])">
                              {{ itm4['code'] + " " + itm4['name'] }}
                            </a>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- <div class="col-sm-1 col text-end">
      </div> -->
    </div>
  </div>
</template>

<style scoped>
.thick {
  font-weight: bold;
  min-width: 150px;
}

.topmargin {
  padding-top: 1rem;
}

.thickcode {
  font-weight: bold;
  min-width: 100px;
}

.minwidth {
  font-weight: bold;
  min-width: 180px;
}

.pnter {
  cursor: pointer;
}

.maxheight {
  height: 500px;
}

.fullheight {
  height: 100%;
}

.attribute-tree {
  padding-right: 0.25rem;
}

.tree-root,
.tree-children {
  list-style: none;
  margin: 0;
  padding-left: 0;
}

.tree-parent-node {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  margin-bottom: 0.75rem;
}

.tree-parent-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.tree-parent-link {
  font-weight: 600;
  text-decoration: none;
}

.tree-children {
  margin-top: 0.5rem;
  margin-left: 0.35rem;
  padding-left: 0.75rem;
  border-left: 2px solid #dee2e6;
}

.tree-child-node {
  position: relative;
  margin: 0.35rem 0;
  padding-left: 0.75rem;
}

.tree-child-node::before {
  content: "";
  position: absolute;
  left: -0.75rem;
  top: 0.65rem;
  width: 0.65rem;
  border-top: 2px solid #dee2e6;
}

.tree-child-link {
  display: block;
  text-decoration: none;
  font-size: 0.94rem;
}

.relations-table-wrap {
  max-height: 390px;
  overflow-y: auto;
  overflow-x: auto;
}

.relations-table thead th {
  background: #fff;
}

.relations-table thead tr:first-child th {
  position: sticky;
  top: 0;
  z-index: 3;
}

.relations-table thead tr:nth-child(2) th {
  position: sticky;
  top: 2.25rem;
  z-index: 2;
}

.filter-clear-btn {
  padding: 0.15rem 0.4rem;
}

.entity-chip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.entity-chip-item {
  margin: 0;
}

.entity-chip-link {
  display: inline-block;
  padding: 0.22rem 0.5rem;
  border: 1px solid #dbe4ff;
  border-radius: 999px;
  background: #f6f8ff;
  text-decoration: none;
  font-size: 0.92rem;
  line-height: 1.2;
}

.desc-tree {
  padding-right: 0.25rem;
}

.desc-root,
.desc-level {
  list-style: none;
  margin: 0;
  padding-left: 0;
}

.desc-l2 {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.5rem 0.65rem;
  margin-bottom: 0.75rem;
}

.desc-level {
  margin-top: 0.45rem;
  margin-left: 0.35rem;
  padding-left: 0.8rem;
  border-left: 2px solid #dee2e6;
}

.desc-l3,
.desc-l4 {
  position: relative;
  margin: 0.35rem 0;
  padding-left: 0.75rem;
}

.desc-l3::before,
.desc-l4::before {
  content: "";
  position: absolute;
  left: -0.75rem;
  top: 0.62rem;
  width: 0.65rem;
  border-top: 2px solid #dee2e6;
}

.desc-link {
  display: block;
  text-decoration: none;
}

.desc-link-l2 {
  font-weight: 600;
}

.desc-link-l3 {
  font-weight: 500;
}

.desc-link-l4 {
  font-size: 0.94rem;
}
</style>

<script setup>
import { useMainStore } from '@/stores/store'
import { computed, reactive } from "vue";
import * as _ from "lodash";
import { useLabels } from '@/composables/useLabels';

const store = useMainStore()
const { t } = useLabels()

const entityColumnFilters = reactive({
  code: "",
  name: "",
  description: "",
});

function clearEntityFilter(key) {
  entityColumnFilters[key] = "";
}

const filteredEntities = computed(() => {
  const codeKeyword = entityColumnFilters.code.trim().toLowerCase();
  const nameKeyword = entityColumnFilters.name.trim().toLowerCase();
  const descriptionKeyword = entityColumnFilters.description.trim().toLowerCase();

  return _.filter(_.orderBy(store.data.entities, ["ID"], ["asc"]), (item) => {
    return (
      (codeKeyword === "" || item["ID"].toLowerCase().indexOf(codeKeyword) > -1) &&
      (nameKeyword === "" || item["Name"].toLowerCase().indexOf(nameKeyword) > -1) &&
      (descriptionKeyword === "" || item["Definition"].toLowerCase().indexOf(descriptionKeyword) > -1)
    );
  });
});
</script>

<template>
  <div>
    <h1>{{ t('entitiesView.title') }}</h1>
    <div class="row">
      <div class="col-sm-8 col">
        <div class="row">
          <div class="entities-table-wrap">
            <table class="table table-sm entities-table">
              <thead>
                <tr>
                  <th scope="col" class="thickcode">{{ t('common.code') }}</th>
                  <th scope="col" class="thick minwidth">{{ t('common.name') }}</th>
                  <th scope="col" class="thick minwidth">{{ t('common.description') }}</th>
                </tr>
                <tr>
                  <th scope="col">
                    <div class="input-group input-group-sm">
                      <input type="text" class="form-control form-control-sm" :placeholder="t('common.searchCode')"
                        v-model="entityColumnFilters.code">
                      <button class="btn btn-outline-secondary filter-clear-btn" type="button"
                        @click="clearEntityFilter('code')">
                        <i class="bi bi-x-circle"></i>
                      </button>
                    </div>
                  </th>
                  <th scope="col">
                    <div class="input-group input-group-sm">
                      <input type="text" class="form-control form-control-sm" :placeholder="t('common.searchName')"
                        v-model="entityColumnFilters.name">
                      <button class="btn btn-outline-secondary filter-clear-btn" type="button"
                        @click="clearEntityFilter('name')">
                        <i class="bi bi-x-circle"></i>
                      </button>
                    </div>
                  </th>
                  <th scope="col">
                    <div class="input-group input-group-sm">
                      <input type="text" class="form-control form-control-sm" :placeholder="t('common.searchDescription')"
                        v-model="entityColumnFilters.description">
                      <button class="btn btn-outline-secondary filter-clear-btn" type="button"
                        @click="clearEntityFilter('description')">
                        <i class="bi bi-x-circle"></i>
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredEntities" :key="item.ID">
                  <th scope="row">
                    <a class="link-primary pnter" @click="store.selectEntity(item['ID'])">{{ item["ID"] }}</a>
                  </th>
                  <td class="minwidth">{{ item["Name"] }}</td>
                  <td class="minwidth">{{ item["Definition"] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="col-sm-4 col">
        <div class="list-group">
          <div class="list-group-item list-group-item-action flex-column align-items-start">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">{{ t('entitiesView.hierarchy') }}</h5>
            </div>
            <div class="overflow-auto panel-scroll-height">
              <div class="entity-tree">
                <ul class="entity-root">
                  <li v-for="itm1 in store.data.ent_hierarchy" :key="itm1.code" class="entity-l1">
                    <a class="link-primary pnter entity-link entity-link-l1" @click="store.selectEntity(itm1['code'])">
                      {{ itm1['code'] + " " + itm1['name'] }}
                    </a>
                    <ul class="entity-level">
                      <li v-for="itm2 in itm1.children" :key="itm2.code" class="entity-l2">
                        <a class="link-primary pnter entity-link entity-link-l2" @click="store.selectEntity(itm2['code'])">
                          {{ itm2['code'] + " " + itm2['name'] }}
                        </a>
                        <ul class="entity-level">
                          <li v-for="itm3 in itm2.children" :key="itm3.code" class="entity-l3">
                            <a class="link-primary pnter entity-link entity-link-l3" @click="store.selectEntity(itm3['code'])">
                              {{ itm3['code'] + " " + itm3['name'] }}
                            </a>
                            <ul class="entity-level">
                              <li v-for="itm4 in itm3.children" :key="itm4.code" class="entity-l4">
                                <a class="link-primary pnter entity-link entity-link-l4"
                                  @click="store.selectEntity(itm4['code'])">
                                  {{ itm4['code'] + " " + itm4['name'] }}
                                </a>
                              </li>
                            </ul>
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

    </div>
  </div>
</template>

<style scoped>
.thickcode { font-weight: bold; min-width: 100px; }
.thick { font-weight: bold; }
.minwidth { min-width: 180px; }
.pnter { cursor: pointer; }
.entities-table-wrap { height: 70vh; overflow-y: auto; overflow-x: auto; }
.panel-scroll-height { height: 70vh; }
.entities-table thead th { background: #fff; }
.entities-table thead tr:first-child th { position: sticky; top: 0; z-index: 3; }
.entities-table thead tr:nth-child(2) th { position: sticky; top: 2.25rem; z-index: 2; }
.filter-clear-btn { padding: 0.15rem 0.4rem; }
.entity-tree { padding-right: 0.25rem; }
.entity-root, .entity-level { list-style: none; margin: 0; padding-left: 0; }
.entity-l1 { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 0.5rem 0.65rem; margin-bottom: 0.75rem; }
.entity-level { margin-top: 0.45rem; margin-left: 0.35rem; padding-left: 0.8rem; border-left: 2px solid #dee2e6; }
.entity-l2, .entity-l3, .entity-l4 { position: relative; margin: 0.35rem 0; padding-left: 0.75rem; }
.entity-l2::before, .entity-l3::before, .entity-l4::before { content: ""; position: absolute; left: -0.75rem; top: 0.62rem; width: 0.65rem; border-top: 2px solid #dee2e6; }
.entity-link { display: block; text-decoration: none; }
.entity-link-l1 { font-weight: 600; }
.entity-link-l2 { font-weight: 500; }
.entity-link-l3, .entity-link-l4 { font-size: 0.94rem; }
</style>

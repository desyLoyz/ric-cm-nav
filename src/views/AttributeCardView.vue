<script setup>
import { useMainStore } from '@/stores/store'
import { useLabels } from '@/composables/useLabels'
import * as _ from "lodash";

// access the `store` variable anywhere in the component ✨
const store = useMainStore()
const { t } = useLabels()
const rel_type_inv = {
  "Domain": "Range",
  "Range": "Domain",
}
</script>

<template>
  <div>
    <div class="row">
      <div class="col-sm-10 col">
        <h1>{{ (store.getAttributeInfo).attribute.ID }} {{ (store.getAttributeInfo).attribute.Name }} </h1>
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
                <p class="mb-1" v-for="i in (store.getAttributeInfo).attribute.Definition.split('||') ">
                  {{ i }}</p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.scope") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getAttributeInfo).attribute.Scope.split('||')  ">
                  {{ i }}</p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.specifications") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getAttributeInfo).attribute.Specifications.split('||')    ">
                  {{ i }}</p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.repeatability") }}</h5>
                </div>
                <p class="mb-1">
                  {{ (store.getAttributeInfo).attribute.Repeatability }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.extensibility") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getAttributeInfo).attribute.Extensibility.split('||') ">
                  {{ i }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.valueSchema") }}</h5>
                </div>
                <ul>
                  <li class="nav-item" v-for="i in (store.getAttributeInfo).attribute['Value schema']">
                    {{ i }}
                  </li>
                </ul>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.examples") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getAttributeInfo).attribute['Example'].split('||')    ">
                  {{ i }}
                </p>
                <p class="mb-1" v-for="i in (store.getAttributeInfo).attribute['Examples'].split('||')  ">
                  {{ i }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-3 col">
        <div class="list-group">
          <div class="list-group-item list-group-item-action flex-column align-items-start">
            <div class="d-flex w-100 justify-content-between">
              <h5 class="mb-1">{{ t("attributeCard.domainEntities") }}</h5>
            </div>
            <div class="overflow-auto fullheight">
              <div class="entity-list-wrap">
                <ul class="entity-list">
                  <li class="entity-list-item" v-for="i in (store.getAttributeInfo).attribute['entities']">
                    <a class="link-primary pnter entity-item-link" @click="store.selectEntity(i['code'])">
                      <span class="entity-code">{{ i['code'] }}</span>
                      <span class="entity-name">{{ i['name'] }}</span>
                    </a>
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

.entity-list-wrap {
  padding-right: 0.2rem;
}

.entity-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.entity-list-item {
  margin: 0;
}

.entity-item-link {
  display: block;
  padding: 0.45rem 0.55rem;
  border: 1px solid #dbe4ff;
  border-radius: 8px;
  background: #f6f8ff;
  text-decoration: none;
}

.entity-code {
  display: inline-block;
  font-weight: 600;
  margin-right: 0.35rem;
}

.entity-name {
  font-size: 0.94rem;
}
</style>

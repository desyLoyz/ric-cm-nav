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
    <!-- <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"></li>
        <li class="breadcrumb-item" v-for="i in (store.getEntityInfo).entity.ancestors">
          <a href="#" @click.prevent="store.selectEntity(i.code)">{{ i.code }} {{ i.name }}</a>
        </li>
        <li class="breadcrumb-item">{{ (store.getEntityInfo).entity.code }} {{ (store.getEntityInfo).entity.name }}</li>
      </ol>
    </nav> -->
    <div class="row">
      <div class="col-sm-10 col">
        <h1>{{ (store.getRelationInfo).relation.ID }} {{ (store.getRelationInfo).relation.Name }} </h1>
      </div>
      <div class="col-sm-2 col text-end">
        <!-- <button type="button" class="btn btn-primary" @click="store.goBack">Back</button> -->
      </div>
    </div>
    <div class="row relation-content-row">
      <div class="col-sm-9 col">
        <div class="row">
          <div class="col-sm-12 col">
            <div class="list-group">
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("relationCard.cardinality") }}</h5>
                </div>
                <p class="mb-1">{{ (store.getRelationInfo).relation["Cardinality"] }}</p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.definition") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getRelationInfo).relation.Definition.split('||')">
                  {{ i }}</p>
              </div>
              <div class=" list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.scopeNotes") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getRelationInfo).relation['Scope Notes'].split('||') ">
                  {{ i }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("common.examples") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getRelationInfo).relation['Examples'].split('||')  ">
                  {{ i }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start"
                v-if="(store.getRelationInfo).relation['BroadRels'].length == 0">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("relationCard.broaderRelations") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getRelationInfo).relation['Broader relations'].split('||')   ">
                  {{ i }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start"
                v-if="(store.getRelationInfo).relation['BroadRels'].length > 0">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("relationCard.broaderRelations") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getRelationInfo).relation['BroadRels']">
                  <a class="link-primary pnter" @click="store.selectRelation(i['code'])">
                    {{ i["code"] }} {{ i["name"] }}
                  </a>
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start"
                v-if="(store.getRelationInfo).relation['NarrowRels'].length == 0">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("relationCard.narrowerRelations") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getRelationInfo).relation['Narrower relations'].split('||')    ">
                  {{ i }}
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start"
                v-if="(store.getRelationInfo).relation['NarrowRels'].length > 0">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("relationCard.narrowerRelations") }}</h5>
                </div>
                <p class="mb-1" v-for="i in (store.getRelationInfo).relation['NarrowRels']    ">
                  <a class="link-primary pnter" @click="store.selectRelation(i['code'])">
                    {{ i["code"] }} {{ i["name"] }}
                  </a>
                </p>
              </div>
              <div class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">{{ t("relationCard.inverse") }}</h5>
                </div>
                <p class="mb-1">
                  <a class="link-primary pnter"
                    @click="store.selectRelation((store.getRelationInfo).relation['Inverse']['ID'])">
                    {{ (store.getRelationInfo).relation["Inverse"]["ID"] }} {{
          (store.getRelationInfo).relation["Inverse"]["Name"] }}
                  </a>

                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-3 col side-col">
        <div class="list-group side-panels">
          <div class="list-group-item list-group-item-action flex-column align-items-start side-panel">
            <div class="d-flex w-100 justify-content-between side-heading">
              <h5 class="mb-1">{{ t("common.domain") }}</h5>
            </div>
            <div class="side-list-scroll">
              <div class="entity-list-wrap">
                <ul class="entity-list">
                  <li class="entity-list-item" v-for="i in (store.getRelationInfo).relation['DomainEntities']">
                    <a class="link-primary pnter entity-item-link" @click="store.selectEntity(i['code'])">
                      <span class="entity-code">{{ i['code'] }}</span>
                      <span class="entity-name">{{ i['name'] }}</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="list-group-item list-group-item-action flex-column align-items-start side-panel">
            <div class="d-flex w-100 justify-content-between side-heading">
              <h5 class="mb-1">{{ t("common.range") }}</h5>
            </div>
            <div class="side-list-scroll">
              <div class="entity-list-wrap">
                <ul class="entity-list">
                  <li class="entity-list-item" v-for="i in (store.getRelationInfo).relation['RangeEntities']">
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

@media (min-width: 576px) {
  .relation-content-row {
    align-items: stretch;
  }

  .relation-content-row > .col-sm-9,
  .relation-content-row > .side-col {
    display: flex;
  }

  .relation-content-row > .col-sm-9 > .row {
    width: 100%;
  }

  .side-panels {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .side-panel {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .side-heading {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #fff;
    padding-bottom: 0.35rem;
    margin-bottom: 0.35rem;
    border-bottom: 1px solid #e9ecef;
  }

  .side-list-scroll {
    min-height: 0;
    overflow: auto;
  }
}
</style>

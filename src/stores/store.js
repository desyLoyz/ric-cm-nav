import { createPinia, defineStore } from "pinia";
import * as _ from "lodash";
import router from "@/router";
import * as DataService from "@/data_service";

let initData = null;
let initLocale = "en";

export const createStore = (initStoreData, locale = "en") => {
  initData = { ...initStoreData };
  initLocale = locale;
  return createPinia();
};

export const useMainStore = defineStore("main", {
  state: () => ({
    data: initData,
    locale: initLocale,
    selected: {
      entity: "RiC-E01",
      relation: "RiC-R001",
      attribute: "RiC-A01",
      relattribute: "RiC-RA01",
    },
    filters: {
      relations: "",
      attributes: "",
      entities: "",
    },
  }),
  getters: {
    getEntities: (state) => {
      let out = _.orderBy(state.data.entities, ["ID"], ["asc"]);
      let arr_keywords = state.filters.entities.split(" ");
      return _.filter(out, (x) => {
        for (let i in arr_keywords) {
          if (
            JSON.stringify(_.pick(x, ["ID", "Name", "Definition", "Scope Notes"]))
              .toLowerCase()
              .indexOf(arr_keywords[i].trim()) > -1
          ) {
            return true;
          }
        }
        return false;
      });
    },
    getEntityInfo: (state) => {
      let ent_tmp = _.find(state.data.entities, { ID: state.selected.entity });
      let descendants = [];
      if (_.indexOf(_.keys(state.data.descendants), state.selected.entity) > -1) {
        let tmp_desc = _.orderBy(state.data.descendants[state.selected.entity]);
        for (let k in tmp_desc) {
          descendants.push({
            code: tmp_desc[k],
            name: _.find(state.data.entities, {
              ID: tmp_desc[k],
            })["Name"],
          });
        }
      }

      let desc_levels = [];
      let tmp_curr_hierarchy = _.filter(
        _.orderBy(state.data.levels, ["level1ID", "level2ID", "level3ID", "level4ID"], ["asc", "asc", "asc", "asc"]),
        {
          level1ID: state.selected.entity,
        }
      );
      let str = {
        l2: 0,
        l3: 0,
        l4: 0,
        l2code: "NA",
        l3code: "NA",
        l4code: "NA",
      };
      for (let i in tmp_curr_hierarchy) {
        if (tmp_curr_hierarchy[i]["level2ID"] != str["l2code"]) {
          str["l2"] = str["l2"] + 1;
          str["l2code"] = tmp_curr_hierarchy[i]["level2ID"];
          str["l3"] = 0;
          str["l3code"] = "NA";
          str["l4"] = 0;
          str["l4code"] = "NA";
          desc_levels.push({
            l2: str["l2"],
            l3: str["l3"],
            l4: str["l4"],
            code: tmp_curr_hierarchy[i]["level2ID"],
            name:
              tmp_curr_hierarchy[i]["level2ID"] == null
                ? null
                : _.find(descendants, {
                    code: tmp_curr_hierarchy[i]["level2ID"],
                  })["name"],
          });
        }
        if (tmp_curr_hierarchy[i]["level3ID"] != str["l3code"]) {
          str["l3"] = str["l3"] + 1;
          str["l3code"] = tmp_curr_hierarchy[i]["level3ID"];
          str["l4"] = 0;
          str["l4code"] = "NA";
          desc_levels.push({
            l2: str["l2"],
            l3: str["l3"],
            l4: str["l4"],
            code: tmp_curr_hierarchy[i]["level3ID"],
            name:
              tmp_curr_hierarchy[i]["level3ID"] == null
                ? null
                : _.find(descendants, {
                    code: tmp_curr_hierarchy[i]["level3ID"],
                  })["name"],
          });
        }
        if (tmp_curr_hierarchy[i]["level4ID"] != str["l4code"]) {
          str["l4"] = str["l4"] + 1;
          str["l4code"] = tmp_curr_hierarchy[i]["level4ID"];
          desc_levels.push({
            l2: str["l2"],
            l3: str["l3"],
            l4: str["l4"],
            code: tmp_curr_hierarchy[i]["level4ID"],
            name:
              tmp_curr_hierarchy[i]["level4ID"] == null
                ? null
                : _.find(descendants, {
                    code: tmp_curr_hierarchy[i]["level4ID"],
                  })["name"],
          });
        }
      }

      let attributes = [];
      attributes.push({
        code: state.selected.entity,
        name: ent_tmp["Name"],
        attributes: ent_tmp["attributes"],
      });
      for (let i = ent_tmp["ancestors"].length - 1; i >= 0; i--) {
        attributes.push({
          code: ent_tmp["ancestors"][i].code,
          name: ent_tmp["ancestors"][i].name,
          attributes: _.find(state.data.entities, {
            ID: ent_tmp["ancestors"][i].code,
          })["attributes"],
        });
      }

      return {
        entity: {
          code: state.selected.entity,
          name: ent_tmp["Name"],
          definition: ent_tmp["Definition"],
          scopenotes: ent_tmp["Scope Notes"],
          examples: ent_tmp["Examples"],
          comments: ent_tmp["Comments"],
          descendants: descendants,
          levels: desc_levels,
          ancestors: ent_tmp["ancestors"],
          attributes: attributes,
          relations: ent_tmp["relations"],
        },
      };
    },
    getAttributes: (state) => {
      let out = state.data.attributes;
      for (let i in out) {
        out[i]["entities"] = [];
        for (let j in out[i]["Domain"]) {
          let ent_tmp = _.find(state.data.entities, {
            Name: out[i]["Domain"][j],
          });
          if (!ent_tmp) continue;
          out[i]["entities"].push({
            code: ent_tmp["ID"],
            name: ent_tmp["Name"],
          });
        }
      }

      let arr_keywords = state.filters.attributes.split(" ");
      return _.filter(out, (x) => {
        for (let i in arr_keywords) {
          if (JSON.stringify(x).toLowerCase().indexOf(arr_keywords[i].trim()) > -1) {
            return true;
          }
        }
        return false;
      });
    },
    getHierarchy: (state) => state.data.hierarchy,
    getRelations: (state) => {
      let t = _.map(
        _.filter(state.data.relations, (o) => {
          return o["Relation ID"].charAt(o["Relation ID"].length - 1) != "i";
        }),
        (o) => {
          o["DomainName"] = _.find(state.data.entities, {
            ID: o["DomainID"],
          })["Name"];
          o["RangeName"] = _.find(state.data.entities, {
            ID: o["RangeID"],
          })["Name"];
          return o;
        }
      );
      let tmp = _.groupBy(t, "Relation ID");
      let res = _.map(_.sortBy(_.keys(tmp)), (o) => {
        return { code: o, name: tmp[o][0].Name, v: tmp[o] };
      });
      let arr_keywords = state.filters.relations.split(" ");
      return _.filter(res, (x) => {
        for (let i in arr_keywords) {
          if (JSON.stringify(x).toLowerCase().indexOf(arr_keywords[i].trim()) > -1) {
            return true;
          }
        }
        return false;
      });
    },
    getRelattributes: (state) => state.data.relattributes,
    getRelattributeInfo: (state) => {
      let relattr_tmp = _.find(_.cloneDeep(state.data.relattributes), {
        ID: state.selected.relattribute,
      });
      return {
        relattribute: relattr_tmp,
      };
    },
    getLevels: (state) => state.data.levels,
    getRelationInfo: (state) => {
      let ent_tmp = _.find(state.data.relation_descr, {
        ID: state.selected.relation,
      });

      let rels = _.filter(state.data.relations, {
        "Relation ID": state.selected.relation,
      });

      ent_tmp["DomainEntities"] = _.uniqBy(
        _.flatten(
          _.map(rels, (o) => {
            return o["DomainEntities"];
          })
        ),
        "code"
      );
      ent_tmp["RangeEntities"] = _.uniqBy(
        _.flatten(
          _.map(rels, (o) => {
            return o["RangeEntities"];
          })
        ),
        "code"
      );

      return {
        relation: ent_tmp,
      };
    },
    getAttributeInfo: (state) => {
      let attr_tmp = _.find(_.cloneDeep(state.data.attributes), {
        ID: state.selected.attribute,
      });
      let ents = [];
      for (let i in attr_tmp["entities"]) {
        ents.push(attr_tmp["entities"][i]);
        if (_.hasIn(state.data.descendants, attr_tmp["entities"][i].code)) {
          let tmp_list = state.data.descendants[attr_tmp["entities"][i].code];
          for (let j in tmp_list) {
            ents.push({
              code: tmp_list[j],
              name: _.find(state.data.entities, {
                ID: tmp_list[j],
              })["Name"],
            });
          }
        }
      }
      attr_tmp["entities"] = ents;

      return {
        attribute: attr_tmp,
      };
    },
  },
  actions: {
    async setLocale(locale) {
      const normalizedLocale = DataService.setStoredLocale(locale);
      const newData = await DataService.getSession(normalizedLocale);
      this.locale = normalizedLocale;
      this.data = newData;
    },
    goBack() {
      router.go(-1);
    },
    selectEntity(entityCode) {
      this.selected.entity = entityCode;
      router.push("/entitycard");
    },
    selectRelation(relationCode) {
      this.selected.relation = relationCode;
      router.push("/relationcard");
    },
    selectAttribute(attributeCode) {
      this.selected.attribute = attributeCode;
      router.push("/attributecard");
    },
    selectRelattribute(relattributeCode) {
      this.selected.relattribute = relattributeCode;
      router.push("/relationattributecard");
    },
    searchTable(tp, value) {
      if (value == null) {
        value = "";
      }
      this.filters[tp] = value;
    },
  },
});

import { computed } from "vue";
import labels from "@/i18n/labels.json";
import { useMainStore } from "@/stores/store";

function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
}

export function useLabels() {
  const store = useMainStore();
  const currentLocale = computed(() => store.locale || "en");

  const t = (key, params = {}) => {
    const localeLabels = labels[currentLocale.value] || labels.en;
    let value = getPath(localeLabels, key);
    if (value == null) value = getPath(labels.en, key);
    if (typeof value !== "string") return key;
    return value.replace(/\{(\w+)\}/g, (_m, k) => (params[k] != null ? String(params[k]) : `{${k}}`));
  };

  return {
    t,
    locale: currentLocale,
    localeOptions: [
      { value: "en", label: "English" },
      { value: "es", label: "Español" }
    ]
  };
}

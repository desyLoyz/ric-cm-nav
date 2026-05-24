<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { Network } from 'lucide-vue-next'
import { useMainStore } from '@/stores/store'
import { useLabels } from '@/composables/useLabels'

const route = useRoute()
const router = useRouter()
const store = useMainStore()
const { t, localeOptions } = useLabels()

const cardRouteToListRoute = {
  '/entitycard': '/entities',
  '/attributecard': '/attributes',
  '/relationcard': '/relations',
  '/relationattributecard': '/relation-attributes',
}

const isCardRoute = computed(() => Object.prototype.hasOwnProperty.call(cardRouteToListRoute, route.path))

const cardRouteTitle = computed(() => {
  if (route.path === '/entitycard') return t('cards.entity')
  if (route.path === '/attributecard') return t('cards.attribute')
  if (route.path === '/relationcard') return t('cards.relation')
  if (route.path === '/relationattributecard') return t('cards.relationAttribute')
  return 'Card'
})

function closeCardPopup() {
  const fallbackRoute = cardRouteToListRoute[route.path] || '/entities'
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push(fallbackRoute)
  }
}

function isSectionActive(section) {
  const path = route.path
  if (section === 'entities') return path === '/entities' || path === '/entitycard'
  if (section === 'attributes') return path === '/attributes' || path === '/attributecard'
  if (section === 'relations') return path === '/relations' || path === '/relationcard'
  if (section === 'relation-attributes') {
    return path === '/relation-attributes' || path === '/relationattributecard'
  }
  if (section === 'modeling-playground') return path === '/modeling-playground' || path === '/nav-playground'
  return false
}

function onLocaleChange(event) {
  store.setLocale(event.target.value)
}
</script>

<template>
  <main role="main" class="container">
    <nav class="navbar fixed-top navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <a class="navbar-brand d-flex align-items-center gap-2">
          <span class="app-icon-wrap">
            <Network class="app-icon" :size="18" :stroke-width="2.1" />
          </span>
          <span>{{ t('appTitle') }}</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav"
          aria-controls="navbarNav" aria-expanded="false" :aria-label="t('common.close')">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav">
            <li class="nav-item">
              <RouterLink class="nav-link" :class="{ 'nav-link-active': isSectionActive('entities') }" to="/entities">
                {{ t('nav.entities') }}
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" :class="{ 'nav-link-active': isSectionActive('attributes') }"
                to="/attributes">
                {{ t('nav.attributes') }}
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" :class="{ 'nav-link-active': isSectionActive('relations') }"
                to="/relations">
                {{ t('nav.relations') }}
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" :class="{ 'nav-link-active': isSectionActive('relation-attributes') }"
                to="/relation-attributes">
                {{ t('nav.relationAttributes') }}
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink class="nav-link" :class="{ 'nav-link-active': isSectionActive('modeling-playground') }"
                to="/modeling-playground">
                {{ t('nav.modelingPlayground') }}
              </RouterLink>
            </li>
          </ul>
          <div class="ms-lg-auto mt-2 mt-lg-0 d-flex align-items-center gap-2">
            <label for="locale" class="small text-muted mb-0">{{ t('nav.language') }}</label>
            <select id="locale" class="form-select form-select-sm" :value="store.locale" @change="onLocaleChange">
              <option v-for="opt in localeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <button type="button" class="btn btn-outline-secondary btn-sm d-flex align-items-center"
              data-bs-toggle="modal" data-bs-target="#aboutAppModal">
              <i class="bi bi-info-circle"></i>
            </button>
          </div>
        </div>
      </div>
    </nav>

    <div class="modal fade" id="aboutAppModal" tabindex="-1" aria-labelledby="aboutAppModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="aboutAppModalLabel">{{ t('about.title') }}</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" :aria-label="t('common.close')"></button>
          </div>
          <div class="modal-body">
            <p class="mb-2">{{ t('about.description') }}</p>
            <p class="mb-0">
              {{ t('about.basedOn') }} <strong>RiC-CM 1.0</strong>
              (<a href="https://www.ica.org/ica-network/expert-groups/egad/records-in-contexts-conceptual-model/"
                target="_blank" rel="noopener noreferrer">
                Records in Contexts Conceptual Model
              </a>).
            </p>
            <p class="mb-0 mt-3 creator-line">
              {{ t('about.creator') }}:
              <a href="https://ilam.ionio.gr/en/staff/764-damigos/" target="_blank" rel="noopener noreferrer">
                Matthew Damigos
              </a>,
              <a href="http://dlib.ionio.gr/dlib/" target="_blank" rel="noopener noreferrer">
                Laboratory of Digital Libraries and Electronic Publishing
              </a>,
              <a href="https://ionio.gr/en/" target="_blank" rel="noopener noreferrer">
                Ionian University
              </a>.
            </p>
            <p class="mb-0 mt-2 creator-line">
              {{ t('about.license') }}:
              <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
                CC-BY-4.0
              </a>.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">{{ t('common.close') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div class="jumbotron">
      <RouterView v-slot="{ Component }">
        <div v-if="isCardRoute" class="card-popup-wrap" role="dialog" aria-modal="true">
          <div class="card-popup-header">
            <h5 class="mb-0">{{ cardRouteTitle }}</h5>
            <button type="button" class="btn-close" :aria-label="t('common.close')" @click="closeCardPopup"></button>
          </div>
          <div class="card-popup-body">
            <component :is="Component" />
          </div>
        </div>
        <component :is="Component" v-else />
      </RouterView>
    </div>
  </main>
</template>

<style scoped>
.app-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.app-icon-wrap {
  width: 1.4rem;
  height: 1.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.2rem;
  background: #eef3ff;
  color: #3457d5;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
}

.nav-link-active {
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.25rem;
}

.creator-line {
  color: rgba(33, 37, 41, 0.62);
  font-size: 0.92rem;
}

.card-popup-wrap {
  position: fixed;
  inset: 0;
  z-index: 2055;
  background: #ffffff;
  display: flex;
  flex-direction: column;
}

.card-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

.card-popup-body {
  flex: 1 1 auto;
  overflow: auto;
  padding: 1rem;
}
</style>

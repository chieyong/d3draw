import Garden from './Garden'
import BumpChart from './BumpChart'
import RidgeChart from './RidgeChart'

/**
 * Welke grafiektypes er zijn. De sleutel is wat `spec.template` noemt, en
 * ook de naam van de sectie waar de instellingen van dat type staan.
 *
 * Een nieuw type is een regel hier plus een component. Alles eromheen —
 * valideren, schalen, undo, opslaan, exporteren, de inspector — hoeft er
 * niets van te weten.
 */
export const TEMPLATES = {
  flower: Garden,
  bump: BumpChart,
  ridge: RidgeChart,
}

export const TEMPLATE_TYPES = Object.keys(TEMPLATES)

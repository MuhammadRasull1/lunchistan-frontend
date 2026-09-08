/**
 * Поиск/геокодирование через Photon (Photon.komoot.io) поверх OpenStreetMap.
 * Бесплатный публичный API, без ключей. Используем: поиск по релевантности рядом
 * с картой и reverse-геокодинг координат → текстовый адрес.
 */

export interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    name?: string
    street?: string
    housenumber?: string
    postcode?: string
    city?: string
    state?: string
    country?: string
    osm_value?: string
  }
}

const PHOTON = 'https://photon.komoot.io'

/** Человекочитаемая подпись адреса из свойств Photon. */
export function labelFromFeature(f: PhotonFeature): string {
  const p = f.properties
  const parts: string[] = []
  const street =
    p.street && p.housenumber
      ? `${p.street}, ${p.housenumber}`
      : p.street || p.housenumber
  if (p.name && p.name !== street) parts.push(p.name)
  if (street) parts.push(street)
  if (p.city) parts.push(p.city)
  if (p.country && p.country !== p.city) parts.push(p.country)
  return parts.join(', ')
}

interface SearchOptions {
  q: string
  lat?: number
  lon?: number
  limit?: number
}

/** Поиск адресов/мест. Координаты карты дают локальный приоритет. */
export async function searchPlaces({ q, lat, lon, limit = 6 }: SearchOptions): Promise<PhotonFeature[]> {
  if (!q.trim() || q.trim().length < 2) return []
  const params = new URLSearchParams({ q: q.trim(), limit: String(limit) })
  if (typeof lat === 'number' && typeof lon === 'number') {
    params.set('lat', String(lat))
    params.set('lon', String(lon))
  }
  try {
    const res = await fetch(`${PHOTON}/api/?${params.toString()}`)
    if (!res.ok) return []
    const data = (await res.json()) as { features?: PhotonFeature[] }
    return data.features ?? []
  } catch {
    return []
  }
}

/** Reverse-геокодинг: координаты → ближайший объект OSM → подпись адреса. */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lon}`)
    if (!res.ok) return null
    const data = (await res.json()) as { features?: PhotonFeature[] }
    const feature = data.features?.[0]
    return feature ? labelFromFeature(feature) : null
  } catch {
    return null
  }
}

/** Формат координат для ссылки на Яндекс.Карты: широта, долгота. */
export function mapsLink(lat: number, lon: number): string {
  return `https://yandex.com/maps/?pt=${lon},${lat}&z=15&l=map`
}
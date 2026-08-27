import { readJson, storageKeys, writeJson } from './storage';

const WCA_API = 'https://www.worldcubeassociation.org/api/v0';
export const OWNER_WCA_ID = '2017BALA04';

export interface WcaAvatar { url: string; thumb_url: string; is_default: boolean }
export interface WcaPerson { name: string; wca_id: string; gender: string; url: string; country_iso2: string; avatar: WcaAvatar | null }
export interface WcaRankedResult { best: number; world_rank: number; continent_rank: number; country_rank: number }
export interface WcaPersonalRecord { single?: WcaRankedResult; average?: WcaRankedResult }
export interface WcaPersonInfo { person: WcaPerson; competition_count: number; personal_records: Record<string, WcaPersonalRecord>; medals: { gold: number; silver: number; bronze: number; total: number } }
export interface WcaCompetition { id: string; name: string; short_display_name: string; start_date: string; end_date: string; date_range: string; registration_open: string | null; registration_close: string | null; cancelled_at: string | null; competitor_limit: number | null; venue: string; city: string; country_iso2: string; url: string; event_ids: string[] }
export interface WcaCountry { id: string; name: string; iso2: string; continent_id: string }

export const WCA_EVENT_NAMES: Record<string, string> = {
  '333': '3x3', '222': '2x2', '444': '4x4', '555': '5x5', '666': '6x6', '777': '7x7',
  '333bf': '3x3 Blindfolded', '333fm': 'Fewest Moves', '333oh': '3x3 One-Handed', clock: 'Clock',
  minx: 'Megaminx', pyram: 'Pyraminx', skewb: 'Skewb', sq1: 'Square-1', '444bf': '4x4 Blindfolded',
  '555bf': '5x5 Blindfolded', '333mbf': '3x3 Multi-Blind', '333ft': '3x3 With Feet', magic: 'Magic', mmagic: 'Master Magic',
};

const EVENT_ORDER = ['333', '222', '444', '555', '666', '777', '333bf', '333fm', '333oh', 'clock', 'minx', 'pyram', 'skewb', 'sq1', '444bf', '555bf', '333mbf'];
export const eventName = (id: string) => WCA_EVENT_NAMES[id] ?? id;
export const sortEventIds = (ids: string[]) => [...ids].sort((a, b) => (EVENT_ORDER.indexOf(a) < 0 ? 999 : EVENT_ORDER.indexOf(a)) - (EVENT_ORDER.indexOf(b) < 0 ? 999 : EVENT_ORDER.indexOf(b)));
export const countryFlag = (iso2: string) => /^[A-Za-z]{2}$/.test(iso2) ? String.fromCodePoint(...[...iso2.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)) : '';

function formatCentiseconds(value: number) {
  const minutes = Math.floor(value / 6000); const seconds = Math.floor((value % 6000) / 100); const hundredths = value % 100;
  return minutes === 0 ? `${seconds}.${String(hundredths).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
}

export function formatWcaResult(eventId: string, value: number, kind: 'single' | 'average') {
  if (value === -1) return 'DNF'; if (value === -2) return 'DNS'; if (value <= 0) return '—';
  if (eventId === '333fm') return kind === 'single' ? String(value) : (value / 100).toFixed(2);
  if (eventId === '333mbf') {
    const dd = Math.floor(value / 10000000); const seconds = Math.floor(value / 100) % 100000; const missed = value % 100;
    const solved = 99 - dd + missed; return `${solved}/${solved + missed} ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return formatCentiseconds(value);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${WCA_API}${path}`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`WCA API error ${response.status}`);
  return response.json() as Promise<T>;
}

export async function fetchOwnerProfile(): Promise<WcaPersonInfo> {
  const profile = await getJson<WcaPersonInfo>(`/persons/${OWNER_WCA_ID}`);
  await writeJson(storageKeys.wcaProfile, profile);
  return profile;
}

export async function cachedOwnerProfile() { return readJson<WcaPersonInfo | null>(storageKeys.wcaProfile, null); }

export async function fetchOwnerCompetitions(): Promise<WcaCompetition[]> {
  const list = await getJson<WcaCompetition[]>(`/persons/${OWNER_WCA_ID}/competitions`);
  list.sort((a, b) => a.start_date.localeCompare(b.start_date));
  await writeJson(storageKeys.wcaCompetitions, list);
  return list;
}

export async function cachedOwnerCompetitions() { return readJson<WcaCompetition[]>(storageKeys.wcaCompetitions, []); }

let countriesCache: WcaCountry[] | null = null;
export async function fetchWcaCountries() {
  countriesCache ??= (await getJson<WcaCountry[]>('/countries')).sort((a, b) => a.name.localeCompare(b.name));
  return countriesCache;
}

export async function fetchUpcomingCompetitions(countryIso2: string, page = 1) {
  const params = new URLSearchParams({ country_iso2: countryIso2, start: new Date().toISOString().slice(0, 10), sort: 'start_date', page: String(page), per_page: '25' });
  const competitions = await getJson<WcaCompetition[]>(`/competitions?${params}`);
  return { competitions, hasMore: competitions.length === 25 };
}

export type RegistrationStatus = 'not_yet_open' | 'open' | 'closed' | 'unknown';
export function registrationStatus(comp: WcaCompetition, now = new Date()): RegistrationStatus {
  if (!comp.registration_open || !comp.registration_close) return 'unknown';
  if (now < new Date(comp.registration_open)) return 'not_yet_open';
  return now <= new Date(comp.registration_close) ? 'open' : 'closed';
}

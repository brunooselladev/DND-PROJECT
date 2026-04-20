import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const API_ORIGIN = "https://www.dnd5eapi.co";
const API_BASE_URL = "https://www.dnd5eapi.co/api/2014";
const SOURCE = "SRD";
const FETCH_BATCH_SIZE = 20;
const UPSERT_BATCH_SIZE = 25;

type ApiListResponse<T> = { count: number; results: T[] };
type ApiReference = { index: string; name: string; url: string };

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

async function fetchJson<T>(pathOrUrl: string): Promise<T> {
  const url = pathOrUrl.startsWith("http") ? pathOrUrl
    : pathOrUrl.startsWith("/api/") ? `${API_ORIGIN}${pathOrUrl}`
    : `${API_BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Fetch failed ${url}: ${res.status}`);
  return (await res.json()) as T;
}

async function fetchBatch<T>(refs: ApiReference[], label: string): Promise<T[]> {
  const batches = chunk(refs, FETCH_BATCH_SIZE);
  const all: T[] = [];
  for (const [i, batch] of batches.entries()) {
    console.log(`[SRD] ${label} batch ${i + 1}/${batches.length}`);
    all.push(...await Promise.all(batch.map(r => fetchJson<T>(r.url))));
  }
  return all;
}

function toJson(v: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}

// ─── Spells ───
type SpellApi = { name: string; desc: string[]; higher_level?: string[]; range: string; components: string[]; material?: string; duration: string; concentration?: boolean; casting_time: string; level: number; school: ApiReference };

async function fetchSpells() {
  const idx = await fetchJson<ApiListResponse<ApiReference>>("/spells");
  const spells = await fetchBatch<SpellApi>(idx.results, "spells");
  return spells.map(s => ({
    name: s.name, level: s.level, school: s.school.name, castingTime: s.casting_time,
    range: s.range, components: s.material ? `${s.components.join(", ")} (${s.material})` : s.components.join(", "),
    duration: s.concentration && !s.duration.toLowerCase().startsWith("concentration") ? `Concentration, ${s.duration.charAt(0).toLowerCase()}${s.duration.slice(1)}` : s.duration,
    description: [...s.desc, ...(s.higher_level?.length ? [`At Higher Levels: ${s.higher_level.join(" ")}`] : [])].join("\n\n").trim(),
    source: SOURCE,
  }));
}

// ─── Monsters ───
type MonsterActionApi = { name: string; desc: string; attack_bonus?: number; damage?: unknown };
type MonsterApi = { name: string; size: string; type: string; subtype?: string; alignment: string; armor_class: number | Array<{ value: number }>; hit_points: number; speed: Record<string, string>; strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number; senses?: Record<string, unknown>; languages?: string; challenge_rating: number | string; special_abilities?: Array<{ name: string; desc: string }>; actions?: MonsterActionApi[]; legendary_actions?: MonsterActionApi[]; reactions?: MonsterActionApi[]; proficiencies?: unknown[]; damage_vulnerabilities?: string[]; damage_resistances?: string[]; damage_immunities?: string[]; condition_immunities?: ApiReference[] };

function extractAC(v: MonsterApi["armor_class"]): number {
  return typeof v === "number" ? v : (v as Array<{ value: number }>).find(e => typeof e.value === "number")?.value ?? 0;
}

function formatCR(v: number | string): string {
  if (typeof v === "string") return v;
  if (v === 0.125) return "1/8";
  if (v === 0.25) return "1/4";
  if (v === 0.5) return "1/2";
  return String(v);
}

function fmtType(m: MonsterApi) {
  const t = m.type.split(/[\s-]+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return m.subtype ? `${t} (${m.subtype})` : t;
}

function extractDmg(d: unknown): { dice: string | null; type: string | null } {
  if (!d || !Array.isArray(d) || !d.length) return { dice: null, type: null };
  const f = d[0] as Record<string, unknown>;
  return { dice: (f.damage_dice as string) ?? null, type: (f.damage_type as Record<string, string>)?.name ?? null };
}

async function fetchMonsters() {
  const idx = await fetchJson<ApiListResponse<ApiReference>>("/monsters");
  const monsters = await fetchBatch<MonsterApi>(idx.results, "monsters");
  return monsters.map(m => {
    const actions: Array<{ name: string; description: string; attackBonus: number | null; damageDice: string | null; damageType: string | null; actionType: string }> = [];
    for (const a of m.actions ?? []) { const d = extractDmg(a.damage); actions.push({ name: a.name, description: a.desc, attackBonus: a.attack_bonus ?? null, damageDice: d.dice, damageType: d.type, actionType: "action" }); }
    for (const a of m.reactions ?? []) { actions.push({ name: a.name, description: a.desc, attackBonus: a.attack_bonus ?? null, damageDice: null, damageType: null, actionType: "reaction" }); }
    for (const a of m.legendary_actions ?? []) { const d = extractDmg(a.damage); actions.push({ name: a.name, description: a.desc, attackBonus: a.attack_bonus ?? null, damageDice: d.dice, damageType: d.type, actionType: "legendary" }); }
    return {
      monster: {
        name: m.name, size: m.size, challengeRating: formatCR(m.challenge_rating), type: fmtType(m),
        alignment: m.alignment, armorClass: extractAC(m.armor_class), hitPoints: m.hit_points,
        speed: toJson(m.speed), strength: m.strength, dexterity: m.dexterity, constitution: m.constitution,
        intelligence: m.intelligence, wisdom: m.wisdom, charisma: m.charisma, senses: toJson(m.senses ?? {}),
        languages: m.languages ?? "",
        stats: toJson({ abilities: { str: m.strength, dex: m.dexterity, con: m.constitution, int: m.intelligence, wis: m.wisdom, cha: m.charisma }, senses: m.senses ?? {}, languages: m.languages ?? "", specialAbilities: m.special_abilities ?? [] }),
        actions: toJson({ actions: m.actions ?? [], reactions: m.reactions ?? [], legendaryActions: m.legendary_actions ?? [] }),
        source: SOURCE,
      },
      actions,
    };
  });
}

// ─── Rules ───
type RuleApi = { index: string; name: string; desc: string; subsections?: ApiReference[] };

async function fetchRules() {
  const idx = await fetchJson<ApiListResponse<ApiReference>>("/rules");
  const [details, secIdx] = await Promise.all([fetchBatch<RuleApi>(idx.results, "rule cats"), fetchJson<ApiListResponse<ApiReference>>("/rule-sections")]);
  const catMap = new Map<string, string>();
  for (const r of details) for (const s of r.subsections ?? []) catMap.set(s.index, r.name);
  const secs = await fetchBatch<RuleApi>(secIdx.results, "rule sections");
  return secs.map(s => ({ title: s.name, category: catMap.get(s.index) ?? "Rules", content: s.desc.replace(/^#+\s+/gm, "").trim(), source: SOURCE }));
}

// ─── Equipment ───
type EquipApi = { index: string; name: string; equipment_category: ApiReference; weapon_category?: string; armor_category?: string; gear_category?: ApiReference; tool_category?: string; vehicle_category?: string; cost?: { quantity: number; unit: string }; weight?: number; damage?: { damage_dice: string; damage_type: ApiReference }; two_handed_damage?: { damage_dice: string; damage_type: ApiReference }; armor_class?: { base: number }; properties?: ApiReference[]; desc?: string[]; special?: string[] };
type MagicApi = { index: string; name: string; desc: string[]; rarity: { name: string }; equipment_category?: ApiReference; variant?: boolean };

async function fetchEquipment() {
  const idx = await fetchJson<ApiListResponse<ApiReference>>("/equipment");
  const equips = await fetchBatch<EquipApi>(idx.results, "equipment");
  const items = equips.map(e => {
    const dmg = e.damage ?? e.two_handed_damage;
    const desc = [...(e.desc ?? []), ...(e.special ?? [])].join("\n\n").trim();
    const type = e.weapon_category ? "Weapon" : e.armor_category ? "Armor" : e.gear_category?.name ?? e.tool_category ? "Tool" : e.vehicle_category ? "Vehicle" : e.equipment_category.name;
    const cat = e.weapon_category ?? e.armor_category ?? e.tool_category ?? e.vehicle_category ?? e.equipment_category.name;
    return {
      name: e.name, type, category: cat, weight: e.weight ?? null, cost: e.cost ? `${e.cost.quantity} ${e.cost.unit}` : null,
      damage: dmg?.damage_dice ?? null, damageType: dmg?.damage_type?.name ?? null, armorClass: e.armor_class?.base ?? null,
      properties: e.properties?.length ? toJson(e.properties.map(p => p.name)) : Prisma.JsonNull,
      description: desc, source: SOURCE, rarity: null as string | null,
    };
  });
  try {
    const mi = await fetchJson<ApiListResponse<ApiReference>>("/magic-items");
    const magics = await fetchBatch<MagicApi>(mi.results, "magic items");
    for (const m of magics) {
      if (m.variant) continue;
      items.push({ name: m.name, type: "Magic Item", category: m.equipment_category?.name ?? "Wondrous Item", rarity: m.rarity?.name ?? null, description: m.desc?.join("\n\n").trim() ?? "", source: SOURCE, weight: null, cost: null, damage: null, damageType: null, armorClass: null, properties: Prisma.JsonNull });
    }
  } catch { /* magic items optional */ }
  return items;
}

// ─── Features ───
type FeatureApi = { index: string; name: string; level: number; class: ApiReference; subclass?: ApiReference; desc: string[] };

async function fetchFeatures() {
  const idx = await fetchJson<ApiListResponse<ApiReference>>("/features");
  const feats = await fetchBatch<FeatureApi>(idx.results, "features");
  return feats.map(f => ({ name: f.name, type: f.subclass ? "Subclass" : "Class", className: f.class?.name ?? null, level: f.level, description: f.desc?.join("\n\n").trim() ?? "", source: SOURCE }));
}

// ─── Upserts ───
async function upsertSpells(data: Awaited<ReturnType<typeof fetchSpells>>) {
  for (const b of chunk(data, UPSERT_BATCH_SIZE)) await Promise.all(b.map(s => prisma.spell.upsert({ where: { name_source: { name: s.name, source: s.source } }, update: { ...s }, create: { ...s } })));
  return data.length;
}

async function upsertMonsters(data: Awaited<ReturnType<typeof fetchMonsters>>) {
  let totalActions = 0;
  for (const b of chunk(data, UPSERT_BATCH_SIZE)) {
    await Promise.all(b.map(async r => {
      const m = await prisma.monster.upsert({ where: { name_source: { name: r.monster.name, source: r.monster.source as string } }, update: { ...r.monster }, create: { ...r.monster } });
      for (const a of r.actions) {
        await prisma.monsterAction.upsert({ where: { monsterId_name_actionType: { monsterId: m.id, name: a.name, actionType: a.actionType } }, update: { description: a.description, attackBonus: a.attackBonus, damageDice: a.damageDice, damageType: a.damageType }, create: { monsterId: m.id, ...a, source: SOURCE } });
        totalActions++;
      }
    }));
  }
  return { monsters: data.length, actions: totalActions };
}

async function upsertRules(data: Awaited<ReturnType<typeof fetchRules>>) {
  for (const b of chunk(data, UPSERT_BATCH_SIZE)) await Promise.all(b.map(r => prisma.rule.upsert({ where: { title_source: { title: r.title, source: r.source } }, update: { ...r }, create: { ...r } })));
  return data.length;
}

async function upsertItems(data: Awaited<ReturnType<typeof fetchEquipment>>) {
  for (const b of chunk(data, UPSERT_BATCH_SIZE)) await Promise.all(b.map(i => prisma.item.upsert({ where: { name_source: { name: i.name, source: i.source } }, update: { ...i }, create: { ...i } })));
  return data.length;
}

async function upsertFeatures(data: Awaited<ReturnType<typeof fetchFeatures>>) {
  for (const b of chunk(data, UPSERT_BATCH_SIZE)) await Promise.all(b.map(f => prisma.feature.upsert({ where: { name_type_source: { name: f.name, type: f.type, source: f.source } }, update: { ...f }, create: { ...f } })));
  return data.length;
}

// ─── Main ───
export async function importSrdData() {
  console.log("[SRD] Fetching from dnd5eapi...");
  const [spells, monsterRecs, rules, items, features] = await Promise.all([fetchSpells(), fetchMonsters(), fetchRules(), fetchEquipment(), fetchFeatures()]);
  console.log("[SRD] Writing to PostgreSQL...");
  const [sc, mr, rc, ic, fc] = await Promise.all([upsertSpells(spells), upsertMonsters(monsterRecs), upsertRules(rules), upsertItems(items), upsertFeatures(features)]);
  const counts = { spells: sc, monsters: mr.monsters, monsterActions: mr.actions, rules: rc, items: ic, features: fc };
  console.log(`[SRD] Done: ${sc} spells, ${mr.monsters} monsters (${mr.actions} actions), ${rc} rules, ${ic} items, ${fc} features`);
  return counts;
}

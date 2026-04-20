import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const API_ORIGIN = "https://www.dnd5eapi.co";
const API_BASE_URL = "https://www.dnd5eapi.co/api/2014";
const SOURCE = "SRD";
const FETCH_BATCH_SIZE = 20;
const UPSERT_BATCH_SIZE = 25;

type ApiListResponse<T> = {
  count: number;
  results: T[];
};

type ApiReference = {
  index: string;
  name: string;
  url: string;
};

type SpellApiDetail = {
  name: string;
  desc: string[];
  higher_level?: string[];
  range: string;
  components: string[];
  material?: string;
  duration: string;
  concentration?: boolean;
  casting_time: string;
  level: number;
  school: ApiReference;
};

type ArmorClassApi =
  | number
  | Array<{
      type?: string;
      value: number;
      armor?: ApiReference[];
    }>;

type MonsterActionApi = {
  name: string;
  desc: string;
  attack_bonus?: number;
  damage?: unknown;
  actions?: unknown;
  usage?: unknown;
  options?: unknown;
};

type MonsterApiDetail = {
  name: string;
  size: string;
  type: string;
  subtype?: string;
  alignment: string;
  armor_class: ArmorClassApi;
  hit_points: number;
  speed: Record<string, string>;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiencies?: Array<{
    value: number;
    proficiency: ApiReference;
  }>;
  damage_vulnerabilities?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: ApiReference[];
  senses?: Record<string, string | number>;
  languages?: string;
  challenge_rating: number | string;
  special_abilities?: Array<{
    name: string;
    desc: string;
  }>;
  actions?: MonsterActionApi[];
  legendary_actions?: MonsterActionApi[];
  reactions?: MonsterActionApi[];
};

type RuleApiDetail = {
  index: string;
  name: string;
  desc: string;
  subsections?: ApiReference[];
};

type EquipmentCostApi = {
  quantity: number;
  unit: string;
};

type EquipmentDamageApi = {
  damage_dice: string;
  damage_type: ApiReference;
};

type EquipmentArmorClassApi = {
  base: number;
  dex_bonus: boolean;
  max_bonus?: number;
};

type EquipmentApiDetail = {
  index: string;
  name: string;
  equipment_category: ApiReference;
  weapon_category?: string;
  weapon_range?: string;
  armor_category?: string;
  gear_category?: ApiReference;
  tool_category?: string;
  vehicle_category?: string;
  cost?: EquipmentCostApi;
  weight?: number;
  damage?: EquipmentDamageApi;
  two_handed_damage?: EquipmentDamageApi;
  armor_class?: EquipmentArmorClassApi;
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  properties?: ApiReference[];
  desc?: string[];
  special?: string[];
  contents?: unknown[];
  quantity?: number;
};

type MagicItemApiDetail = {
  index: string;
  name: string;
  desc: string[];
  rarity: { name: string };
  equipment_category: ApiReference;
  variant?: boolean;
  variants?: ApiReference[];
};

type FeatureApiDetail = {
  index: string;
  name: string;
  level: number;
  class: ApiReference;
  subclass?: ApiReference;
  desc: string[];
  prerequisites?: unknown[];
};

type ImportCounts = {
  spells: number;
  monsters: number;
  monsterActions: number;
  rules: number;
  items: number;
  features: number;
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function fetchJson<T>(pathOrUrl: string): Promise<T> {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : pathOrUrl.startsWith("/api/")
      ? `${API_ORIGIN}${pathOrUrl}`
      : `${API_BASE_URL}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

async function fetchDetailsInBatches<T>(references: ApiReference[], label: string): Promise<T[]> {
  const batches = chunk(references, FETCH_BATCH_SIZE);
  const details: T[] = [];

  for (const [index, batch] of batches.entries()) {
    console.log(`Fetching ${label} batch ${index + 1}/${batches.length}...`);
    const batchResults = await Promise.all(batch.map((reference) => fetchJson<T>(reference.url)));
    details.push(...batchResults);
  }

  return details;
}

function toJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function lowercaseFirst(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatSpellComponents(components: string[], material?: string): string {
  const formatted = components.join(", ");
  return material ? `${formatted} (${material})` : formatted;
}

function formatSpellDuration(spell: SpellApiDetail): string {
  if (!spell.concentration) {
    return spell.duration;
  }

  if (spell.duration.toLowerCase().startsWith("concentration")) {
    return spell.duration;
  }

  return `Concentration, ${lowercaseFirst(spell.duration)}`;
}

function formatSpellDescription(spell: SpellApiDetail): string {
  const sections = [...spell.desc];

  if (spell.higher_level?.length) {
    sections.push(`At Higher Levels: ${spell.higher_level.join(" ")}`);
  }

  return sections.join("\n\n").trim();
}

function formatChallengeRating(value: number | string): string {
  if (typeof value === "string") {
    return value;
  }

  if (value === 0.125) {
    return "1/8";
  }

  if (value === 0.25) {
    return "1/4";
  }

  if (value === 0.5) {
    return "1/2";
  }

  return Number.isInteger(value) ? String(value) : String(value);
}

function extractArmorClass(value: ArmorClassApi): number {
  if (typeof value === "number") {
    return value;
  }

  return value.find((entry) => typeof entry.value === "number")?.value ?? 0;
}

function formatMonsterType(monster: MonsterApiDetail): string {
  const baseType = toTitleCase(monster.type);
  return monster.subtype ? `${baseType} (${monster.subtype})` : baseType;
}

function buildMonsterStats(monster: MonsterApiDetail): Prisma.InputJsonValue {
  return toJson({
    size: monster.size,
    alignment: monster.alignment,
    speed: monster.speed,
    abilities: {
      str: monster.strength,
      dex: monster.dexterity,
      con: monster.constitution,
      int: monster.intelligence,
      wis: monster.wisdom,
      cha: monster.charisma,
    },
    senses: monster.senses ?? {},
    languages: monster.languages ?? "",
    proficiencies: monster.proficiencies ?? [],
    damageVulnerabilities: monster.damage_vulnerabilities ?? [],
    damageResistances: monster.damage_resistances ?? [],
    damageImmunities: monster.damage_immunities ?? [],
    conditionImmunities: monster.condition_immunities ?? [],
    specialAbilities: monster.special_abilities ?? [],
  });
}

function buildMonsterActions(monster: MonsterApiDetail): Prisma.InputJsonValue {
  return toJson({
    actions: monster.actions ?? [],
    reactions: monster.reactions ?? [],
    legendaryActions: monster.legendary_actions ?? [],
  });
}

function normalizeRuleContent(content: string): string {
  return content.replace(/^#+\s+/gm, "").trim();
}

function formatCost(cost?: EquipmentCostApi): string | null {
  if (!cost) return null;
  return `${cost.quantity} ${cost.unit}`;
}

function resolveEquipmentType(equip: EquipmentApiDetail): string {
  if (equip.weapon_category) return "Weapon";
  if (equip.armor_category) return "Armor";
  if (equip.gear_category) return equip.gear_category.name;
  if (equip.tool_category) return "Tool";
  if (equip.vehicle_category) return "Vehicle";
  return equip.equipment_category.name;
}

function resolveEquipmentCategory(equip: EquipmentApiDetail): string {
  if (equip.weapon_category) return equip.weapon_category;
  if (equip.armor_category) return equip.armor_category;
  if (equip.tool_category) return equip.tool_category;
  if (equip.vehicle_category) return equip.vehicle_category;
  return equip.equipment_category.name;
}

// ── Fetch records ──

async function fetchSpellRecords(): Promise<Prisma.SpellCreateInput[]> {
  const spellIndex = await fetchJson<ApiListResponse<ApiReference>>("/spells");
  const spells = await fetchDetailsInBatches<SpellApiDetail>(spellIndex.results, "spell details");

  return spells.map((spell) => ({
    name: spell.name,
    level: spell.level,
    school: spell.school.name,
    castingTime: spell.casting_time,
    range: spell.range,
    components: formatSpellComponents(spell.components, spell.material),
    duration: formatSpellDuration(spell),
    description: formatSpellDescription(spell),
    source: SOURCE,
  }));
}

type MonsterRecord = {
  monster: Prisma.MonsterCreateInput;
  actions: Array<{
    name: string;
    description: string;
    attackBonus: number | null;
    damageDice: string | null;
    damageType: string | null;
    actionType: string;
  }>;
};

function extractDamageDice(damage: unknown): { dice: string | null; type: string | null } {
  if (!damage) return { dice: null, type: null };
  if (Array.isArray(damage) && damage.length > 0) {
    const first = damage[0] as Record<string, unknown>;
    return {
      dice: (first.damage_dice as string) ?? null,
      type: (first.damage_type as Record<string, string>)?.name ?? null,
    };
  }
  return { dice: null, type: null };
}

async function fetchMonsterRecords(): Promise<MonsterRecord[]> {
  const monsterIndex = await fetchJson<ApiListResponse<ApiReference>>("/monsters");
  const monsters = await fetchDetailsInBatches<MonsterApiDetail>(monsterIndex.results, "monster details");

  return monsters.map((monster) => {
    const allActions: MonsterRecord["actions"] = [];

    for (const action of monster.actions ?? []) {
      const { dice, type } = extractDamageDice(action.damage);
      allActions.push({
        name: action.name,
        description: action.desc,
        attackBonus: action.attack_bonus ?? null,
        damageDice: dice,
        damageType: type,
        actionType: "action",
      });
    }

    for (const action of monster.reactions ?? []) {
      allActions.push({
        name: action.name,
        description: action.desc,
        attackBonus: action.attack_bonus ?? null,
        damageDice: null,
        damageType: null,
        actionType: "reaction",
      });
    }

    for (const action of monster.legendary_actions ?? []) {
      const { dice, type } = extractDamageDice(action.damage);
      allActions.push({
        name: action.name,
        description: action.desc,
        attackBonus: action.attack_bonus ?? null,
        damageDice: dice,
        damageType: type,
        actionType: "legendary",
      });
    }

    return {
      monster: {
        name: monster.name,
        size: monster.size,
        challengeRating: formatChallengeRating(monster.challenge_rating),
        type: formatMonsterType(monster),
        alignment: monster.alignment,
        armorClass: extractArmorClass(monster.armor_class),
        hitPoints: monster.hit_points,
        speed: toJson(monster.speed),
        strength: monster.strength,
        dexterity: monster.dexterity,
        constitution: monster.constitution,
        intelligence: monster.intelligence,
        wisdom: monster.wisdom,
        charisma: monster.charisma,
        senses: toJson(monster.senses ?? {}),
        languages: monster.languages ?? "",
        stats: buildMonsterStats(monster),
        actions: buildMonsterActions(monster),
        source: SOURCE,
      },
      actions: allActions,
    };
  });
}

async function fetchRuleRecords(): Promise<Prisma.RuleCreateInput[]> {
  const ruleIndex = await fetchJson<ApiListResponse<ApiReference>>("/rules");
  const [ruleDetails, ruleSectionIndex] = await Promise.all([
    fetchDetailsInBatches<RuleApiDetail>(ruleIndex.results, "rule categories"),
    fetchJson<ApiListResponse<ApiReference>>("/rule-sections"),
  ]);

  const sectionCategoryMap = new Map<string, string>();

  for (const rule of ruleDetails) {
    for (const subsection of rule.subsections ?? []) {
      sectionCategoryMap.set(subsection.index, rule.name);
    }
  }

  const ruleSections = await fetchDetailsInBatches<RuleApiDetail>(ruleSectionIndex.results, "rule sections");

  return ruleSections.map((ruleSection) => ({
    title: ruleSection.name,
    category: sectionCategoryMap.get(ruleSection.index) ?? "Rules",
    content: normalizeRuleContent(ruleSection.desc),
    source: SOURCE,
  }));
}

async function fetchEquipmentRecords(): Promise<Prisma.ItemCreateInput[]> {
  const equipIndex = await fetchJson<ApiListResponse<ApiReference>>("/equipment");
  const equipment = await fetchDetailsInBatches<EquipmentApiDetail>(equipIndex.results, "equipment details");

  const items: Prisma.ItemCreateInput[] = equipment.map((equip) => {
    const dmg = equip.damage ?? equip.two_handed_damage;
    const desc: string[] = [];
    if (equip.desc?.length) desc.push(...equip.desc);
    if (equip.special?.length) desc.push(...equip.special);

    return {
      name: equip.name,
      type: resolveEquipmentType(equip),
      category: resolveEquipmentCategory(equip),
      weight: equip.weight ?? null,
      cost: formatCost(equip.cost),
      damage: dmg ? (dmg as EquipmentDamageApi).damage_dice : null,
      damageType: dmg ? (dmg as EquipmentDamageApi).damage_type?.name ?? null : null,
      armorClass: equip.armor_class?.base ?? null,
      properties: equip.properties?.length
        ? toJson(equip.properties.map((p) => p.name))
        : Prisma.JsonNull,
      description: desc.join("\n\n").trim(),
      source: SOURCE,
    };
  });

  // Also fetch magic items
  try {
    const magicIndex = await fetchJson<ApiListResponse<ApiReference>>("/magic-items");
    const magicItems = await fetchDetailsInBatches<MagicItemApiDetail>(magicIndex.results, "magic item details");

    for (const mi of magicItems) {
      if (mi.variant) continue; // skip variant containers
      items.push({
        name: mi.name,
        type: "Magic Item",
        category: mi.equipment_category?.name ?? "Wondrous Item",
        rarity: mi.rarity?.name ?? null,
        description: mi.desc?.join("\n\n").trim() ?? "",
        source: SOURCE,
      });
    }
  } catch (error) {
    console.warn("Could not fetch magic items:", error);
  }

  return items;
}

async function fetchFeatureRecords(): Promise<Prisma.FeatureCreateInput[]> {
  const featureIndex = await fetchJson<ApiListResponse<ApiReference>>("/features");
  const features = await fetchDetailsInBatches<FeatureApiDetail>(featureIndex.results, "feature details");

  return features.map((f) => ({
    name: f.name,
    type: f.subclass ? "Subclass" : "Class",
    className: f.class?.name ?? null,
    level: f.level,
    description: f.desc?.join("\n\n").trim() ?? "",
    source: SOURCE,
  }));
}

// ── Upsert records ──

async function upsertSpells(spells: Prisma.SpellCreateInput[]): Promise<number> {
  for (const batch of chunk(spells, UPSERT_BATCH_SIZE)) {
    await Promise.all(
      batch.map((spell) => {
        const source = spell.source ?? SOURCE;

        return prisma.spell.upsert({
          where: {
            name_source: {
              name: spell.name,
              source,
            },
          },
          update: {
            level: spell.level,
            school: spell.school,
            castingTime: spell.castingTime,
            range: spell.range,
            components: spell.components,
            duration: spell.duration,
            description: spell.description,
            source,
          },
          create: {
            ...spell,
            source,
          },
        });
      }),
    );
  }

  return spells.length;
}

async function upsertMonsters(records: MonsterRecord[]): Promise<{ monsters: number; actions: number }> {
  let totalActions = 0;

  for (const batch of chunk(records, UPSERT_BATCH_SIZE)) {
    await Promise.all(
      batch.map(async (record) => {
        const source = record.monster.source ?? SOURCE;

        const monster = await prisma.monster.upsert({
          where: {
            name_source: {
              name: record.monster.name,
              source,
            },
          },
          update: {
            size: record.monster.size,
            challengeRating: record.monster.challengeRating,
            type: record.monster.type,
            alignment: record.monster.alignment,
            armorClass: record.monster.armorClass,
            hitPoints: record.monster.hitPoints,
            speed: record.monster.speed,
            strength: record.monster.strength,
            dexterity: record.monster.dexterity,
            constitution: record.monster.constitution,
            intelligence: record.monster.intelligence,
            wisdom: record.monster.wisdom,
            charisma: record.monster.charisma,
            senses: record.monster.senses,
            languages: record.monster.languages,
            stats: record.monster.stats,
            actions: record.monster.actions,
            source,
          },
          create: {
            ...record.monster,
            source,
          },
        });

        // Upsert individual actions
        for (const action of record.actions) {
          await prisma.monsterAction.upsert({
            where: {
              monsterId_name_actionType: {
                monsterId: monster.id,
                name: action.name,
                actionType: action.actionType,
              },
            },
            update: {
              description: action.description,
              attackBonus: action.attackBonus,
              damageDice: action.damageDice,
              damageType: action.damageType,
            },
            create: {
              monsterId: monster.id,
              name: action.name,
              description: action.description,
              attackBonus: action.attackBonus,
              damageDice: action.damageDice,
              damageType: action.damageType,
              actionType: action.actionType,
              source: SOURCE,
            },
          });
          totalActions += 1;
        }
      }),
    );
  }

  return { monsters: records.length, actions: totalActions };
}

async function upsertRules(rules: Prisma.RuleCreateInput[]): Promise<number> {
  for (const batch of chunk(rules, UPSERT_BATCH_SIZE)) {
    await Promise.all(
      batch.map((rule) => {
        const source = rule.source ?? SOURCE;

        return prisma.rule.upsert({
          where: {
            title_source: {
              title: rule.title,
              source,
            },
          },
          update: {
            category: rule.category,
            content: rule.content,
            source,
          },
          create: {
            ...rule,
            source,
          },
        });
      }),
    );
  }

  return rules.length;
}

async function upsertItems(items: Prisma.ItemCreateInput[]): Promise<number> {
  for (const batch of chunk(items, UPSERT_BATCH_SIZE)) {
    await Promise.all(
      batch.map((item) => {
        const source = item.source ?? SOURCE;

        return prisma.item.upsert({
          where: {
            name_source: {
              name: item.name,
              source,
            },
          },
          update: {
            type: item.type,
            category: item.category,
            rarity: item.rarity,
            weight: item.weight,
            cost: item.cost,
            damage: item.damage,
            damageType: item.damageType,
            armorClass: item.armorClass,
            properties: item.properties,
            description: item.description,
            source,
          },
          create: {
            ...item,
            source,
          },
        });
      }),
    );
  }

  return items.length;
}

async function upsertFeatures(features: Prisma.FeatureCreateInput[]): Promise<number> {
  for (const batch of chunk(features, UPSERT_BATCH_SIZE)) {
    await Promise.all(
      batch.map((feature) => {
        const source = feature.source ?? SOURCE;

        return prisma.feature.upsert({
          where: {
            name_type_source: {
              name: feature.name,
              type: feature.type,
              source,
            },
          },
          update: {
            className: feature.className,
            level: feature.level,
            description: feature.description,
            source,
          },
          create: {
            ...feature,
            source,
          },
        });
      }),
    );
  }

  return features.length;
}

// ── Main ──

export async function importSrdData(): Promise<ImportCounts> {
  console.log("Fetching SRD data from dnd5eapi...");

  const [spells, monsterRecords, rules, items, features] = await Promise.all([
    fetchSpellRecords(),
    fetchMonsterRecords(),
    fetchRuleRecords(),
    fetchEquipmentRecords(),
    fetchFeatureRecords(),
  ]);

  console.log("Writing SRD data to PostgreSQL...");

  const [spellCount, monsterResult, ruleCount, itemCount, featureCount] = await Promise.all([
    upsertSpells(spells),
    upsertMonsters(monsterRecords),
    upsertRules(rules),
    upsertItems(items),
    upsertFeatures(features),
  ]);

  const counts: ImportCounts = {
    spells: spellCount,
    monsters: monsterResult.monsters,
    monsterActions: monsterResult.actions,
    rules: ruleCount,
    items: itemCount,
    features: featureCount,
  };

  console.log(
    `Imported ${counts.spells} spells, ${counts.monsters} monsters (${counts.monsterActions} actions), ` +
    `${counts.rules} rules, ${counts.items} items, and ${counts.features} features.`
  );

  return counts;
}

async function main() {
  try {
    await importSrdData();
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

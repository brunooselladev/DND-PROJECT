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

type ImportCounts = {
  spells: number;
  monsters: number;
  rules: number;
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

async function fetchMonsterRecords(): Promise<Prisma.MonsterCreateInput[]> {
  const monsterIndex = await fetchJson<ApiListResponse<ApiReference>>("/monsters");
  const monsters = await fetchDetailsInBatches<MonsterApiDetail>(monsterIndex.results, "monster details");

  return monsters.map((monster) => ({
    name: monster.name,
    challengeRating: formatChallengeRating(monster.challenge_rating),
    type: formatMonsterType(monster),
    armorClass: extractArmorClass(monster.armor_class),
    hitPoints: monster.hit_points,
    stats: buildMonsterStats(monster),
    actions: buildMonsterActions(monster),
    source: SOURCE,
  }));
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

async function upsertMonsters(monsters: Prisma.MonsterCreateInput[]): Promise<number> {
  for (const batch of chunk(monsters, UPSERT_BATCH_SIZE)) {
    await Promise.all(
      batch.map((monster) => {
        const source = monster.source ?? SOURCE;

        return prisma.monster.upsert({
          where: {
            name_source: {
              name: monster.name,
              source,
            },
          },
          update: {
            challengeRating: monster.challengeRating,
            type: monster.type,
            armorClass: monster.armorClass,
            hitPoints: monster.hitPoints,
            stats: monster.stats,
            actions: monster.actions,
            source,
          },
          create: {
            ...monster,
            source,
          },
        });
      }),
    );
  }

  return monsters.length;
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

export async function importSrdData(): Promise<ImportCounts> {
  console.log("Fetching SRD data from dnd5eapi...");

  const [spells, monsters, rules] = await Promise.all([
    fetchSpellRecords(),
    fetchMonsterRecords(),
    fetchRuleRecords(),
  ]);

  console.log("Writing SRD data to PostgreSQL...");

  const [spellCount, monsterCount, ruleCount] = await Promise.all([
    upsertSpells(spells),
    upsertMonsters(monsters),
    upsertRules(rules),
  ]);

  const counts = {
    spells: spellCount,
    monsters: monsterCount,
    rules: ruleCount,
  };

  console.log(`Imported ${counts.spells} spells, ${counts.monsters} monsters, and ${counts.rules} rules.`);

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

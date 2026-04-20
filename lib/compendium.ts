import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const MAX_TAKE = 100;
const DEFAULT_TAKE = 50;

export type SpellListItem = Prisma.SpellGetPayload<{
  select: {
    id: true;
    name: true;
    level: true;
    school: true;
    castingTime: true;
    range: true;
    duration: true;
    description: true;
    source: true;
  };
}>;

export type MonsterListItem = Prisma.MonsterGetPayload<{
  select: {
    id: true;
    name: true;
    size: true;
    challengeRating: true;
    type: true;
    alignment: true;
    armorClass: true;
    hitPoints: true;
    source: true;
  };
}>;

export type RuleListItem = Prisma.RuleGetPayload<{
  select: {
    id: true;
    title: true;
    category: true;
    content: true;
    source: true;
  };
}>;

export type ItemListItem = Prisma.ItemGetPayload<{
  select: {
    id: true;
    name: true;
    type: true;
    category: true;
    rarity: true;
    cost: true;
    weight: true;
    damage: true;
    damageType: true;
    armorClass: true;
    description: true;
    source: true;
  };
}>;

export type FeatureListItem = Prisma.FeatureGetPayload<{
  select: {
    id: true;
    name: true;
    type: true;
    className: true;
    level: true;
    description: true;
    source: true;
  };
}>;

function getTake(value?: number): number {
  if (!value || Number.isNaN(value)) {
    return DEFAULT_TAKE;
  }
  return Math.min(Math.max(1, value), MAX_TAKE);
}

function parseChallengeRating(value: string): number {
  if (value.includes("/")) {
    const [numerator, denominator] = value.split("/").map(Number);
    return denominator ? numerator / denominator : 0;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function listSpells(options: {
  query?: string;
  level?: number;
  school?: string;
  take?: number;
}): Promise<SpellListItem[]> {
  const filters: Prisma.SpellWhereInput[] = [];

  if (typeof options.level === "number" && !Number.isNaN(options.level)) {
    filters.push({ level: options.level });
  }

  if (options.school) {
    filters.push({ school: { contains: options.school, mode: "insensitive" } });
  }

  if (options.query) {
    filters.push({
      OR: [
        { name: { contains: options.query, mode: "insensitive" } },
        { description: { contains: options.query, mode: "insensitive" } },
        { school: { contains: options.query, mode: "insensitive" } },
      ],
    });
  }

  const rows = await prisma.spell.findMany({
    select: {
      id: true,
      name: true,
      level: true,
      school: true,
      castingTime: true,
      range: true,
      duration: true,
      description: true,
      source: true,
    },
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: [{ level: "asc" }, { name: "asc" }],
    take: getTake(options.take),
  });

  return rows;
}

export async function listMonsters(options: {
  query?: string;
  challengeRating?: string;
  type?: string;
  take?: number;
}): Promise<MonsterListItem[]> {
  const filters: Prisma.MonsterWhereInput[] = [];

  if (options.challengeRating) {
    filters.push({ challengeRating: options.challengeRating });
  }

  if (options.type) {
    filters.push({ type: { contains: options.type, mode: "insensitive" } });
  }

  if (options.query) {
    filters.push({
      OR: [
        { name: { contains: options.query, mode: "insensitive" } },
        { type: { contains: options.query, mode: "insensitive" } },
      ],
    });
  }

  const rows = await prisma.monster.findMany({
    select: {
      id: true,
      name: true,
      size: true,
      challengeRating: true,
      type: true,
      alignment: true,
      armorClass: true,
      hitPoints: true,
      source: true,
    },
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: [{ name: "asc" }],
  });

  return rows
    .sort(
      (left, right) =>
        parseChallengeRating(left.challengeRating) - parseChallengeRating(right.challengeRating) ||
        left.name.localeCompare(right.name),
    )
    .slice(0, getTake(options.take));
}

export async function listRules(options: {
  query?: string;
  category?: string;
  take?: number;
}): Promise<RuleListItem[]> {
  const filters: Prisma.RuleWhereInput[] = [];

  if (options.category) {
    filters.push({ category: { contains: options.category, mode: "insensitive" } });
  }

  if (options.query) {
    filters.push({
      OR: [
        { title: { contains: options.query, mode: "insensitive" } },
        { content: { contains: options.query, mode: "insensitive" } },
        { category: { contains: options.query, mode: "insensitive" } },
      ],
    });
  }

  const rows = await prisma.rule.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      content: true,
      source: true,
    },
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: [{ category: "asc" }, { title: "asc" }],
    take: getTake(options.take),
  });

  return rows;
}

export async function listItems(options: {
  query?: string;
  type?: string;
  rarity?: string;
  take?: number;
}): Promise<ItemListItem[]> {
  const filters: Prisma.ItemWhereInput[] = [];

  if (options.type) {
    filters.push({ type: { contains: options.type, mode: "insensitive" } });
  }

  if (options.rarity) {
    filters.push({ rarity: { contains: options.rarity, mode: "insensitive" } });
  }

  if (options.query) {
    filters.push({
      OR: [
        { name: { contains: options.query, mode: "insensitive" } },
        { description: { contains: options.query, mode: "insensitive" } },
        { type: { contains: options.query, mode: "insensitive" } },
        { category: { contains: options.query, mode: "insensitive" } },
      ],
    });
  }

  return prisma.item.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      category: true,
      rarity: true,
      cost: true,
      weight: true,
      damage: true,
      damageType: true,
      armorClass: true,
      description: true,
      source: true,
    },
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: [{ type: "asc" }, { name: "asc" }],
    take: getTake(options.take),
  });
}

export async function listFeatures(options: {
  query?: string;
  type?: string;
  className?: string;
  take?: number;
}): Promise<FeatureListItem[]> {
  const filters: Prisma.FeatureWhereInput[] = [];

  if (options.type) {
    filters.push({ type: { contains: options.type, mode: "insensitive" } });
  }

  if (options.className) {
    filters.push({ className: { contains: options.className, mode: "insensitive" } });
  }

  if (options.query) {
    filters.push({
      OR: [
        { name: { contains: options.query, mode: "insensitive" } },
        { description: { contains: options.query, mode: "insensitive" } },
        { className: { contains: options.query, mode: "insensitive" } },
      ],
    });
  }

  return prisma.feature.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      className: true,
      level: true,
      description: true,
      source: true,
    },
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: [{ className: "asc" }, { level: "asc" }, { name: "asc" }],
    take: getTake(options.take),
  });
}

export async function findSpellById(id: string) {
  return prisma.spell.findUnique({
    where: { id },
  });
}

export async function findMonsterById(id: string) {
  return prisma.monster.findUnique({
    where: { id },
    include: {
      monsterActions: {
        orderBy: [{ actionType: "asc" }, { name: "asc" }],
      },
    },
  });
}

export async function findRuleById(id: string) {
  return prisma.rule.findUnique({
    where: { id },
  });
}

export async function findItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
  });
}

export async function findFeatureById(id: string) {
  return prisma.feature.findUnique({
    where: { id },
  });
}

export async function getCompendiumCounts() {
  const [spells, monsters, rules, items, features] = await Promise.all([
    prisma.spell.count(),
    prisma.monster.count(),
    prisma.rule.count(),
    prisma.item.count(),
    prisma.feature.count(),
  ]);

  return { spells, monsters, rules, items, features };
}

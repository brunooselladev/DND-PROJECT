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
    challengeRating: true;
    type: true;
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

function getTake(value?: number): number {
  if (!value || Number.isNaN(value)) {
    return DEFAULT_TAKE;
  }
  return Math.min(Math.max(1, value), MAX_TAKE);
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
  take?: number;
}): Promise<MonsterListItem[]> {
  const filters: Prisma.MonsterWhereInput[] = [];

  if (options.challengeRating) {
    filters.push({ challengeRating: options.challengeRating });
  }

  if (options.query) {
    filters.push({
      OR: [
        { name: { contains: options.query, mode: "insensitive" } },
        { challengeRating: { contains: options.query, mode: "insensitive" } },
      ],
    });
  }

  const rows = await prisma.monster.findMany({
    select: {
      id: true,
      name: true,
      challengeRating: true,
      type: true,
      armorClass: true,
      hitPoints: true,
      source: true,
    },
    where: filters.length > 0 ? { AND: filters } : undefined,
    orderBy: [{ challengeRating: "asc" }, { name: "asc" }],
    take: getTake(options.take),
  });

  return rows;
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

export async function findSpellById(id: string) {
  return prisma.spell.findUnique({
    where: { id },
  });
}

export async function findMonsterById(id: string) {
  return prisma.monster.findUnique({
    where: { id },
  });
}

export async function findRuleById(id: string) {
  return prisma.rule.findUnique({
    where: { id },
  });
}

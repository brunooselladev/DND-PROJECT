import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.spell.deleteMany();
  await prisma.monster.deleteMany();
  await prisma.rule.deleteMany();

  await prisma.spell.createMany({
    data: [
      {
        name: "Magic Missile",
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "120 feet",
        components: "V, S",
        duration: "Instantaneous",
        description:
          "You create three glowing darts of magical force that automatically hit targets you can see.",
        source: "SRD",
      },
      {
        name: "Fireball",
        level: 3,
        school: "Evocation",
        castingTime: "1 action",
        range: "150 feet",
        components: "V, S, M (a tiny ball of bat guano and sulfur)",
        duration: "Instantaneous",
        description:
          "A bright streak flashes to a point within range and explodes in a 20-foot radius sphere.",
        source: "SRD",
      },
      {
        name: "Shield",
        level: 1,
        school: "Abjuration",
        castingTime: "1 reaction",
        range: "Self",
        components: "V, S",
        duration: "1 round",
        description:
          "An invisible barrier of magical force appears and protects you until the start of your next turn.",
        source: "SRD",
      },
      {
        name: "Mage Armor",
        level: 1,
        school: "Abjuration",
        castingTime: "1 action",
        range: "Touch",
        components: "V, S, M (a piece of cured leather)",
        duration: "8 hours",
        description:
          "You touch a willing creature who is not wearing armor, and a protective magical force surrounds it.",
        source: "SRD",
      },
      {
        name: "Cure Wounds",
        level: 1,
        school: "Evocation",
        castingTime: "1 action",
        range: "Touch",
        components: "V, S",
        duration: "Instantaneous",
        description: "A creature you touch regains hit points.",
        source: "SRD",
      },
      {
        name: "Misty Step",
        level: 2,
        school: "Conjuration",
        castingTime: "1 bonus action",
        range: "Self",
        components: "V",
        duration: "Instantaneous",
        description: "Briefly surrounded by silvery mist, you teleport up to 30 feet to an unoccupied space.",
        source: "SRD",
      },
    ],
  });

  await prisma.monster.createMany({
    data: [
      {
        name: "Goblin",
        challengeRating: "1/4",
        type: "Humanoid",
        armorClass: 15,
        hitPoints: 7,
        stats: {
          speed: "30 ft.",
          abilities: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
        },
        actions: [
          { name: "Scimitar", desc: "Melee Weapon Attack: +4 to hit, 1d6 + 2 slashing damage." },
          { name: "Shortbow", desc: "Ranged Weapon Attack: +4 to hit, 1d6 + 2 piercing damage." },
        ],
        source: "SRD",
      },
      {
        name: "Ogre",
        challengeRating: "2",
        type: "Giant",
        armorClass: 11,
        hitPoints: 59,
        stats: {
          speed: "40 ft.",
          abilities: { str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7 },
        },
        actions: [{ name: "Greatclub", desc: "Melee Weapon Attack: +6 to hit, 2d8 + 4 bludgeoning damage." }],
        source: "SRD",
      },
      {
        name: "Skeleton",
        challengeRating: "1/4",
        type: "Undead",
        armorClass: 13,
        hitPoints: 13,
        stats: {
          speed: "30 ft.",
          abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
        },
        actions: [
          { name: "Shortsword", desc: "Melee Weapon Attack: +4 to hit, 1d6 + 2 piercing damage." },
          { name: "Shortbow", desc: "Ranged Weapon Attack: +4 to hit, 1d6 + 2 piercing damage." },
        ],
        source: "SRD",
      },
      {
        name: "Wolf",
        challengeRating: "1/4",
        type: "Beast",
        armorClass: 13,
        hitPoints: 11,
        stats: {
          speed: "40 ft.",
          abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
        },
        actions: [{ name: "Bite", desc: "Melee Weapon Attack: +4 to hit, 2d4 + 2 piercing damage." }],
        source: "SRD",
      },
      {
        name: "Young Red Dragon",
        challengeRating: "10",
        type: "Dragon",
        armorClass: 18,
        hitPoints: 178,
        stats: {
          speed: "40 ft., climb 40 ft., fly 80 ft.",
          abilities: { str: 23, dex: 10, con: 21, int: 14, wis: 11, cha: 19 },
        },
        actions: [
          { name: "Bite", desc: "Melee Weapon Attack: +10 to hit, 2d10 + 6 piercing + 2d6 fire." },
          { name: "Fire Breath", desc: "30-foot cone, Dex save, 16d6 fire damage." },
        ],
        source: "SRD",
      },
    ],
  });

  await prisma.rule.createMany({
    data: [
      {
        title: "Advantage and Disadvantage",
        category: "combat",
        content:
          "When you have advantage or disadvantage, roll a second d20. Use the higher roll for advantage and lower for disadvantage.",
        source: "SRD",
      },
      {
        title: "Concentration",
        category: "magic",
        content:
          "You can concentrate on only one spell at a time. Taking damage can force a Constitution saving throw to maintain concentration.",
        source: "SRD",
      },
      {
        title: "Opportunity Attacks",
        category: "combat",
        content:
          "You can make an opportunity attack when a hostile creature that you can see moves out of your reach.",
        source: "SRD",
      },
      {
        title: "Long Rest",
        category: "resting",
        content:
          "A long rest is a period of extended downtime, at least 8 hours long, during which a character sleeps or performs light activity.",
        source: "SRD",
      },
      {
        title: "Difficult Terrain",
        category: "movement",
        content:
          "Every foot of movement in difficult terrain costs 1 extra foot. This rule is cumulative with other penalties.",
        source: "SRD",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

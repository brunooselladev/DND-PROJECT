-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PLAYER', 'DM', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spell" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "school" TEXT NOT NULL,
    "castingTime" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "components" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SRD',

    CONSTRAINT "Spell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "challengeRating" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "armorClass" INTEGER NOT NULL,
    "hitPoints" INTEGER NOT NULL,
    "stats" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SRD',

    CONSTRAINT "Monster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "race" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "strength" INTEGER NOT NULL,
    "dexterity" INTEGER NOT NULL,
    "constitution" INTEGER NOT NULL,
    "intelligence" INTEGER NOT NULL,
    "wisdom" INTEGER NOT NULL,
    "charisma" INTEGER NOT NULL,
    "maxHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "temporaryHp" INTEGER NOT NULL,
    "armorClass" INTEGER NOT NULL,
    "deathSaveSuccesses" INTEGER NOT NULL DEFAULT 0,
    "deathSaveFailures" INTEGER NOT NULL DEFAULT 0,
    "hitDiceTotal" INTEGER NOT NULL,
    "hitDiceSpent" INTEGER NOT NULL DEFAULT 0,
    "lastLongRestAt" TIMESTAMP(3),
    "conditions" JSONB NOT NULL,
    "inventory" JSONB NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreparedSpell" (
    "characterId" TEXT NOT NULL,
    "spellId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreparedSpell_pkey" PRIMARY KEY ("characterId","spellId")
);

-- CreateTable
CREATE TABLE "SpellSlot" (
    "characterId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "max" INTEGER NOT NULL,
    "used" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpellSlot_pkey" PRIMARY KEY ("characterId","level")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SRD',

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Spell_name_idx" ON "Spell"("name");

-- CreateIndex
CREATE INDEX "Spell_level_idx" ON "Spell"("level");

-- CreateIndex
CREATE INDEX "Spell_school_idx" ON "Spell"("school");

-- CreateIndex
CREATE UNIQUE INDEX "Spell_name_source_key" ON "Spell"("name", "source");

-- CreateIndex
CREATE INDEX "Monster_name_idx" ON "Monster"("name");

-- CreateIndex
CREATE INDEX "Monster_challengeRating_idx" ON "Monster"("challengeRating");

-- CreateIndex
CREATE INDEX "Monster_type_idx" ON "Monster"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Monster_name_source_key" ON "Monster"("name", "source");

-- CreateIndex
CREATE INDEX "Character_userId_idx" ON "Character"("userId");

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "Character"("name");

-- CreateIndex
CREATE INDEX "PreparedSpell_spellId_idx" ON "PreparedSpell"("spellId");

-- CreateIndex
CREATE INDEX "SpellSlot_characterId_idx" ON "SpellSlot"("characterId");

-- CreateIndex
CREATE INDEX "SpellSlot_level_idx" ON "SpellSlot"("level");

-- CreateIndex
CREATE INDEX "Rule_title_idx" ON "Rule"("title");

-- CreateIndex
CREATE INDEX "Rule_category_idx" ON "Rule"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_title_source_key" ON "Rule"("title", "source");

-- AddForeignKey
ALTER TABLE "Character" ADD CONSTRAINT "Character_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparedSpell" ADD CONSTRAINT "PreparedSpell_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreparedSpell" ADD CONSTRAINT "PreparedSpell_spellId_fkey" FOREIGN KEY ("spellId") REFERENCES "Spell"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpellSlot" ADD CONSTRAINT "SpellSlot_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

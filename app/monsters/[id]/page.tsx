import Link from "next/link";
import { notFound } from "next/navigation";

import { findMonsterById } from "@/lib/compendium";

type PageProps = { params: Promise<{ id: string }> };

type Abilities = { str?: number; dex?: number; con?: number; int?: number; wis?: number; cha?: number };

function abilityMod(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default async function MonsterDetailPage({ params }: PageProps) {
  const { id } = await params;
  const monster = await findMonsterById(id);

  if (!monster) notFound();

  const stats = (monster.stats ?? {}) as Record<string, unknown>;
  const abilities = (stats.abilities ?? {}) as Abilities;
  const abilityList: [string, number][] = [
    ["STR", abilities.str ?? monster.strength],
    ["DEX", abilities.dex ?? monster.dexterity],
    ["CON", abilities.con ?? monster.constitution],
    ["INT", abilities.int ?? monster.intelligence],
    ["WIS", abilities.wis ?? monster.wisdom],
    ["CHA", abilities.cha ?? monster.charisma],
  ];

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <Link href="/monsters" className="text-sm text-[color:var(--accent-glow)] hover:underline">← Back to monsters</Link>

      <article className="card-static overflow-hidden">
        <div className="stat-block p-6">
          <header className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-[color:var(--foreground)]">{monster.name}</h1>
              <p className="mt-1 text-sm italic text-[color:var(--muted-foreground)]">
                {monster.size} {monster.type}{monster.alignment ? `, ${monster.alignment}` : ""}
              </p>
            </div>
            <span className="badge badge-accent">CR {monster.challengeRating}</span>
          </header>

          <div className="mt-4 grid gap-1 text-sm">
            <p><span className="font-semibold text-[color:var(--accent-glow)]">Armor Class</span> {monster.armorClass}</p>
            <p><span className="font-semibold text-[color:var(--accent-glow)]">Hit Points</span> {monster.hitPoints}</p>
            {monster.languages ? <p><span className="font-semibold text-[color:var(--accent-glow)]">Languages</span> {monster.languages}</p> : null}
          </div>

          <div className="mt-4 grid grid-cols-6 gap-2 text-center text-sm">
            {abilityList.map(([label, score]) => (
              <div key={label} className="rounded-lg bg-[color:var(--surface-soft)] p-2 border border-[color:var(--border)]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--accent-glow)]">{label}</p>
                <p className="text-lg font-bold">{score}</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">{abilityMod(score)}</p>
              </div>
            ))}
          </div>
        </div>

        {monster.monsterActions.length > 0 ? (
          <div className="p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[color:var(--accent-glow)]">Actions</h2>
            {monster.monsterActions.filter(a => a.actionType === "action").map((action) => (
              <div key={action.id}>
                <p className="text-sm">
                  <span className="font-semibold italic">{action.name}.</span>{" "}
                  {action.attackBonus != null ? <span className="text-[color:var(--muted-foreground)]">+{action.attackBonus} to hit. </span> : null}
                  {action.damageDice ? <span className="text-[color:var(--muted-foreground)]">{action.damageDice} {action.damageType ?? ""} damage. </span> : null}
                </p>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)] leading-6">{action.description}</p>
              </div>
            ))}

            {monster.monsterActions.some(a => a.actionType === "reaction") ? (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wide text-[color:var(--accent-glow)] pt-2">Reactions</h2>
                {monster.monsterActions.filter(a => a.actionType === "reaction").map((action) => (
                  <div key={action.id}>
                    <p className="text-sm"><span className="font-semibold italic">{action.name}.</span></p>
                    <p className="mt-1 text-sm text-[color:var(--muted-foreground)] leading-6">{action.description}</p>
                  </div>
                ))}
              </>
            ) : null}

            {monster.monsterActions.some(a => a.actionType === "legendary") ? (
              <>
                <h2 className="text-sm font-bold uppercase tracking-wide text-[color:var(--gold)] pt-2">Legendary Actions</h2>
                {monster.monsterActions.filter(a => a.actionType === "legendary").map((action) => (
                  <div key={action.id}>
                    <p className="text-sm"><span className="font-semibold italic">{action.name}.</span></p>
                    <p className="mt-1 text-sm text-[color:var(--muted-foreground)] leading-6">{action.description}</p>
                  </div>
                ))}
              </>
            ) : null}
          </div>
        ) : null}
      </article>
    </section>
  );
}

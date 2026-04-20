"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, isAdminRole } from "@/lib/auth";
import { importSrdData } from "../../prisma/srd-import-action";

async function requireAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login?callbackUrl=/admin");
  if (!isAdminRole(currentUser.role)) redirect("/");
  return currentUser;
}

export type SrdImportState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function runSrdImportAction(): Promise<SrdImportState> {
  await requireAdmin();

  try {
    const counts = await importSrdData();
    revalidatePath("/admin");
    revalidatePath("/spells");
    revalidatePath("/monsters");
    revalidatePath("/items");
    revalidatePath("/features");
    revalidatePath("/rules");

    return {
      status: "success",
      message: `Imported ${counts.spells} spells, ${counts.monsters} monsters (${counts.monsterActions} actions), ${counts.rules} rules, ${counts.items} items, ${counts.features} features.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "SRD import failed.",
    };
  }
}

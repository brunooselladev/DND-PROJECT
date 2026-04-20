import { importSrdData } from "./srd-import";

async function main() {
  await importSrdData();
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

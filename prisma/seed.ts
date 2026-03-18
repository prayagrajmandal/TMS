import { ensureBootstrapData } from "../lib/db-auth";

async function main() {
  console.log("Seeding database with default bootstrap data...");
  await ensureBootstrapData(true);
  console.log("Seeding complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

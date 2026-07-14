import { db } from "../lib/db";

async function main() {
  const profiles = await db.profile.findMany({
    include: {
      user: true
    }
  });
  console.log(JSON.stringify(profiles, null, 2));
}

main().catch(console.error);

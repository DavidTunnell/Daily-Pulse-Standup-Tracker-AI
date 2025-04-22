import { db } from "../server/db";
import { weekendStories } from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  try {
    // Create the table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS weekend_stories (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        description TEXT NOT NULL,
        images JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    console.log("Weekend stories table created successfully");
  } catch (error) {
    console.error("Error creating weekend stories table:", error);
  }
  
  process.exit(0);
}

main();
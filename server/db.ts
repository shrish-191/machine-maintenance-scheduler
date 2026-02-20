import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";

// Create local SQLite database file
const sqlite = new Database("database.db");

// Export Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

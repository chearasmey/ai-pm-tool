import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

let dbInstance: Database | null = null;

export const getDB = async (): Promise<Database> => {
  if (dbInstance) {
    return dbInstance; // Return existing instance
  }

  dbInstance = await open({
    filename: "./database.db",
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid UUID DEFAULT (lower(hex(randomblob(16)))),
      email TEXT NOT NULL,
      name TEXT,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (
        role IN ('system_admin', 'project_admin', 'normal')
      ),
      mfaEnabled INTEGER DEFAULT 0,
      mfaSecret TEXT,
      tokenVersion INTEGER DEFAULT 0,
      refreshToken TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log("📦 SQLite DB Initialized");

  return dbInstance;
};
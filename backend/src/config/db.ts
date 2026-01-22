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

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      projectKey TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      description TEXT,
      leadUserId INTEGER,
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await dbInstance.exec(`
  CREATE TABLE IF NOT EXISTS project_member (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      projectId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      role TEXT DEFAULT 'MEMBER' CHECK (
        role IN ('member', 'admin')
      ),

      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(projectId, userId),

      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_project_member_user
      ON project_member(userId);

    CREATE INDEX IF NOT EXISTS idx_project_member_project
      ON project_member(projectId);
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS sprints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      name TEXT NOT NULL,
      goal TEXT,
      startDate TEXT,
      endDate TEXT,
      status TEXT CHECK(status IN ('PLANNED','ACTIVE','COMPLETED')) DEFAULT 'PLANNED',
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sprint_project ON sprints(projectId);
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS board_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT CHECK(category IN ('TODO','IN_PROGRESS','DONE')) DEFAULT 'TODO',
      position INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(projectId, name)
    );

    CREATE INDEX IF NOT EXISTS idx_board_status_project ON board_status(projectId);
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      sprintId INTEGER,
      parentId INTEGER,
      type TEXT CHECK(type IN ('EPIC','STORY','TASK','BUG','SUBTASK')) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      startDate TEXT,
      dueDate TEXT,
      originalEstimate INTEGER,
      remainingEstimate INTEGER,
      timeSpent INTEGER,
      priority TEXT CHECK(priority IN ('LOW','MEDIUM','HIGH','URGENT')) DEFAULT 'MEDIUM',
      statusId INTEGER NOT NULL,
      assigneeId INTEGER,
      createdBy INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(statusId) REFERENCES board_status(id)
      FOREIGN KEY(parentId) REFERENCES issues(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_issue_project ON issues(projectId);
    CREATE INDEX IF NOT EXISTS idx_issue_parent ON issues(parentId);
    CREATE INDEX IF NOT EXISTS idx_issue_status ON issues(statusId);
    CREATE INDEX IF NOT EXISTS idx_issue_sprint ON issues(sprintId);

  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS project_favorite (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(projectId, userId)
    );

    CREATE INDEX IF NOT EXISTS idx_project_favorite_user ON project_favorite(userId);
    CREATE INDEX IF NOT EXISTS idx_project_favorite_project ON project_favorite(projectId);
  `);

  console.log("📦 SQLite DB Initialized");

  return dbInstance;
};
import { getDB } from "../../config/db";
import { User } from "../../modules/users/user.model";
import { CreateUserRequestDTO, UpdateUserRequestDTO } from "./user.request.dto";

export class UserRepository {
    /* ================================
       FIND
    ================================= */

    static async findById(id: number): Promise<User | null> {
        const db = await getDB();
        const user = await db.get<User>(
            `SELECT * FROM users WHERE id = ?`,
            [id]
        );
        return user ?? null;
    }

    static async findByUuid(uuid: string): Promise<User | null> {
        const db = await getDB();
        const user = await db.get<User>(
            `SELECT * FROM users WHERE uuid = ?`,
            [uuid]
        );
        return user ?? null;
    }

    static async findByEmail(email: string): Promise<User | null> {
        const db = await getDB();
        const user = await db.get<User>(
            `SELECT * FROM users WHERE email = ?`,
            [email]
        );
        return user ?? null;
    }

    static async findAll(): Promise<User[]> {
        const db = await getDB();
        return db.all<User[]>(`SELECT * FROM users ORDER BY createdAt DESC`);
    }

    static async list(search: string | undefined, page: number, limit: number) {
        const db = await getDB();
        const offset = (page - 1) * limit;

        const where = search ? `WHERE email LIKE :q OR name LIKE :q` : "";
        const params = search ? { ":q": `%${search}%` } : {};

        const totalRow = await db.get(
            `SELECT COUNT(*) as total FROM users ${where}`,
            params as any
        );

        const rows = await db.all(
            `
      SELECT id, email, name, role, mfaEnabled, createdAt
      FROM users
      ${where}
      ORDER BY id DESC
      LIMIT :limit OFFSET :offset
      `,
            {
                ...params,
                ":limit": limit,
                ":offset": offset
            } as any
        );

        return { rows, total: Number(totalRow?.total ?? 0) };
    }

    /* ================================
       CREATE
    ================================= */

    static async create(input: CreateUserRequestDTO): Promise<User> {
        const db = await getDB();
        const result = await db.run(
            `
      INSERT INTO users (email, name, passwordHash, role)
      VALUES (?, ?, ?, ?)
      `,
            [
                input.email,
                input.name ?? null,
                input.password,
                input.role
            ]
        );


        return {
            id: result.lastID!,
            email: input.email,
            name: input.name,
            role: input.role,
            mfaEnabled: false,
            createdAt: new Date().toISOString()
        };
    }

    /* ================================
       UPDATE
    ================================= */

    static async update(uuid: string, input: UpdateUserRequestDTO): Promise<User> {
        const db = await getDB();

        const fields: string[] = [];
        const values: any[] = [];

        if (input.name !== undefined) {
            fields.push("name = ?");
            values.push(input.name);
        }

        if (input.role !== undefined) {
            fields.push("role = ?");
            values.push(input.role);
        }

        if (input.mfaEnabled !== undefined) {
            fields.push("mfaEnabled = ?");
            values.push(input.mfaEnabled ? 1 : 0);
        }

        values.push(uuid);

        await db.run(
            `
            UPDATE users
            SET ${fields.join(", ")}
            WHERE uuid = ?
            `,
            values
        );

        return this.findByUuid(uuid) as Promise<User>;
    }

    /* ================================
       SECURITY
    ================================= */

    static async updatePassword(id: number, passwordHash: string): Promise<void> {
        const db = await getDB();
        await db.run(
            `UPDATE users SET passwordHash = ? WHERE id = ?`,
            [passwordHash, id]
        );
    }

    static async revokeTokenVersion(id: number): Promise<void> {
        await this.saveRefreshToken(id, null);
        const db = await getDB();
        await db.run(
            `UPDATE users SET tokenVersion = tokenVersion + 1 WHERE id = ?`,
            [id]
        );
    }

    static async resetTokenVersion(id: number): Promise<void> {
        const db = await getDB();
        await db.run(
            `UPDATE users SET tokenVersion = 0 WHERE id = ?`,
            [id]
        );
    }

    static async clearRefreshToken(refreshToken: string) {
        const db = await getDB();
        return db.run(
            "UPDATE users SET refreshToken = NULL WHERE refreshToken = ?",
            refreshToken
        );
    }


    static async saveRefreshToken(id: number, token: string | null): Promise<void> {
        const db = await getDB();
        await db.run(
            `UPDATE users SET refreshToken = ? WHERE id = ?`,
            [token, id]
        );
    }

    static async generateMFA(id: number, secret: string): Promise<void> {
        const db = await getDB();
        await db.run(
            `
      UPDATE users
      SET mfaSecret = ?
      WHERE id = ?
      `,
            [secret, id]
        );
    }

    static async enableMFA(id: number): Promise<void> {
        const db = await getDB();
        await db.run(
            `
      UPDATE users
      SET mfaEnabled = 1
      WHERE id = ?
      `,
            [id]
        );
    }

    static async disableMFA(id: number): Promise<void> {
        const db = await getDB();
        await db.run(
            `
      UPDATE users
      SET mfaEnabled = 0, mfaSecret = NULL
      WHERE id = ?
      `,
            [id]
        );
    }

    /* ================================
       DELETE / DISABLE
    ================================= */

    static async remove(id: number): Promise<void> {
        const db = await getDB();
        await db.run(`DELETE FROM users WHERE id = ?`, [id]);
    }

    static async createSystemUser(payload: { email: string; name?: string; role: string; passwordHash: string }) {
        const db = await getDB();
        const result = await db.run(
            `
      INSERT INTO users (email, name, role, passwordHash)
      VALUES (?, ?, ?, ?)
      `,
            [
                payload.email,
                payload.name,
                payload.role,
                payload.passwordHash
            ]
        );

        return this.findById(result.lastID as number);
    }

    static async updateSystemUser(id: number, payload: Partial<{ email: string; name: string | null; role: string }>) {
        const db = await getDB();

        await db.run(
            `
      UPDATE users
      SET email = ?, name = ?, role = ?
      WHERE id = ?
      `,
            [
                payload.email,
                payload.name,
                payload.role,
                id
            ]
        );

        return this.findById(id);
    }

    static async setPassword(id: number, passwordHash: string, opts?: { disableMfa?: boolean }) {
        const db = await getDB();

        // Reset password -> invalidate refresh token
        // Optional: disable MFA (recommended when admin resets)
        const disableMfa = opts?.disableMfa ?? true;

        await db.run(
            `
            UPDATE users
            SET passwordHash = ?,
                refreshToken = NULL,
                mfaEnabled = ?,
                mfaSecret = ?
            WHERE id = ?
            `,
            [
                passwordHash,
                disableMfa ? 0 : undefined,
                disableMfa ? null : undefined,
                id
            ]
        );

        // sqlite named params: remove undefined keys to avoid SQLITE_RANGE
        // easiest: do 2 queries depending on disableMfa
        if (disableMfa) {
            await db.run(
                `
        UPDATE users
        SET passwordHash = ?,
            refreshToken = NULL,
            mfaEnabled = 0,
            mfaSecret = NULL
        WHERE id = ?
        `,
                passwordHash,
                id
            );
        } else {
            await db.run(
                `
        UPDATE users
        SET passwordHash = ?,
            refreshToken = NULL
        WHERE id = ?
        `,
                passwordHash,
                id
            );
        }

        return this.findById(id);
    }

    static async deleteUserAndCleanup(userId: number) {
        const db = await getDB();

        await db.exec("BEGIN");
        try {
            // 0) Invalidate session/security data first (safe even if delete fails later)
            await db.run(
                `
        UPDATE users
        SET refreshToken = NULL,
            mfaEnabled = 0,
            mfaSecret = NULL
        WHERE id = ?
        `,
                userId
            );

            // 1) Remove from project memberships
            await db.run(`DELETE FROM project_member WHERE userId = ?`, userId);

            // 2) Remove from favorites/starred if you have it (ignore if table not exist)
            // If you DO have table "project_favorite(userId, projectId)", keep this.
            try {
                await db.run(`DELETE FROM project_favorite WHERE userId = ?`, userId);
            } catch (_) {
                // ignore if table doesn't exist
            }

            // 3) Unassign issues (assignee)
            // If your issues table uses different column name, update it.
            try {
                await db.run(`UPDATE issues SET assigneeId = NULL WHERE assigneeId = ?`, userId);
            } catch (_) { }

            // Optional: if issues has reporterId/createdBy, you can also null them
            // ⚠️ Only do this if those columns are nullable in your schema.
            try {
                await db.run(`UPDATE issues SET createdBy = NULL WHERE createdBy = ?`, userId);
            } catch (_) { }

            // 4) Remove as project lead
            try {
                await db.run(`UPDATE projects SET leadUserId = NULL WHERE leadUserId = ?`, userId);
            } catch (_) { }

            // Optional: if projects.createdBy exists and is nullable, you can null it.
            // Otherwise keep it or reassign to SYSTEM_ADMIN.
            try {
                await db.run(`UPDATE projects SET createdBy = NULL WHERE createdBy = ?`, userId);
            } catch (_) { }

            // 5) Finally delete user
            const result = await db.run(`DELETE FROM users WHERE id = ?`, userId);

            await db.exec("COMMIT");
            return { changes: result.changes ?? 0 };
        } catch (err) {
            await db.exec("ROLLBACK");
            throw err;
        }

    }
};

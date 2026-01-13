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

    /* ================================
       CREATE
    ================================= */

    static async create(input: CreateUserRequestDTO): Promise<User> {
        const db = await getDB();
        console.log(input);

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
};

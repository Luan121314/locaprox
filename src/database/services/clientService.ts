import { Client, ClientInput } from '../../types/domain';
import { execute, queryAll } from '../connection';

const mapClientRow = (row: {
  id: number;
  name: string;
  phone: string | null;
  document: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}): Client => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  document: row.document,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const clientService = {
  async list(): Promise<Client[]> {
    const rows = await queryAll<{
      id: number;
      name: string;
      phone: string | null;
      document: string | null;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM clients ORDER BY name COLLATE NOCASE ASC;');

    return rows.map(mapClientRow);
  },

  async create(input: ClientInput): Promise<number> {
    const now = new Date().toISOString();
    const result = await execute(
      `
      INSERT INTO clients (name, phone, document, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?);
      `,
      [
        input.name.trim(),
        input.phone?.trim() || null,
        input.document?.trim() || null,
        input.notes?.trim() || null,
        now,
        now,
      ],
    );

    if (!result.insertId) {
      throw new Error('Nao foi possivel criar o cliente.');
    }

    return result.insertId;
  },

  async update(id: number, input: ClientInput): Promise<void> {
    const now = new Date().toISOString();

    await execute(
      `
      UPDATE clients
      SET name = ?, phone = ?, document = ?, notes = ?, updated_at = ?
      WHERE id = ?;
      `,
      [
        input.name.trim(),
        input.phone?.trim() || null,
        input.document?.trim() || null,
        input.notes?.trim() || null,
        now,
        id,
      ],
    );
  },

  async remove(id: number): Promise<void> {
    await execute('DELETE FROM clients WHERE id = ?;', [id]);
  },

  async count(): Promise<number> {
    const rows = await queryAll<{ total: number }>('SELECT COUNT(*) as total FROM clients;');
    return rows[0]?.total ?? 0;
  },
};

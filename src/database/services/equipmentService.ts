import { Equipment, EquipmentInput } from '../../types/domain';
import { execute, queryAll } from '../connection';

const mapEquipmentRow = (row: {
  id: number;
  name: string;
  category: string | null;
  rental_mode: string;
  daily_rate: number;
  equipment_value: number;
  stock: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}): Equipment => ({
  id: row.id,
  name: row.name,
  category: row.category,
  rentalMode:
    row.rental_mode === 'weekly' ||
    row.rental_mode === 'fortnightly' ||
    row.rental_mode === 'monthly'
      ? row.rental_mode
      : 'daily',
  dailyRate: Number(row.daily_rate),
  equipmentValue: Number(row.equipment_value),
  stock: Number(row.stock),
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const equipmentService = {
  async list(): Promise<Equipment[]> {
    const rows = await queryAll<{
      id: number;
      name: string;
      category: string | null;
      rental_mode: string;
      daily_rate: number;
      equipment_value: number;
      stock: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM equipments ORDER BY name COLLATE NOCASE ASC;');

    return rows.map(mapEquipmentRow);
  },

  async create(input: EquipmentInput): Promise<number> {
    const now = new Date().toISOString();
    const result = await execute(
      `
      INSERT INTO equipments (
        name, category, rental_mode, daily_rate, equipment_value, stock, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        input.name.trim(),
        input.category?.trim() || null,
        input.rentalMode,
        input.dailyRate,
        input.equipmentValue,
        input.stock,
        input.notes?.trim() || null,
        now,
        now,
      ],
    );

    if (!result.insertId) {
      throw new Error('Nao foi possivel criar o equipamento.');
    }

    return result.insertId;
  },

  async update(id: number, input: EquipmentInput): Promise<void> {
    const now = new Date().toISOString();

    await execute(
      `
      UPDATE equipments
      SET
        name = ?,
        category = ?,
        rental_mode = ?,
        daily_rate = ?,
        equipment_value = ?,
        stock = ?,
        notes = ?,
        updated_at = ?
      WHERE id = ?;
      `,
      [
        input.name.trim(),
        input.category?.trim() || null,
        input.rentalMode,
        input.dailyRate,
        input.equipmentValue,
        input.stock,
        input.notes?.trim() || null,
        now,
        id,
      ],
    );
  },

  async remove(id: number): Promise<void> {
    await execute('DELETE FROM equipments WHERE id = ?;', [id]);
  },

  async count(): Promise<number> {
    const rows = await queryAll<{ total: number }>('SELECT COUNT(*) as total FROM equipments;');
    return rows[0]?.total ?? 0;
  },
};

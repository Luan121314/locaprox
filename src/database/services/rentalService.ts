import {
  CurrencyCode,
  DeliveryMode,
  RentalCreateInput,
  RentalDetails,
  RentalDraftItem,
  RentalListItem,
  RentalStatus,
} from '../../types/domain';
import { execute, getDatabase, queryAll } from '../connection';

const buildItemTotal = (item: RentalDraftItem): number => item.quantity * item.unitPrice;

const normalizeDeliveryMode = (value: string): DeliveryMode => {
  return value === 'delivery' ? 'delivery' : 'pickup';
};

const normalizeCurrency = (value: string): CurrencyCode => {
  if (value === 'USD' || value === 'EUR') {
    return value;
  }

  return 'BRL';
};

const normalizeStatus = (value: string): RentalStatus => {
  if (value === 'completed' || value === 'canceled' || value === 'quote') {
    return value;
  }

  if (value === 'closed') {
    return 'completed';
  }

  if (value === 'draft') {
    return 'quote';
  }

  return 'in_progress';
};

const parseBrDate = (value: string): Date | null => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const isQuoteExpired = (quoteValidUntil: string | null, status: RentalStatus): boolean => {
  if (status !== 'quote' || !quoteValidUntil) {
    return false;
  }

  const validUntil = parseBrDate(quoteValidUntil);

  if (!validUntil) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return validUntil.getTime() < today.getTime();
};

const sanitizeQuoteValidUntil = (
  status: RentalStatus,
  quoteValidUntil: string | undefined,
): string | null => {
  if (status !== 'quote') {
    return null;
  }

  const trimmed = quoteValidUntil?.trim();
  return trimmed ? trimmed : null;
};

const applyQuoteExpirationRules = async (rentals: RentalListItem[]): Promise<RentalListItem[]> => {
  const expiredQuoteIds = rentals
    .filter(item => item.status === 'quote' && item.quoteExpired)
    .map(item => item.id);

  if (expiredQuoteIds.length > 0) {
    const now = new Date().toISOString();

    for (const rentalId of expiredQuoteIds) {
      await execute(
        `
        UPDATE rentals
        SET status = ?, updated_at = ?
        WHERE id = ?;
        `,
        ['canceled', now, rentalId],
      );
    }
  }

  return rentals.map(item => {
    if (item.status === 'quote' && item.quoteExpired) {
      return {
        ...item,
        status: 'canceled',
      };
    }

    return item;
  });
};

const expireQuoteIfNeeded = async (
  rentalId: number,
  status: RentalStatus,
  quoteValidUntil: string | null,
): Promise<RentalStatus> => {
  if (!isQuoteExpired(quoteValidUntil, status)) {
    return status;
  }

  await execute(
    `
    UPDATE rentals
    SET status = ?, updated_at = ?
    WHERE id = ?;
    `,
    ['canceled', new Date().toISOString(), rentalId],
  );

  return 'canceled';
};

export const rentalService = {
  async create(input: RentalCreateInput): Promise<number> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const subtotal = input.items.reduce((acc, item) => acc + buildItemTotal(item), 0);
    const freightValue = input.deliveryMode === 'delivery' ? input.freightValue : 0;
    const total = subtotal + freightValue;
    const quoteValidUntil = sanitizeQuoteValidUntil(input.status, input.quoteValidUntil);

    await db.executeSql('BEGIN TRANSACTION;');

    try {
      const [rentalResult] = await db.executeSql(
        `
        INSERT INTO rentals (
          client_id,
          start_date,
          start_time,
          end_date,
          end_time,
          delivery_mode,
          delivery_address,
          freight_value,
          currency,
          subtotal,
          total,
          status,
          quote_valid_until,
          notes,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          input.clientId,
          input.startDate,
          input.startTime,
          input.endDate,
          input.endTime,
          input.deliveryMode,
          input.deliveryMode === 'delivery' ? input.deliveryAddress?.trim() || null : null,
          freightValue,
          input.currency,
          subtotal,
          total,
          input.status,
          quoteValidUntil,
          input.notes?.trim() || null,
          now,
          now,
        ],
      );

      if (!rentalResult.insertId) {
        throw new Error('Nao foi possivel criar a locacao.');
      }

      const rentalId = rentalResult.insertId;

      for (const item of input.items) {
        const lineTotal = buildItemTotal(item);

        await db.executeSql(
          `
          INSERT INTO rental_items (rental_id, equipment_id, quantity, unit_price, line_total)
          VALUES (?, ?, ?, ?, ?);
          `,
          [rentalId, item.equipmentId, item.quantity, item.unitPrice, lineTotal],
        );
      }

      await db.executeSql('COMMIT;');

      return rentalId;
    } catch (error) {
      await db.executeSql('ROLLBACK;');
      throw error;
    }
  },

  async update(rentalId: number, input: RentalCreateInput): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const subtotal = input.items.reduce((acc, item) => acc + buildItemTotal(item), 0);
    const freightValue = input.deliveryMode === 'delivery' ? input.freightValue : 0;
    const total = subtotal + freightValue;
    const quoteValidUntil = sanitizeQuoteValidUntil(input.status, input.quoteValidUntil);

    await db.executeSql('BEGIN TRANSACTION;');

    try {
      await db.executeSql(
        `
        UPDATE rentals
        SET
          client_id = ?,
          start_date = ?,
          start_time = ?,
          end_date = ?,
          end_time = ?,
          delivery_mode = ?,
          delivery_address = ?,
          freight_value = ?,
          currency = ?,
          subtotal = ?,
          total = ?,
          status = ?,
          quote_valid_until = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?;
        `,
        [
          input.clientId,
          input.startDate,
          input.startTime,
          input.endDate,
          input.endTime,
          input.deliveryMode,
          input.deliveryMode === 'delivery' ? input.deliveryAddress?.trim() || null : null,
          freightValue,
          input.currency,
          subtotal,
          total,
          input.status,
          quoteValidUntil,
          input.notes?.trim() || null,
          now,
          rentalId,
        ],
      );

      await db.executeSql('DELETE FROM rental_items WHERE rental_id = ?;', [rentalId]);

      for (const item of input.items) {
        const lineTotal = buildItemTotal(item);

        await db.executeSql(
          `
          INSERT INTO rental_items (rental_id, equipment_id, quantity, unit_price, line_total)
          VALUES (?, ?, ?, ?, ?);
          `,
          [rentalId, item.equipmentId, item.quantity, item.unitPrice, lineTotal],
        );
      }

      await db.executeSql('COMMIT;');
    } catch (error) {
      await db.executeSql('ROLLBACK;');
      throw error;
    }
  },

  async getById(rentalId: number): Promise<RentalDetails | null> {
    const rentalRows = await queryAll<{
      id: number;
      clientId: number;
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
      deliveryMode: string;
      deliveryAddress: string | null;
      freightValue: number | string;
      currency: string;
      subtotal: number | string;
      total: number | string;
      status: string;
      quoteValidUntil: string | null;
      notes: string | null;
      createdAt: string;
      updatedAt: string;
    }>(
      `
      SELECT
        r.id as id,
        r.client_id as clientId,
        r.start_date as startDate,
        r.start_time as startTime,
        r.end_date as endDate,
        r.end_time as endTime,
        r.delivery_mode as deliveryMode,
        r.delivery_address as deliveryAddress,
        r.freight_value as freightValue,
        r.currency as currency,
        r.subtotal as subtotal,
        r.total as total,
        r.status as status,
        r.quote_valid_until as quoteValidUntil,
        r.notes as notes,
        r.created_at as createdAt,
        r.updated_at as updatedAt
      FROM rentals r
      WHERE r.id = ?;
      `,
      [rentalId],
    );

    if (rentalRows.length === 0) {
      return null;
    }

    const itemRows = await queryAll<{
      equipmentId: number;
      equipmentName: string;
      quantity: number | string;
      unitPrice: number | string;
    }>(
      `
      SELECT
        ri.equipment_id as equipmentId,
        e.name as equipmentName,
        ri.quantity as quantity,
        ri.unit_price as unitPrice
      FROM rental_items ri
      INNER JOIN equipments e ON e.id = ri.equipment_id
      WHERE ri.rental_id = ?
      ORDER BY ri.id ASC;
      `,
      [rentalId],
    );

    const rentalRow = rentalRows[0];
    const normalizedStatus = normalizeStatus(rentalRow.status);
    const statusWithRules = await expireQuoteIfNeeded(
      rentalRow.id,
      normalizedStatus,
      rentalRow.quoteValidUntil,
    );

    return {
      id: rentalRow.id,
      clientId: rentalRow.clientId,
      startDate: rentalRow.startDate,
      startTime: rentalRow.startTime,
      endDate: rentalRow.endDate,
      endTime: rentalRow.endTime,
      deliveryMode: normalizeDeliveryMode(rentalRow.deliveryMode),
      deliveryAddress: rentalRow.deliveryAddress,
      freightValue: Number(rentalRow.freightValue),
      currency: normalizeCurrency(rentalRow.currency),
      subtotal: Number(rentalRow.subtotal),
      total: Number(rentalRow.total),
      status: statusWithRules,
      quoteValidUntil: rentalRow.quoteValidUntil,
      notes: rentalRow.notes,
      createdAt: rentalRow.createdAt,
      updatedAt: rentalRow.updatedAt,
      items: itemRows.map(row => ({
        equipmentId: row.equipmentId,
        equipmentName: row.equipmentName,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
      })),
    };
  },

  async list(): Promise<RentalListItem[]> {
    const rows = await queryAll<{
      id: number;
      clientId: number;
      clientName: string;
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
      deliveryMode: string;
      deliveryAddress: string | null;
      freightValue: number | string;
      currency: string;
      subtotal: number | string;
      total: number | string;
      status: string;
      quoteValidUntil: string | null;
      notes: string | null;
      createdAt: string;
      itemCount: number | string;
    }>(
      `
      SELECT
        r.id as id,
        r.client_id as clientId,
        c.name as clientName,
        r.start_date as startDate,
        r.start_time as startTime,
        r.end_date as endDate,
        r.end_time as endTime,
        r.delivery_mode as deliveryMode,
        r.delivery_address as deliveryAddress,
        r.freight_value as freightValue,
        r.currency as currency,
        r.subtotal as subtotal,
        r.total as total,
        r.status as status,
        r.quote_valid_until as quoteValidUntil,
        r.notes as notes,
        r.created_at as createdAt,
        COUNT(ri.id) as itemCount
      FROM rentals r
      INNER JOIN clients c ON c.id = r.client_id
      LEFT JOIN rental_items ri ON ri.rental_id = r.id
      GROUP BY r.id
      ORDER BY r.created_at DESC;
      `,
    );

    const rentals = rows.map<RentalListItem>(row => {
      const normalizedStatus = normalizeStatus(row.status);
      const quoteValidUntil = row.quoteValidUntil;
      const quoteExpired = isQuoteExpired(quoteValidUntil, normalizedStatus);

      return {
        id: row.id,
        clientId: row.clientId,
        clientName: row.clientName,
        startDate: row.startDate,
        startTime: row.startTime,
        endDate: row.endDate,
        endTime: row.endTime,
        deliveryMode: normalizeDeliveryMode(row.deliveryMode),
        deliveryAddress: row.deliveryAddress,
        freightValue: Number(row.freightValue),
        currency: normalizeCurrency(row.currency),
        subtotal: Number(row.subtotal),
        total: Number(row.total),
        status: normalizedStatus,
        quoteValidUntil,
        quoteExpired,
        notes: row.notes,
        itemCount: Number(row.itemCount),
        createdAt: row.createdAt,
      };
    });

    return applyQuoteExpirationRules(rentals);
  },

  async count(): Promise<number> {
    const rows = await queryAll<{ total: number }>('SELECT COUNT(*) as total FROM rentals;');
    return rows[0]?.total ?? 0;
  },
};

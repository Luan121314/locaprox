import SQLite, {
  ResultSet,
  SQLiteDatabase,
} from 'react-native-sqlite-storage';

import { schemaStatements } from './schema';

SQLite.enablePromise(true);

type SqlParam = string | number | null;
const DB_NAME = 'locaprox.db';
const DB_LOCATION = 'default';

let databasePromise: Promise<SQLiteDatabase> | null = null;

export const getDatabase = async (): Promise<SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabase({
      name: DB_NAME,
      location: DB_LOCATION,
    }).catch(error => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
};

const closeDatabase = async (): Promise<void> => {
  if (!databasePromise) {
    return;
  }

  try {
    const db = await databasePromise;
    if (db.close) {
      await db.close();
    }
  } catch {
    // If open/close fails, we still reset handle so next try can recreate it.
  } finally {
    databasePromise = null;
  }
};

const resetDatabaseFile = async (): Promise<void> => {
  await closeDatabase();

  if (SQLite.deleteDatabase) {
    await SQLite.deleteDatabase({
      name: DB_NAME,
      location: DB_LOCATION,
    });
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      message?: unknown;
      code?: unknown;
      sqliteErrorCode?: unknown;
    };

    const parts: string[] = [];

    if (typeof maybeError.message === 'string' && maybeError.message.length > 0) {
      parts.push(maybeError.message);
    }
    if (maybeError.code !== undefined) {
      parts.push(`code=${String(maybeError.code)}`);
    }
    if (maybeError.sqliteErrorCode !== undefined) {
      parts.push(`sqliteCode=${String(maybeError.sqliteErrorCode)}`);
    }

    if (parts.length > 0) {
      return parts.join(' | ');
    }

    try {
      return JSON.stringify(error);
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  return String(error);
};

const shouldIgnoreMigrationError = (error: unknown): boolean => {
  const message = getErrorMessage(error).toLowerCase();

  return message.includes('duplicate column name');
};

const applySchema = async (): Promise<void> => {
  const db = await getDatabase();

  await db.executeSql('PRAGMA foreign_keys = ON;');

  for (const statement of schemaStatements) {
    try {
      await db.executeSql(statement);
    } catch (error) {
      // Needed for backward-compatible migrations where the column may already exist.
      if (!shouldIgnoreMigrationError(error)) {
        throw error;
      }
    }
  }
};

export const initDatabase = async (): Promise<void> => {
  try {
    await applySchema();
  } catch (firstError) {
    const firstMessage = getErrorMessage(firstError);
    console.error('[DB] Initial schema apply failed:', firstMessage);

    // Recovery path for corrupted/incompatible local db from previous builds.
    try {
      await resetDatabaseFile();
      await applySchema();
      console.warn('[DB] Database was recreated after migration failure.');
    } catch (recoveryError) {
      const recoveryMessage = getErrorMessage(recoveryError);
      console.error('[DB] Recovery failed:', recoveryMessage);
      throw new Error(
        `Falha ao inicializar DB. erro_inicial="${firstMessage}" erro_recovery="${recoveryMessage}"`,
      );
    }
  }
};

export const queryAll = async <TRow>(
  sql: string,
  params: SqlParam[] = [],
): Promise<TRow[]> => {
  const db = await getDatabase();
  const [result] = await db.executeSql(sql, params);

  const rows: TRow[] = [];
  for (let index = 0; index < result.rows.length; index += 1) {
    rows.push(result.rows.item(index) as TRow);
  }

  return rows;
};

export const execute = async (
  sql: string,
  params: SqlParam[] = [],
): Promise<ResultSet> => {
  const db = await getDatabase();
  const [result] = await db.executeSql(sql, params);
  return result;
};

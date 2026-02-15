declare module 'react-native-sqlite-storage' {
  export type ResultSet = {
    rows: {
      length: number;
      item: (index: number) => unknown;
    };
    insertId?: number;
  };

  export type SQLiteDatabase = {
    executeSql: (
      statement: string,
      params?: Array<string | number | null>,
    ) => Promise<[ResultSet]>;
    close?: () => Promise<unknown>;
  };

  const SQLite: {
    enablePromise: (enabled: boolean) => void;
    openDatabase: (options: {
      name: string;
      location: string;
    }) => Promise<SQLiteDatabase>;
    deleteDatabase?: (options: {
      name: string;
      location: string;
    }) => Promise<unknown>;
  };

  export default SQLite;
}

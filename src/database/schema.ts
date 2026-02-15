export const schemaStatements: string[] = [
  `
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      document TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS equipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      rental_mode TEXT NOT NULL DEFAULT 'daily',
      daily_rate REAL NOT NULL,
      equipment_value REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      start_time TEXT NOT NULL DEFAULT '08:00',
      end_date TEXT NOT NULL,
      end_time TEXT NOT NULL DEFAULT '18:00',
      delivery_mode TEXT NOT NULL DEFAULT 'pickup',
      delivery_address TEXT,
      freight_value REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'BRL',
      subtotal REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      quote_valid_until TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS rental_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rental_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      line_total REAL NOT NULL,
      FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipments(id) ON DELETE RESTRICT
    );
  `,
  `
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `,
  `ALTER TABLE equipments ADD COLUMN rental_mode TEXT NOT NULL DEFAULT 'daily';`,
  `ALTER TABLE equipments ADD COLUMN equipment_value REAL NOT NULL DEFAULT 0;`,
  `ALTER TABLE rentals ADD COLUMN start_time TEXT NOT NULL DEFAULT '08:00';`,
  `ALTER TABLE rentals ADD COLUMN end_time TEXT NOT NULL DEFAULT '18:00';`,
  `ALTER TABLE rentals ADD COLUMN delivery_mode TEXT NOT NULL DEFAULT 'pickup';`,
  `ALTER TABLE rentals ADD COLUMN delivery_address TEXT;`,
  `ALTER TABLE rentals ADD COLUMN freight_value REAL NOT NULL DEFAULT 0;`,
  `ALTER TABLE rentals ADD COLUMN currency TEXT NOT NULL DEFAULT 'BRL';`,
  `ALTER TABLE rentals ADD COLUMN quote_valid_until TEXT;`,
  `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('currency', 'BRL');`,
  `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('company_name', '');`,
  `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('company_logo_uri', '');`,
  `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('rental_start_reminder', '1d');`,
  `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('rental_end_reminder', '1h');`,
  `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('weekly_factor', '6');`,
  `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('fortnightly_factor', '12');`,
  `INSERT OR IGNORE INTO app_settings (key, value) VALUES ('monthly_factor', '24');`,
  `CREATE INDEX IF NOT EXISTS idx_rentals_client_id ON rentals(client_id);`,
  `CREATE INDEX IF NOT EXISTS idx_rental_items_rental_id ON rental_items(rental_id);`,
  `CREATE INDEX IF NOT EXISTS idx_rental_items_equipment_id ON rental_items(equipment_id);`,
];

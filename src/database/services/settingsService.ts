import {
  AppSettings,
  AppSettingsInput,
  CurrencyCode,
  NotificationReminderOption,
  PricingRules,
  RentalMode,
} from '../../types/domain';
import { execute, queryAll } from '../connection';

const SETTINGS_KEYS = [
  'currency',
  'company_name',
  'company_document',
  'company_logo_uri',
  'rental_start_reminder',
  'rental_end_reminder',
  'weekly_factor',
  'fortnightly_factor',
  'monthly_factor',
] as const;

const DEFAULT_PRICING_RULES: PricingRules = {
  weeklyFactor: 6,
  fortnightlyFactor: 12,
  monthlyFactor: 24,
};

const DEFAULT_SETTINGS: AppSettings = {
  pricingRules: DEFAULT_PRICING_RULES,
  currency: 'BRL',
  companyName: '',
  companyDocument: '',
  companyLogoUri: '',
  rentalStartReminder: '1d',
  rentalEndReminder: '1h',
};

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseFloat(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const toCurrency = (value: string | undefined): CurrencyCode => {
  if (value === 'USD' || value === 'EUR') {
    return value;
  }

  return 'BRL';
};

const toReminderOption = (value: string | undefined): NotificationReminderOption => {
  if (value === 'none' || value === '1h') {
    return value;
  }

  return '1d';
};

export const pricingRulesService = {
  getSuggestedValues(): PricingRules {
    return DEFAULT_PRICING_RULES;
  },

  getFactorForMode(mode: RentalMode, pricingRules: PricingRules): number {
    if (mode === 'weekly') {
      return pricingRules.weeklyFactor;
    }

    if (mode === 'fortnightly') {
      return pricingRules.fortnightlyFactor;
    }

    if (mode === 'monthly') {
      return pricingRules.monthlyFactor;
    }

    return 1;
  },

  calculateRateByMode(dailyRate: number, mode: RentalMode, pricingRules: PricingRules): number {
    return dailyRate * this.getFactorForMode(mode, pricingRules);
  },
};

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    const rows = await queryAll<{ key: string; value: string }>(
      `
      SELECT key, value
      FROM app_settings
      WHERE key IN (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [...SETTINGS_KEYS],
    );

    const map = new Map(rows.map(row => [row.key, row.value]));

    const settings: AppSettings = {
      pricingRules: {
        weeklyFactor: toNumber(map.get('weekly_factor'), DEFAULT_PRICING_RULES.weeklyFactor),
        fortnightlyFactor: toNumber(
          map.get('fortnightly_factor'),
          DEFAULT_PRICING_RULES.fortnightlyFactor,
        ),
        monthlyFactor: toNumber(map.get('monthly_factor'), DEFAULT_PRICING_RULES.monthlyFactor),
      },
      currency: toCurrency(map.get('currency')),
      companyName: map.get('company_name') ?? DEFAULT_SETTINGS.companyName,
      companyDocument: map.get('company_document') ?? DEFAULT_SETTINGS.companyDocument,
      companyLogoUri: map.get('company_logo_uri') ?? DEFAULT_SETTINGS.companyLogoUri,
      rentalStartReminder: toReminderOption(map.get('rental_start_reminder')),
      rentalEndReminder: toReminderOption(map.get('rental_end_reminder')),
    };

    return settings;
  },

  async saveSettings(input: AppSettingsInput): Promise<void> {
    const payload: Array<[string, string]> = [
      ['currency', input.currency],
      ['company_name', input.companyName.trim()],
      ['company_document', input.companyDocument.trim()],
      ['company_logo_uri', input.companyLogoUri.trim()],
      ['rental_start_reminder', input.rentalStartReminder],
      ['rental_end_reminder', input.rentalEndReminder],
      ['weekly_factor', String(input.pricingRules.weeklyFactor)],
      ['fortnightly_factor', String(input.pricingRules.fortnightlyFactor)],
      ['monthly_factor', String(input.pricingRules.monthlyFactor)],
    ];

    for (const [key, value] of payload) {
      await execute(
        `
        INSERT INTO app_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value;
        `,
        [key, value],
      );
    }
  },
};

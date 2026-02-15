import { CurrencyCode } from '../types/domain';

const currencyLocaleMap: Record<CurrencyCode, string> = {
  BRL: 'pt-BR',
  USD: 'en-US',
  EUR: 'de-DE',
};

export const toCurrency = (value: number, currency: CurrencyCode = 'BRL'): string => {
  return value.toLocaleString(currencyLocaleMap[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  });
};

export const parseDecimalInput = (rawValue: string): number => {
  let normalized = rawValue.trim().replace(/\s/g, '');

  if (!normalized) {
    return 0;
  }

  if (normalized.includes(',')) {
    if (normalized.includes('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(',', '.');
    }
  }

  const parsed = Number.parseFloat(normalized);

  if (Number.isNaN(parsed)) {
    return 0;
  }

  return parsed;
};

const pad2 = (value: number): string => String(value).padStart(2, '0');

export const todayBrDate = (): string => {
  const now = new Date();
  return `${pad2(now.getDate())}/${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
};

export const nowHHmm = (): string => {
  const now = new Date();
  return `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
};

export const isValidBrDate = (value: string): boolean => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return false;
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);

  const testDate = new Date(year, month - 1, day);

  return (
    testDate.getFullYear() === year &&
    testDate.getMonth() + 1 === month &&
    testDate.getDate() === day
  );
};

export const isValidTimeHHmm = (value: string): boolean => {
  const match = value.match(/^(\d{2}):(\d{2})$/);

  if (!match) {
    return false;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
};

const brDateToParts = (value: string): { day: number; month: number; year: number } => {
  const [dayRaw, monthRaw, yearRaw] = value.split('/');

  return {
    day: Number.parseInt(dayRaw, 10),
    month: Number.parseInt(monthRaw, 10),
    year: Number.parseInt(yearRaw, 10),
  };
};

export const compareBrDateTime = (
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
): number => {
  const { day: startDay, month: startMonth, year: startYear } = brDateToParts(startDate);
  const { day: endDay, month: endMonth, year: endYear } = brDateToParts(endDate);

  const [startHour, startMinute] = startTime.split(':').map(value => Number.parseInt(value, 10));
  const [endHour, endMinute] = endTime.split(':').map(value => Number.parseInt(value, 10));

  const start = new Date(startYear, startMonth - 1, startDay, startHour, startMinute);
  const end = new Date(endYear, endMonth - 1, endDay, endHour, endMinute);

  if (start.getTime() === end.getTime()) {
    return 0;
  }

  return start.getTime() < end.getTime() ? -1 : 1;
};

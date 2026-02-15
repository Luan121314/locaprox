export type RentalMode = 'daily' | 'weekly' | 'fortnightly' | 'monthly';
export type DeliveryMode = 'pickup' | 'delivery';
export type CurrencyCode = 'BRL' | 'USD' | 'EUR';
export type NotificationReminderOption = 'none' | '1h' | '1d';
export type RentalStatus = 'in_progress' | 'completed' | 'canceled' | 'quote';

export type Client = {
  id: number;
  name: string;
  phone: string | null;
  document: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientInput = {
  name: string;
  phone?: string;
  document?: string;
  notes?: string;
};

export type Equipment = {
  id: number;
  name: string;
  category: string | null;
  rentalMode: RentalMode;
  dailyRate: number;
  equipmentValue: number;
  stock: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentInput = {
  name: string;
  category?: string;
  rentalMode: RentalMode;
  dailyRate: number;
  equipmentValue: number;
  stock: number;
  notes?: string;
};

export type Rental = {
  id: number;
  clientId: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  deliveryMode: DeliveryMode;
  deliveryAddress: string | null;
  freightValue: number;
  currency: CurrencyCode;
  subtotal: number;
  total: number;
  status: RentalStatus;
  quoteValidUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RentalItem = {
  id: number;
  rentalId: number;
  equipmentId: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type RentalDraftItem = {
  equipmentId: number;
  equipmentName: string;
  quantity: number;
  unitPrice: number;
};

export type RentalFormDraft = {
  selectedClientId: number | null;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  deliveryMode: DeliveryMode;
  deliveryAddress: string;
  freightValue: string;
  status: RentalStatus;
  quoteValidUntil: string;
  notes: string;
  items: RentalDraftItem[];
};

export type RentalCreateInput = {
  clientId: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  deliveryMode: DeliveryMode;
  deliveryAddress?: string;
  freightValue: number;
  currency: CurrencyCode;
  status: RentalStatus;
  quoteValidUntil?: string;
  notes?: string;
  items: RentalDraftItem[];
};

export type RentalListItem = {
  id: number;
  clientId: number;
  clientName: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  deliveryMode: DeliveryMode;
  deliveryAddress: string | null;
  freightValue: number;
  currency: CurrencyCode;
  subtotal: number;
  total: number;
  status: RentalStatus;
  quoteValidUntil: string | null;
  quoteExpired: boolean;
  notes: string | null;
  itemCount: number;
  createdAt: string;
};

export type RentalDetails = Rental & {
  items: RentalDraftItem[];
};

export type PricingRules = {
  weeklyFactor: number;
  fortnightlyFactor: number;
  monthlyFactor: number;
};

export type AppSettings = {
  pricingRules: PricingRules;
  currency: CurrencyCode;
  companyName: string;
  companyDocument: string;
  companyLogoUri: string;
  rentalStartReminder: NotificationReminderOption;
  rentalEndReminder: NotificationReminderOption;
};

export type AppSettingsInput = AppSettings;

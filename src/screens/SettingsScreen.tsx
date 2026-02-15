import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { pricingRulesService, settingsService } from '../database/services/settingsService';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import { CurrencyCode, NotificationReminderOption } from '../types/domain';
import { RootStackParamList } from '../types/navigation';
import { parseDecimalInput } from '../utils/format';

type SettingsScreenProps = NativeStackScreenProps<RootStackParamList, 'Settings'>;
type ImagePickerAsset = {
  uri?: string;
};

type ImagePickerResponse = {
  didCancel?: boolean;
  errorCode?: string;
  errorMessage?: string;
  assets?: ImagePickerAsset[];
};

type ImageLibraryOptions = {
  mediaType?: 'photo' | 'video' | 'mixed';
  selectionLimit?: number;
  quality?: number;
};

type ImagePickerModule = {
  launchImageLibrary: (
    options: ImageLibraryOptions,
    callback: (response: ImagePickerResponse) => void,
  ) => void;
};

const BUTTON_HIT_SLOP = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

const currencyOptions: Array<{ label: string; value: CurrencyCode }> = [
  { label: 'Real (BRL)', value: 'BRL' },
  { label: 'Dolar (USD)', value: 'USD' },
  { label: 'Euro (EUR)', value: 'EUR' },
];

const reminderOptions: Array<{ label: string; value: NotificationReminderOption }> = [
  { label: 'Sem lembrete', value: 'none' },
  { label: '1 hora antes', value: '1h' },
  { label: '1 dia antes', value: '1d' },
];

type SettingsFormState = {
  weeklyFactor: string;
  fortnightlyFactor: string;
  monthlyFactor: string;
  currency: CurrencyCode;
  companyName: string;
  companyDocument: string;
  companyLogoUri: string;
  rentalStartReminder: NotificationReminderOption;
  rentalEndReminder: NotificationReminderOption;
};

const suggestedRules = pricingRulesService.getSuggestedValues();

const resolveLogoSource = (rawValue: string): ImageSourcePropType | null => {
  const normalized = rawValue.trim();

  if (!normalized) {
    return null;
  }

  return { uri: normalized };
};

const normalizeCompanyDocumentDigits = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 14);
};

const formatCpf = (digits: string): string => {
  const base = digits.slice(0, 11);
  const part1 = base.slice(0, 3);
  const part2 = base.slice(3, 6);
  const part3 = base.slice(6, 9);
  const part4 = base.slice(9, 11);

  return `${part1}${part2 ? `.${part2}` : ''}${part3 ? `.${part3}` : ''}${part4 ? `-${part4}` : ''}`;
};

const formatCnpj = (digits: string): string => {
  const base = digits.slice(0, 14);
  const part1 = base.slice(0, 2);
  const part2 = base.slice(2, 5);
  const part3 = base.slice(5, 8);
  const part4 = base.slice(8, 12);
  const part5 = base.slice(12, 14);

  return `${part1}${part2 ? `.${part2}` : ''}${part3 ? `.${part3}` : ''}${part4 ? `/${part4}` : ''}${part5 ? `-${part5}` : ''}`;
};

const formatCompanyDocument = (value: string): string => {
  const digits = normalizeCompanyDocumentDigits(value);

  if (!digits) {
    return '';
  }

  if (digits.length <= 11) {
    return formatCpf(digits);
  }

  return formatCnpj(digits);
};

const loadImagePickerModule = (): ImagePickerModule | null => {
  try {
    const module = require('react-native-image-picker') as {
      launchImageLibrary?: ImagePickerModule['launchImageLibrary'];
    };

    if (!module.launchImageLibrary) {
      return null;
    }

    return {
      launchImageLibrary: module.launchImageLibrary,
    };
  } catch {
    return null;
  }
};

const nativeImagePicker = loadImagePickerModule();

export const SettingsScreen = (_props: SettingsScreenProps): React.JSX.Element => {
  const bumpDataVersion = useAppStore(state => state.bumpDataVersion);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingLogo, setIsPickingLogo] = useState(false);
  const [form, setForm] = useState<SettingsFormState>({
    weeklyFactor: String(suggestedRules.weeklyFactor),
    fortnightlyFactor: String(suggestedRules.fortnightlyFactor),
    monthlyFactor: String(suggestedRules.monthlyFactor),
    currency: 'BRL',
    companyName: '',
    companyDocument: '',
    companyLogoUri: '',
    rentalStartReminder: '1d',
    rentalEndReminder: '1h',
  });
  const logoPreviewSource = useMemo(() => resolveLogoSource(form.companyLogoUri), [form.companyLogoUri]);
  const formattedCompanyDocument = useMemo(
    () => formatCompanyDocument(form.companyDocument),
    [form.companyDocument],
  );

  const loadSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const settings = await settingsService.getSettings();

      setForm({
        weeklyFactor: String(settings.pricingRules.weeklyFactor),
        fortnightlyFactor: String(settings.pricingRules.fortnightlyFactor),
        monthlyFactor: String(settings.pricingRules.monthlyFactor),
        currency: settings.currency,
        companyName: settings.companyName,
        companyDocument: normalizeCompanyDocumentDigits(settings.companyDocument),
        companyLogoUri: settings.companyLogoUri,
        rentalStartReminder: settings.rentalStartReminder,
        rentalEndReminder: settings.rentalEndReminder,
      });
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar as configuracoes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings().catch(() => {
        // loadSettings already handles errors.
      });
    }, [loadSettings]),
  );

  const setSuggested = (field: 'weeklyFactor' | 'fortnightlyFactor' | 'monthlyFactor', value: number): void => {
    setForm(current => ({ ...current, [field]: String(value) }));
  };

  const pickLogoFromDevice = (): void => {
    if (!nativeImagePicker) {
      Alert.alert(
        'Seletor indisponivel',
        'Instale react-native-image-picker e gere um novo build para carregar imagem do dispositivo.',
      );
      return;
    }

    setIsPickingLogo(true);

    nativeImagePicker.launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.9,
      },
      response => {
        setIsPickingLogo(false);

        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Alert.alert(
            'Erro',
            response.errorMessage || 'Nao foi possivel carregar a imagem selecionada.',
          );
          return;
        }

        const selectedUri = response.assets?.[0]?.uri?.trim();

        if (!selectedUri) {
          Alert.alert('Erro', 'Nao foi possivel obter a imagem selecionada.');
          return;
        }

        setForm(current => ({
          ...current,
          companyLogoUri: selectedUri,
        }));
      },
    );
  };

  const onSave = async (): Promise<void> => {
    const weeklyFactor = parseDecimalInput(form.weeklyFactor);
    const fortnightlyFactor = parseDecimalInput(form.fortnightlyFactor);
    const monthlyFactor = parseDecimalInput(form.monthlyFactor);

    if (weeklyFactor <= 0 || fortnightlyFactor <= 0 || monthlyFactor <= 0) {
      Alert.alert('Validacao', 'Informe fatores validos para semanal, quinzenal e mensal.');
      return;
    }

    setIsSaving(true);

    try {
      await settingsService.saveSettings({
        pricingRules: {
          weeklyFactor,
          fortnightlyFactor,
          monthlyFactor,
        },
        currency: form.currency,
        companyName: form.companyName,
        companyDocument: formatCompanyDocument(form.companyDocument),
        companyLogoUri: form.companyLogoUri,
        rentalStartReminder: form.rentalStartReminder,
        rentalEndReminder: form.rentalEndReminder,
      });

      bumpDataVersion();
      Alert.alert('Sucesso', 'Configuracoes salvas com sucesso.');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar as configuracoes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePress = (): void => {
    onSave().catch(() => {
      // onSave already handles errors.
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always">
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Equipamento</Text>
        <Text style={styles.sectionDescription}>
          Regras aplicadas para o calculo de locacao por modalidade, a partir da diaria.
        </Text>

        <Text style={styles.label}>Semanal (fator da diaria)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="Ex: 6"
          placeholderTextColor={colors.textMuted}
          value={form.weeklyFactor}
          onChangeText={value => setForm(current => ({ ...current, weeklyFactor: value }))}
        />
        <View style={styles.suggestionsRow}>
          <Pressable
            style={styles.suggestionButton}
            onPress={() => setSuggested('weeklyFactor', suggestedRules.weeklyFactor)}
            hitSlop={BUTTON_HIT_SLOP}>
            <Text style={styles.suggestionText}>Sugerido {suggestedRules.weeklyFactor}x</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Quinzenal (fator da diaria)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="Ex: 12"
          placeholderTextColor={colors.textMuted}
          value={form.fortnightlyFactor}
          onChangeText={value => setForm(current => ({ ...current, fortnightlyFactor: value }))}
        />
        <View style={styles.suggestionsRow}>
          <Pressable
            style={styles.suggestionButton}
            onPress={() => setSuggested('fortnightlyFactor', suggestedRules.fortnightlyFactor)}
            hitSlop={BUTTON_HIT_SLOP}>
            <Text style={styles.suggestionText}>Sugerido {suggestedRules.fortnightlyFactor}x</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Mensal (fator da diaria)</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="Ex: 24"
          placeholderTextColor={colors.textMuted}
          value={form.monthlyFactor}
          onChangeText={value => setForm(current => ({ ...current, monthlyFactor: value }))}
        />
        <View style={styles.suggestionsRow}>
          <Pressable
            style={styles.suggestionButton}
            onPress={() => setSuggested('monthlyFactor', suggestedRules.monthlyFactor)}
            hitSlop={BUTTON_HIT_SLOP}>
            <Text style={styles.suggestionText}>Sugerido {suggestedRules.monthlyFactor}x</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Global</Text>
        <Text style={styles.sectionDescription}>
          Moeda utilizada no app e nos documentos exportaveis (padrao BRL).
        </Text>

        <View style={styles.currencyGrid}>
          {currencyOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.currencyOption,
                form.currency === option.value && styles.currencyOptionSelected,
              ]}
              onPress={() => setForm(current => ({ ...current, currency: option.value }))}
              hitSlop={BUTTON_HIT_SLOP}>
              <Text
                style={[
                  styles.currencyOptionText,
                  form.currency === option.value && styles.currencyOptionTextSelected,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Empresa</Text>
        <Text style={styles.sectionDescription}>
          Dados utilizados em documentos e identidade da locadora.
        </Text>

        <Text style={styles.label}>Nome da empresa</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: LocaProX Eventos"
          placeholderTextColor={colors.textMuted}
          value={form.companyName}
          onChangeText={value => setForm(current => ({ ...current, companyName: value }))}
        />

        <Text style={styles.label}>CPF/CNPJ da empresa</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 12.345.678/0001-90"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={formattedCompanyDocument}
          onChangeText={value =>
            setForm(current => ({
              ...current,
              companyDocument: normalizeCompanyDocumentDigits(value),
            }))
          }
          maxLength={18}
        />

        <Text style={styles.label}>Logo da empresa</Text>
        <Pressable
          style={[styles.deviceLogoButton, isPickingLogo && styles.disabledButton]}
          onPress={pickLogoFromDevice}
          disabled={isPickingLogo}
          hitSlop={BUTTON_HIT_SLOP}>
          <Text style={styles.deviceLogoButtonText}>
            {isPickingLogo ? 'Abrindo galeria...' : 'Carregar imagem do dispositivo'}
          </Text>
        </Pressable>

        <Text style={styles.label}>Pre-visualizacao</Text>
        <View style={styles.logoPreviewBox}>
          {logoPreviewSource ? (
            <Image source={logoPreviewSource} style={styles.logoPreviewImage} resizeMode="contain" />
          ) : (
            <Text style={styles.logoPreviewPlaceholder}>Nenhuma logo selecionada.</Text>
          )}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Notificacao</Text>
        <Text style={styles.sectionDescription}>
          Defina quando deseja ser lembrado sobre inicio e termino das locacoes.
        </Text>

        <Text style={styles.label}>Lembrete de inicio</Text>
        <View style={styles.reminderGrid}>
          {reminderOptions.map(option => (
            <Pressable
              key={`start-${option.value}`}
              style={[
                styles.reminderOption,
                form.rentalStartReminder === option.value && styles.reminderOptionSelected,
              ]}
              onPress={() =>
                setForm(current => ({ ...current, rentalStartReminder: option.value }))
              }
              hitSlop={BUTTON_HIT_SLOP}>
              <Text
                style={[
                  styles.reminderOptionText,
                  form.rentalStartReminder === option.value &&
                    styles.reminderOptionTextSelected,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Lembrete de termino</Text>
        <View style={styles.reminderGrid}>
          {reminderOptions.map(option => (
            <Pressable
              key={`end-${option.value}`}
              style={[
                styles.reminderOption,
                form.rentalEndReminder === option.value && styles.reminderOptionSelected,
              ]}
              onPress={() =>
                setForm(current => ({ ...current, rentalEndReminder: option.value }))
              }
              hitSlop={BUTTON_HIT_SLOP}>
              <Text
                style={[
                  styles.reminderOptionText,
                  form.rentalEndReminder === option.value &&
                    styles.reminderOptionTextSelected,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.saveButton, isSaving && styles.disabledButton]}
        onPress={handleSavePress}
        disabled={isSaving}
        hitSlop={BUTTON_HIT_SLOP}>
        <Text style={styles.saveButtonText}>{isSaving ? 'Salvando...' : 'Salvar Configuracoes'}</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 8,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 2,
  },
  label: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFCFD',
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: '#D8FFF8',
    paddingHorizontal: 10,
    paddingVertical: 7,
    minHeight: 36,
    justifyContent: 'center',
  },
  suggestionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  currencyGrid: {
    gap: 8,
  },
  currencyOption: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  currencyOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  currencyOptionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  currencyOptionTextSelected: {
    color: colors.surface,
  },
  logoPreviewBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFCFD',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  logoPreviewImage: {
    width: '100%',
    height: 100,
  },
  logoPreviewPlaceholder: {
    color: colors.textMuted,
    fontSize: 13,
  },
  deviceLogoButton: {
    borderRadius: 10,
    backgroundColor: colors.secondary,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 4,
  },
  deviceLogoButtonText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  reminderGrid: {
    gap: 8,
  },
  reminderOption: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: 'center',
  },
  reminderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  reminderOptionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  reminderOptionTextSelected: {
    color: colors.surface,
  },
  saveButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  saveButtonText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

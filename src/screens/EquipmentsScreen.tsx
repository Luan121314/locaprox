import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { equipmentService } from '../database/services/equipmentService';
import { pricingRulesService, settingsService } from '../database/services/settingsService';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import { Equipment, PricingRules, RentalMode } from '../types/domain';
import { RootStackParamList } from '../types/navigation';
import { parseDecimalInput, toCurrency } from '../utils/format';

type EquipmentsScreenProps = NativeStackScreenProps<RootStackParamList, 'Equipments'>;

type EquipmentFormState = {
  name: string;
  category: string;
  rentalMode: RentalMode;
  dailyRate: string;
  equipmentValue: string;
  stock: string;
  notes: string;
};

const emptyForm: EquipmentFormState = {
  name: '',
  category: '',
  rentalMode: 'daily',
  dailyRate: '',
  equipmentValue: '',
  stock: '',
  notes: '',
};

const BUTTON_HIT_SLOP = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

const rentalModeOptions: Array<{ label: string; value: RentalMode }> = [
  { label: 'Diaria', value: 'daily' },
  { label: 'Semanal', value: 'weekly' },
  { label: 'Quinzenal', value: 'fortnightly' },
  { label: 'Mensal', value: 'monthly' },
];

const rentalModeLabelMap: Record<RentalMode, string> = {
  daily: 'Diaria',
  weekly: 'Semanal',
  fortnightly: 'Quinzenal',
  monthly: 'Mensal',
};

const suggestedPricingRules = pricingRulesService.getSuggestedValues();

export const EquipmentsScreen = (_props: EquipmentsScreenProps): React.JSX.Element => {
  const bumpDataVersion = useAppStore(state => state.bumpDataVersion);

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRules>(suggestedPricingRules);
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState<number | null>(null);
  const [form, setForm] = useState<EquipmentFormState>(emptyForm);

  const loadEquipments = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nextEquipments, settings] = await Promise.all([
        equipmentService.list(),
        settingsService.getSettings(),
      ]);

      setEquipments(nextEquipments);
      setPricingRules(settings.pricingRules);
      setCurrency(settings.currency);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar os equipamentos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEquipments().catch(() => {
        // loadEquipments already reports and handles failures.
      });
    }, [loadEquipments]),
  );

  const openCreateForm = (): void => {
    setEditingEquipmentId(null);
    setForm(emptyForm);
    setIsFormVisible(true);
  };

  const openEditForm = (equipment: Equipment): void => {
    setEditingEquipmentId(equipment.id);
    setForm({
      name: equipment.name,
      category: equipment.category ?? '',
      rentalMode: equipment.rentalMode,
      dailyRate: equipment.dailyRate.toString(),
      equipmentValue: equipment.equipmentValue.toString(),
      stock: equipment.stock.toString(),
      notes: equipment.notes ?? '',
    });
    setIsFormVisible(true);
  };

  const closeForm = (): void => {
    setIsFormVisible(false);
    setEditingEquipmentId(null);
    setForm(emptyForm);
  };

  const calculatedRentalRate = useMemo(() => {
    const dailyRate = parseDecimalInput(form.dailyRate);

    if (dailyRate <= 0) {
      return 0;
    }

    return pricingRulesService.calculateRateByMode(dailyRate, form.rentalMode, pricingRules);
  }, [form.dailyRate, form.rentalMode, pricingRules]);

  const onSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      Alert.alert('Validacao', 'Informe o nome do equipamento.');
      return;
    }

    const dailyRate = parseDecimalInput(form.dailyRate);
    const equipmentValue = parseDecimalInput(form.equipmentValue);
    const stock = Number.parseInt(form.stock, 10);

    if (!dailyRate || dailyRate <= 0) {
      Alert.alert('Validacao', 'Informe uma diaria valida.');
      return;
    }

    if (equipmentValue < 0) {
      Alert.alert('Validacao', 'Informe um valor de equipamento valido.');
      return;
    }

    if (Number.isNaN(stock) || stock < 0) {
      Alert.alert('Validacao', 'Informe um estoque valido.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: form.name,
        category: form.category,
        rentalMode: form.rentalMode,
        dailyRate,
        equipmentValue,
        stock,
        notes: form.notes,
      };

      if (editingEquipmentId) {
        await equipmentService.update(editingEquipmentId, payload);
      } else {
        await equipmentService.create(payload);
      }

      bumpDataVersion();
      closeForm();
      await loadEquipments();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar o equipamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = (equipment: Equipment): void => {
    Alert.alert(
      'Excluir equipamento',
      `Deseja remover ${equipment.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await equipmentService.remove(equipment.id);
              bumpDataVersion();
              await loadEquipments();
            } catch {
              Alert.alert(
                'Erro',
                'Nao foi possivel excluir. Verifique se este equipamento possui locacoes vinculadas.',
              );
            }
          },
        },
      ],
    );
  };

  const handleRefresh = (): void => {
    loadEquipments().catch(() => {
      // loadEquipments already reports and handles failures.
    });
  };

  const handleSavePress = (): void => {
    onSave().catch(() => {
      // onSave already reports and handles failures.
    });
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.addButton} onPress={openCreateForm} hitSlop={BUTTON_HIT_SLOP}>
        <Text style={styles.addButtonText}>Novo Equipamento</Text>
      </Pressable>

      <FlatList
        data={equipments}
        keyExtractor={item => String(item.id)}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum equipamento cadastrado.</Text>
        }
        renderItem={({ item }) => {
          const modeRate = pricingRulesService.calculateRateByMode(
            item.dailyRate,
            item.rentalMode,
            pricingRules,
          );

          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardInfo}>Categoria: {item.category || '-'}</Text>
              <Text style={styles.cardInfo}>Modalidade: {rentalModeLabelMap[item.rentalMode]}</Text>
              <Text style={styles.cardInfo}>Diaria: {toCurrency(item.dailyRate, currency)}</Text>
              <Text style={styles.cardInfo}>
                Valor locacao ({rentalModeLabelMap[item.rentalMode]}): {toCurrency(modeRate, currency)}
              </Text>
              <Text style={styles.cardInfo}>
                Valor do equipamento: {toCurrency(item.equipmentValue, currency)}
              </Text>
              <Text style={styles.cardInfo}>Estoque: {item.stock}</Text>

              <View style={styles.cardActions}>
                <Pressable
                  style={styles.outlineButton}
                  onPress={() => openEditForm(item)}
                  hitSlop={BUTTON_HIT_SLOP}>
                  <Text style={styles.outlineButtonText}>Editar</Text>
                </Pressable>
                <Pressable
                  style={styles.dangerButton}
                  onPress={() => onDelete(item)}
                  hitSlop={BUTTON_HIT_SLOP}>
                  <Text style={styles.dangerButtonText}>Excluir</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Modal
        animationType="slide"
        transparent
        visible={isFormVisible}
        onRequestClose={closeForm}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingEquipmentId ? 'Editar Equipamento' : 'Novo Equipamento'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nome"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={value => setForm(current => ({ ...current, name: value }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Categoria"
              placeholderTextColor={colors.textMuted}
              value={form.category}
              onChangeText={value => setForm(current => ({ ...current, category: value }))}
            />

            <Text style={styles.label}>Modalidade de locacao</Text>
            <View style={styles.modeGrid}>
              {rentalModeOptions.map(option => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.modeOption,
                    form.rentalMode === option.value && styles.modeOptionSelected,
                  ]}
                  onPress={() =>
                    setForm(current => ({
                      ...current,
                      rentalMode: option.value,
                    }))
                  }
                  hitSlop={BUTTON_HIT_SLOP}>
                  <Text
                    style={[
                      styles.modeOptionText,
                      form.rentalMode === option.value && styles.modeOptionTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Diaria (ex: 120.00)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={form.dailyRate}
              onChangeText={value => setForm(current => ({ ...current, dailyRate: value }))}
            />

            <Text style={styles.calculatedText}>
              Valor calculado ({rentalModeLabelMap[form.rentalMode]}):{' '}
              {toCurrency(calculatedRentalRate, currency)}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Valor do equipamento (patrimonio)"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={form.equipmentValue}
              onChangeText={value => setForm(current => ({ ...current, equipmentValue: value }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Estoque"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={form.stock}
              onChangeText={value => setForm(current => ({ ...current, stock: value }))}
            />

            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Observacoes"
              placeholderTextColor={colors.textMuted}
              multiline
              value={form.notes}
              onChangeText={value => setForm(current => ({ ...current, notes: value }))}
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.outlineButton}
                onPress={closeForm}
                hitSlop={BUTTON_HIT_SLOP}>
                <Text style={styles.outlineButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.addButton,
                  styles.modalPrimaryButton,
                  isSaving && styles.disabledButton,
                ]}
                onPress={handleSavePress}
                disabled={isSaving}
                hitSlop={BUTTON_HIT_SLOP}>
                <Text style={styles.addButtonText}>{isSaving ? 'Salvando...' : 'Salvar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 12,
  },
  addButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  addButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  label: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    gap: 10,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  cardInfo: {
    color: colors.textMuted,
    fontSize: 13,
  },
  cardActions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  outlineButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 44,
  },
  outlineButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  dangerButton: {
    borderRadius: 8,
    backgroundColor: colors.danger,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 44,
  },
  dangerButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 32,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 4,
  },
  modeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeOption: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  modeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modeOptionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  modeOptionTextSelected: {
    color: colors.surface,
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
  calculatedText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 13,
    marginTop: -2,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalPrimaryButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

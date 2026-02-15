import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { clientService } from '../database/services/clientService';
import { equipmentService } from '../database/services/equipmentService';
import { pricingRulesService, settingsService } from '../database/services/settingsService';
import { rentalService } from '../database/services/rentalService';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import {
  Client,
  CurrencyCode,
  DeliveryMode,
  Equipment,
  PricingRules,
  RentalFormDraft,
  RentalDraftItem,
  RentalStatus,
} from '../types/domain';
import { RootStackParamList } from '../types/navigation';
import {
  compareBrDateTime,
  isValidBrDate,
  isValidTimeHHmm,
  nowHHmm,
  parseDecimalInput,
  toCurrency,
  todayBrDate,
} from '../utils/format';

type RentalFormScreenProps = NativeStackScreenProps<RootStackParamList, 'RentalForm'>;

const BUTTON_HIT_SLOP = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

const deliveryOptions: Array<{ label: string; value: DeliveryMode }> = [
  { label: 'Retirada', value: 'pickup' },
  { label: 'Entrega', value: 'delivery' },
];

const rentalModeLabelMap = {
  daily: 'Diaria',
  weekly: 'Semanal',
  fortnightly: 'Quinzenal',
  monthly: 'Mensal',
} as const;

const rentalStatusOptions: Array<{ label: string; value: RentalStatus }> = [
  { label: 'Em Andamento', value: 'in_progress' },
  { label: 'Concluido', value: 'completed' },
  { label: 'Cancelada', value: 'canceled' },
  { label: 'Orcamento', value: 'quote' },
];

const suggestedRules = pricingRulesService.getSuggestedValues();

type NativeDateTimePickerChangeEvent = {
  type: 'set' | 'dismissed' | 'neutralButtonPressed';
};

type DateTimePickerOpenOptions = {
  value: Date;
  mode: 'date' | 'time';
  is24Hour?: boolean;
  onChange: (event: NativeDateTimePickerChangeEvent, date?: Date) => void;
};

type DateTimePickerAndroidModule = {
  open: (options: DateTimePickerOpenOptions) => void;
};

const loadDateTimePickerAndroid = (): DateTimePickerAndroidModule | null => {
  try {
    const module = require('@react-native-community/datetimepicker') as {
      DateTimePickerAndroid?: DateTimePickerAndroidModule;
    };

    return module.DateTimePickerAndroid ?? null;
  } catch {
    return null;
  }
};

const nativeDateTimePickerAndroid = loadDateTimePickerAndroid();

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

const formatBrDate = (value: Date): string => {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = String(value.getFullYear());

  return `${day}/${month}/${year}`;
};

const formatHHmm = (value: Date): string => {
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');

  return `${hour}:${minute}`;
};

const mergeBrDateAndTime = (dateValue: string, timeValue: string): Date => {
  const baseDate = parseBrDate(dateValue) ?? new Date();
  const [hourRaw = '00', minuteRaw = '00'] = timeValue.split(':');
  const hour = Number.parseInt(hourRaw, 10);
  const minute = Number.parseInt(minuteRaw, 10);

  baseDate.setHours(Number.isNaN(hour) ? 0 : hour, Number.isNaN(minute) ? 0 : minute, 0, 0);

  return baseDate;
};

export const RentalFormScreen = ({ navigation, route }: RentalFormScreenProps): React.JSX.Element => {
  const rentalId = route.params?.rentalId ?? null;
  const isEditMode = rentalId !== null;
  const bumpDataVersion = useAppStore(state => state.bumpDataVersion);
  const rentalFormDraft = useAppStore(state => state.rentalFormDraft);
  const setRentalFormDraft = useAppStore(state => state.setRentalFormDraft);
  const clearRentalFormDraft = useAppStore(state => state.clearRentalFormDraft);

  const [clients, setClients] = useState<Client[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRules>(suggestedRules);
  const [currency, setCurrency] = useState<CurrencyCode>('BRL');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(
    isEditMode ? null : rentalFormDraft?.selectedClientId ?? null,
  );
  const [startDate, setStartDate] = useState(
    isEditMode ? todayBrDate() : rentalFormDraft?.startDate ?? todayBrDate(),
  );
  const [startTime, setStartTime] = useState(
    isEditMode ? nowHHmm() : rentalFormDraft?.startTime ?? nowHHmm(),
  );
  const [endDate, setEndDate] = useState(
    isEditMode ? todayBrDate() : rentalFormDraft?.endDate ?? todayBrDate(),
  );
  const [endTime, setEndTime] = useState(
    isEditMode ? nowHHmm() : rentalFormDraft?.endTime ?? nowHHmm(),
  );
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(
    isEditMode ? 'pickup' : rentalFormDraft?.deliveryMode ?? 'pickup',
  );
  const [deliveryAddress, setDeliveryAddress] = useState(
    isEditMode ? '' : rentalFormDraft?.deliveryAddress ?? '',
  );
  const [freightValue, setFreightValue] = useState(
    isEditMode ? '' : rentalFormDraft?.freightValue ?? '',
  );
  const [status, setStatus] = useState<RentalStatus>(
    isEditMode ? 'in_progress' : rentalFormDraft?.status ?? 'in_progress',
  );
  const [quoteValidUntil, setQuoteValidUntil] = useState(
    isEditMode ? '' : rentalFormDraft?.quoteValidUntil ?? '',
  );
  const [notes, setNotes] = useState(isEditMode ? '' : rentalFormDraft?.notes ?? '');
  const [items, setItems] = useState<RentalDraftItem[]>(
    isEditMode ? [] : rentalFormDraft?.items ?? [],
  );
  const [hasLoadedEditData, setHasLoadedEditData] = useState(!isEditMode);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClientSelectOpen, setIsClientSelectOpen] = useState(false);
  const [isEquipmentPickerVisible, setIsEquipmentPickerVisible] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [equipmentPickerSearch, setEquipmentPickerSearch] = useState('');
  const [pendingEquipmentIds, setPendingEquipmentIds] = useState<number[]>([]);

  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      const [clientsList, equipmentsList, settings] = await Promise.all([
        clientService.list(),
        equipmentService.list(),
        settingsService.getSettings(),
      ]);

      setClients(clientsList);
      setEquipments(equipmentsList);
      setPricingRules(settings.pricingRules);
      setCurrency(settings.currency);

      if (isEditMode && rentalId && !hasLoadedEditData) {
        const rental = await rentalService.getById(rentalId);

        if (!rental) {
          Alert.alert('Erro', 'Locacao nao encontrada.');
          navigation.goBack();
          return;
        }

        setSelectedClientId(rental.clientId);
        setStartDate(rental.startDate);
        setStartTime(rental.startTime);
        setEndDate(rental.endDate);
        setEndTime(rental.endTime);
        setDeliveryMode(rental.deliveryMode);
        setDeliveryAddress(rental.deliveryAddress ?? '');
        setFreightValue(rental.freightValue > 0 ? String(rental.freightValue) : '');
        setStatus(rental.status);
        setQuoteValidUntil(rental.quoteValidUntil ?? '');
        setNotes(rental.notes ?? '');
        setItems(rental.items);
        setHasLoadedEditData(true);
      } else if (clientsList.length > 0) {
        setSelectedClientId(currentSelectedClientId => {
          if (
            currentSelectedClientId &&
            clientsList.some(client => client.id === currentSelectedClientId)
          ) {
            return currentSelectedClientId;
          }

          return clientsList[0].id;
        });
      } else {
        setSelectedClientId(null);
      }

      setItems(currentItems =>
        currentItems.filter(item =>
          equipmentsList.some(equipment => equipment.id === item.equipmentId),
        ),
      );
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar os dados para locacao.');
    } finally {
      setIsLoading(false);
    }
  }, [
    hasLoadedEditData,
    isEditMode,
    navigation,
    rentalId,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadData().catch(() => {
        // loadData already updates local UI state.
      });
    }, [loadData]),
  );

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [items]);

  const normalizedFreightValue = useMemo(() => {
    if (deliveryMode !== 'delivery') {
      return 0;
    }

    return parseDecimalInput(freightValue);
  }, [deliveryMode, freightValue]);

  const total = useMemo(() => subtotal + normalizedFreightValue, [subtotal, normalizedFreightValue]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) {
      return null;
    }

    return clients.find(client => client.id === selectedClientId) ?? null;
  }, [clients, selectedClientId]);

  const equipmentSelectionSummary = useMemo(() => {
    if (items.length === 0) {
      return 'Selecione um ou mais equipamentos';
    }

    if (items.length === 1) {
      return `${items[0].equipmentName} (x${items[0].quantity})`;
    }

    return `${items.length} equipamentos selecionados`;
  }, [items]);

  const pendingEquipments = useMemo(() => {
    if (pendingEquipmentIds.length === 0) {
      return [] as Equipment[];
    }

    return pendingEquipmentIds
      .map(equipmentId => equipments.find(equipment => equipment.id === equipmentId))
      .filter((equipment): equipment is Equipment => Boolean(equipment));
  }, [equipments, pendingEquipmentIds]);

  const filteredClients = useMemo(() => {
    const searchTerm = clientSearch.trim().toLowerCase();

    if (!searchTerm) {
      return clients;
    }

    return clients.filter(client =>
      `${client.name} ${client.phone ?? ''} ${client.document ?? ''}`
        .toLowerCase()
        .includes(searchTerm),
    );
  }, [clientSearch, clients]);

  const filteredEquipments = useMemo(() => {
    const searchTerm = equipmentPickerSearch.trim().toLowerCase();
    const selectedIds = new Set(items.map(item => item.equipmentId));
    const pendingIds = new Set(pendingEquipmentIds);

    return equipments.filter(equipment => {
      if (selectedIds.has(equipment.id) || pendingIds.has(equipment.id)) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return `${equipment.name} ${equipment.category ?? ''} ${rentalModeLabelMap[equipment.rentalMode]}`
        .toLowerCase()
        .includes(searchTerm);
    });
  }, [equipmentPickerSearch, equipments, items, pendingEquipmentIds]);

  const buildCurrentDraft = useCallback(
    (): RentalFormDraft => ({
      selectedClientId,
      startDate,
      startTime,
      endDate,
      endTime,
      deliveryMode,
      deliveryAddress,
      freightValue,
      status,
      quoteValidUntil,
      notes,
      items,
    }),
    [
      selectedClientId,
      startDate,
      startTime,
      endDate,
      endTime,
      deliveryMode,
      deliveryAddress,
      freightValue,
      status,
      quoteValidUntil,
      notes,
      items,
    ],
  );

  useEffect(() => {
    if (isLoading || isEditMode) {
      return;
    }

    setRentalFormDraft(buildCurrentDraft());
  }, [
    buildCurrentDraft,
    isEditMode,
    isLoading,
    setRentalFormDraft,
  ]);

  const getEquipmentStock = (equipmentId: number): number => {
    return equipments.find(item => item.id === equipmentId)?.stock ?? 0;
  };

  const getEquipmentRateByMode = (equipment: Equipment): number => {
    return pricingRulesService.calculateRateByMode(
      equipment.dailyRate,
      equipment.rentalMode,
      pricingRules,
    );
  };

  const removeItem = (equipmentId: number): void => {
    setItems(current => current.filter(item => item.equipmentId !== equipmentId));
  };

  const updateQuantity = (equipmentId: number, delta: number): void => {
    const currentItem = items.find(item => item.equipmentId === equipmentId);

    if (!currentItem) {
      return;
    }

    const stock = getEquipmentStock(equipmentId);
    const nextQuantity = currentItem.quantity + delta;

    if (nextQuantity <= 0) {
      removeItem(equipmentId);
      return;
    }

    if (nextQuantity > stock) {
      Alert.alert('Estoque', 'A quantidade selecionada excede o estoque disponivel.');
      return;
    }

    setItems(current =>
      current.map(item =>
        item.equipmentId === equipmentId
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    );
  };

  const updateUnitPrice = (equipmentId: number, rawValue: string): void => {
    const unitPrice = parseDecimalInput(rawValue);

    setItems(current =>
      current.map(item =>
        item.equipmentId === equipmentId
          ? { ...item, unitPrice }
          : item,
      ),
    );
  };

  const onSave = async (): Promise<void> => {
    if (!selectedClientId) {
      Alert.alert('Validacao', 'Selecione um cliente.');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Validacao', 'Selecione ao menos um equipamento.');
      return;
    }

    if (!isValidBrDate(startDate) || !isValidBrDate(endDate)) {
      Alert.alert('Validacao', 'Use o formato de data dia/mes/ano (dd/mm/aaaa).');
      return;
    }

    if (!isValidTimeHHmm(startTime) || !isValidTimeHHmm(endTime)) {
      Alert.alert('Validacao', 'Use o formato de hora hora:minuto (HH:mm).');
      return;
    }

    if (compareBrDateTime(startDate, startTime, endDate, endTime) === 1) {
      Alert.alert('Validacao', 'A data/hora de inicio nao pode ser maior que a de termino.');
      return;
    }

    if (deliveryMode === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Validacao', 'Informe o endereco de entrega.');
      return;
    }

    if (deliveryMode === 'delivery' && normalizedFreightValue < 0) {
      Alert.alert('Validacao', 'Informe um valor de frete valido.');
      return;
    }

    if (status === 'quote' && !quoteValidUntil.trim()) {
      Alert.alert('Validacao', 'Informe a validade do orcamento.');
      return;
    }

    if (status === 'quote' && !isValidBrDate(quoteValidUntil)) {
      Alert.alert('Validacao', 'Use o formato de data dia/mes/ano (dd/mm/aaaa) para validade.');
      return;
    }

    if (status === 'quote') {
      const validityDate = parseBrDate(quoteValidUntil);

      if (!validityDate) {
        Alert.alert('Validacao', 'Informe uma validade de orcamento valida.');
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (validityDate.getTime() < today.getTime()) {
        Alert.alert('Validacao', 'A validade do orcamento nao pode ser anterior a hoje.');
        return;
      }
    }

    if (total <= 0) {
      Alert.alert('Validacao', 'O total da locacao deve ser maior que zero.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        clientId: selectedClientId,
        startDate,
        startTime,
        endDate,
        endTime,
        deliveryMode,
        deliveryAddress,
        freightValue: normalizedFreightValue,
        currency,
        status,
        quoteValidUntil: status === 'quote' ? quoteValidUntil : undefined,
        notes,
        items,
      };

      if (isEditMode && rentalId) {
        await rentalService.update(rentalId, payload);
      } else {
        await rentalService.create(payload);
      }

      bumpDataVersion();

      if (!isEditMode) {
        clearRentalFormDraft();
      }

      Alert.alert('Sucesso', isEditMode ? 'Locacao atualizada com sucesso.' : 'Locacao criada com sucesso.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar a locacao.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePress = (): void => {
    onSave().catch(() => {
      // onSave already reports and handles failures.
    });
  };

  const persistDraftForRedirect = (): void => {
    if (isEditMode) {
      return;
    }

    setRentalFormDraft(buildCurrentDraft());
  };

  const goToClientsRegistration = (): void => {
    persistDraftForRedirect();
    navigation.navigate('Clients');
  };

  const goToEquipmentsRegistration = (): void => {
    persistDraftForRedirect();
    navigation.navigate('Equipments');
  };

  const onStatusPress = (nextStatus: RentalStatus): void => {
    setStatus(nextStatus);

    if (nextStatus !== 'quote') {
      setQuoteValidUntil('');
    }
  };

  const showDateTimePickerUnavailable = (): void => {
    Alert.alert(
      'Seletor indisponivel',
      'Nao foi possivel abrir o seletor nativo de data/hora. Instale @react-native-community/datetimepicker e gere um novo build do app.',
    );
  };

  const openNativeDatePicker = (target: 'start' | 'end'): void => {
    if (Platform.OS !== 'android' || !nativeDateTimePickerAndroid) {
      showDateTimePickerUnavailable();
      return;
    }

    const currentDate = target === 'start'
      ? mergeBrDateAndTime(startDate, startTime)
      : mergeBrDateAndTime(endDate, endTime);

    nativeDateTimePickerAndroid.open({
      value: currentDate,
      mode: 'date',
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) {
          return;
        }

        const formatted = formatBrDate(selectedDate);

        if (target === 'start') {
          setStartDate(formatted);
          return;
        }

        setEndDate(formatted);
      },
    });
  };

  const openNativeTimePicker = (target: 'start' | 'end'): void => {
    if (Platform.OS !== 'android' || !nativeDateTimePickerAndroid) {
      showDateTimePickerUnavailable();
      return;
    }

    const currentDate = target === 'start'
      ? mergeBrDateAndTime(startDate, startTime)
      : mergeBrDateAndTime(endDate, endTime);

    nativeDateTimePickerAndroid.open({
      value: currentDate,
      mode: 'time',
      is24Hour: true,
      onChange: (event, selectedDate) => {
        if (event.type !== 'set' || !selectedDate) {
          return;
        }

        const formatted = formatHHmm(selectedDate);

        if (target === 'start') {
          setStartTime(formatted);
          return;
        }

        setEndTime(formatted);
      },
    });
  };

  const toggleClientSelect = (): void => {
    const nextValue = !isClientSelectOpen;
    setIsClientSelectOpen(nextValue);

    setClientSearch('');
  };

  const openEquipmentPicker = (): void => {
    setIsClientSelectOpen(false);
    setEquipmentPickerSearch('');
    setPendingEquipmentIds([]);
    setIsEquipmentPickerVisible(true);
  };

  const closeEquipmentPicker = (): void => {
    setIsEquipmentPickerVisible(false);
    setPendingEquipmentIds([]);
    setEquipmentPickerSearch('');
  };

  const queueEquipmentForSelection = (equipmentId: number): void => {
    setPendingEquipmentIds(current => {
      if (current.includes(equipmentId)) {
        return current;
      }

      return [...current, equipmentId];
    });
  };

  const removeQueuedEquipment = (equipmentId: number): void => {
    setPendingEquipmentIds(current => current.filter(id => id !== equipmentId));
  };

  const confirmEquipmentSelection = (): void => {
    if (pendingEquipments.length === 0) {
      Alert.alert('Validacao', 'Selecione ao menos um equipamento.');
      return;
    }

    setItems(currentItems => {
      const currentIds = new Set(currentItems.map(item => item.equipmentId));
      const nextItems = [...currentItems];

      for (const equipment of pendingEquipments) {
        if (equipment.stock <= 0 || currentIds.has(equipment.id)) {
          continue;
        }

        nextItems.push({
          equipmentId: equipment.id,
          equipmentName: equipment.name,
          quantity: 1,
          unitPrice: getEquipmentRateByMode(equipment),
        });
        currentIds.add(equipment.id);
      }

      return nextItems;
    });

    closeEquipmentPicker();
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
      <Text style={styles.sectionTitle}>Cliente</Text>
      {clients.length === 0 ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Cadastre ao menos um cliente antes de criar uma locacao.
          </Text>
          <Pressable
            style={styles.warningActionButton}
            onPress={goToClientsRegistration}
            hitSlop={BUTTON_HIT_SLOP}>
            <Text style={styles.warningActionButtonText}>Cadastrar Cliente</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.selectSection}>
          <Pressable
            style={[
              styles.selectTrigger,
              isClientSelectOpen && styles.selectTriggerOpen,
            ]}
            onPress={toggleClientSelect}
            hitSlop={BUTTON_HIT_SLOP}>
            <View style={styles.selectTriggerContent}>
              <Text style={styles.selectTriggerLabel}>Cliente selecionado</Text>
              <Text
                style={[
                  styles.selectTriggerValue,
                  !selectedClient && styles.selectTriggerPlaceholder,
                ]}
                numberOfLines={1}>
                {selectedClient?.name ?? 'Selecione um cliente'}
              </Text>
            </View>
            <Text style={styles.selectTriggerIndicator}>
              {isClientSelectOpen ? '▲' : '▼'}
            </Text>
          </Pressable>

          {isClientSelectOpen ? (
            <View style={styles.selectExpandedPanel}>
              <TextInput
                style={styles.input}
                placeholder="Buscar cliente"
                placeholderTextColor={colors.textMuted}
                value={clientSearch}
                onChangeText={setClientSearch}
              />
              <View style={styles.selectListContainer}>
                <ScrollView
                  style={styles.selectList}
                  contentContainerStyle={styles.selectListContent}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="always">
                  {filteredClients.length === 0 ? (
                    <Text style={styles.emptySelectText}>Nenhum cliente encontrado.</Text>
                  ) : (
                    filteredClients.map(client => (
                      <Pressable
                        key={client.id}
                        style={[
                          styles.selectOption,
                          selectedClientId === client.id && styles.selectOptionSelected,
                        ]}
                        onPress={() => {
                          setSelectedClientId(client.id);
                          setIsClientSelectOpen(false);
                          setClientSearch('');
                        }}
                        hitSlop={BUTTON_HIT_SLOP}>
                        <Text
                          style={[
                            styles.selectOptionTitle,
                            selectedClientId === client.id && styles.selectOptionTitleSelected,
                          ]}>
                          {client.name}
                        </Text>
                        <Text
                          style={[
                            styles.selectOptionMeta,
                            selectedClientId === client.id && styles.selectOptionMetaSelected,
                          ]}>
                          {client.phone || client.document
                            ? `${client.phone ?? '-'} | ${client.document ?? '-'}`
                            : 'Sem telefone/documento'}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          ) : null}
        </View>
      )}

      <Text style={styles.sectionTitle}>Periodo</Text>
      <View style={styles.dateTimeSection}>
        <Text style={styles.dateTimeSectionTitle}>Inicio</Text>
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeField}>
            <Text style={styles.dateTimeLabel}>Data</Text>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => openNativeDatePicker('start')}
              hitSlop={BUTTON_HIT_SLOP}>
              <Text style={styles.dateTimeButtonText}>{startDate}</Text>
            </Pressable>
          </View>
          <View style={styles.dateTimeField}>
            <Text style={styles.dateTimeLabel}>Hora</Text>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => openNativeTimePicker('start')}
              hitSlop={BUTTON_HIT_SLOP}>
              <Text style={styles.dateTimeButtonText}>{startTime}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.dateTimeSection}>
        <Text style={styles.dateTimeSectionTitle}>Fim</Text>
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeField}>
            <Text style={styles.dateTimeLabel}>Data</Text>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => openNativeDatePicker('end')}
              hitSlop={BUTTON_HIT_SLOP}>
              <Text style={styles.dateTimeButtonText}>{endDate}</Text>
            </Pressable>
          </View>
          <View style={styles.dateTimeField}>
            <Text style={styles.dateTimeLabel}>Hora</Text>
            <Pressable
              style={styles.dateTimeButton}
              onPress={() => openNativeTimePicker('end')}
              hitSlop={BUTTON_HIT_SLOP}>
              <Text style={styles.dateTimeButtonText}>{endTime}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Entrega ou Retirada</Text>
      <View style={styles.deliveryModeGrid}>
        {deliveryOptions.map(option => (
          <Pressable
            key={option.value}
            style={[
              styles.modeOption,
              deliveryMode === option.value && styles.modeOptionSelected,
            ]}
            onPress={() => setDeliveryMode(option.value)}
            hitSlop={BUTTON_HIT_SLOP}>
            <Text
              style={[
                styles.modeOptionText,
                deliveryMode === option.value && styles.modeOptionTextSelected,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {deliveryMode === 'delivery' ? (
        <View style={styles.deliverySection}>
          <TextInput
            style={styles.input}
            placeholder="Endereco de entrega"
            placeholderTextColor={colors.textMuted}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />
          <TextInput
            style={styles.input}
            placeholder="Valor do frete"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={freightValue}
            onChangeText={setFreightValue}
          />
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Status da Locacao</Text>
      <View style={styles.statusGrid}>
        {rentalStatusOptions.map(option => (
          <Pressable
            key={option.value}
            style={[
              styles.modeOption,
              status === option.value && styles.modeOptionSelected,
            ]}
            onPress={() => onStatusPress(option.value)}
            hitSlop={BUTTON_HIT_SLOP}>
            <Text
              style={[
                styles.modeOptionText,
                status === option.value && styles.modeOptionTextSelected,
              ]}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {status === 'quote' ? (
        <View style={styles.quoteSection}>
          <TextInput
            style={styles.input}
            placeholder="Validade do orcamento (dd/mm/aaaa)"
            placeholderTextColor={colors.textMuted}
            value={quoteValidUntil}
            onChangeText={setQuoteValidUntil}
          />
          <Text style={styles.warningText}>
            Orcamentos vencidos sao marcados como cancelada automaticamente.
          </Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Equipamentos Disponiveis</Text>
      {equipments.length === 0 ? (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Cadastre ao menos um equipamento para montar uma locacao.
          </Text>
          <Pressable
            style={styles.warningActionButton}
            onPress={goToEquipmentsRegistration}
            hitSlop={BUTTON_HIT_SLOP}>
            <Text style={styles.warningActionButtonText}>Cadastrar Equipamento</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.selectSection}>
          <Pressable
            style={[
              styles.selectTrigger,
              isEquipmentPickerVisible && styles.selectTriggerOpen,
            ]}
            onPress={openEquipmentPicker}
            hitSlop={BUTTON_HIT_SLOP}>
            <View style={styles.selectTriggerContent}>
              <Text style={styles.selectTriggerLabel}>Equipamentos selecionados</Text>
              <Text
                style={[
                  styles.selectTriggerValue,
                  items.length === 0 && styles.selectTriggerPlaceholder,
                ]}
                numberOfLines={1}>
                {equipmentSelectionSummary}
              </Text>
            </View>
            <Text style={styles.selectTriggerIndicator}>
              ▼
            </Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>Itens da Locacao</Text>
      {items.length === 0 ? (
        <Text style={styles.warningText}>Nenhum item selecionado.</Text>
      ) : (
        items.map(item => (
          <View key={item.equipmentId} style={styles.cartCard}>
            <View style={styles.cartHeader}>
              <Text style={styles.cartName}>{item.equipmentName}</Text>
              <Pressable onPress={() => removeItem(item.equipmentId)} hitSlop={BUTTON_HIT_SLOP}>
                <Text style={styles.removeText}>Remover</Text>
              </Pressable>
            </View>

            <View style={styles.quantityRow}>
              <Pressable
                style={styles.counterButton}
                onPress={() => updateQuantity(item.equipmentId, -1)}
                hitSlop={BUTTON_HIT_SLOP}>
                <Text style={styles.counterButtonText}>-</Text>
              </Pressable>
              <Text style={styles.quantityText}>{item.quantity}</Text>
              <Pressable
                style={styles.counterButton}
                onPress={() => updateQuantity(item.equipmentId, 1)}
                hitSlop={BUTTON_HIT_SLOP}>
                <Text style={styles.counterButtonText}>+</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Valor unitario"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={item.unitPrice.toString()}
              onChangeText={value => updateUnitPrice(item.equipmentId, value)}
            />

            <Text style={styles.lineTotalText}>
              Total item: {toCurrency(item.quantity * item.unitPrice, currency)}
            </Text>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Observacoes</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Informacoes adicionais"
        placeholderTextColor={colors.textMuted}
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Subtotal</Text>
        <Text style={styles.summaryValue}>{toCurrency(subtotal, currency)}</Text>

        {deliveryMode === 'delivery' ? (
          <>
            <Text style={styles.summaryLabel}>Frete</Text>
            <Text style={styles.summaryValueSmall}>{toCurrency(normalizedFreightValue, currency)}</Text>
          </>
        ) : null}

        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryValue}>{toCurrency(total, currency)}</Text>
      </View>

      <Pressable
        style={[styles.saveButton, isSaving && styles.disabledButton]}
        onPress={handleSavePress}
        disabled={isSaving || clients.length === 0 || equipments.length === 0}
        hitSlop={BUTTON_HIT_SLOP}>
        <Text style={styles.saveButtonText}>
          {isSaving ? 'Salvando...' : isEditMode ? 'Atualizar Locacao' : 'Salvar Locacao'}
        </Text>
      </Pressable>

      <Modal
        animationType="slide"
        transparent
        visible={isEquipmentPickerVisible}
        onRequestClose={closeEquipmentPicker}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Selecionar Equipamentos</Text>

            <TextInput
              style={styles.input}
              placeholder="Buscar equipamento"
              placeholderTextColor={colors.textMuted}
              value={equipmentPickerSearch}
              onChangeText={setEquipmentPickerSearch}
            />

            <Text style={styles.modalSectionTitle}>Disponiveis</Text>
            <View style={styles.selectListContainer}>
              <ScrollView
                style={styles.modalList}
                contentContainerStyle={styles.selectListContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="always">
                {filteredEquipments.length === 0 ? (
                  <Text style={styles.emptySelectText}>
                    Nenhum equipamento disponivel para selecao.
                  </Text>
                ) : (
                  filteredEquipments.map(equipment => (
                    <View key={equipment.id} style={styles.equipmentRow}>
                      <View style={styles.equipmentInfoBox}>
                        <Text style={styles.equipmentName}>{equipment.name}</Text>
                        <Text style={styles.equipmentMeta}>
                          Estoque: {equipment.stock} | Modalidade: {rentalModeLabelMap[equipment.rentalMode]}
                        </Text>
                        <Text style={styles.equipmentMeta}>
                          Valor locacao: {toCurrency(getEquipmentRateByMode(equipment), currency)}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.smallPrimaryButton}
                        onPress={() => queueEquipmentForSelection(equipment.id)}
                        hitSlop={BUTTON_HIT_SLOP}>
                        <Text style={styles.smallPrimaryButtonText}>Selecionar</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            <Text style={styles.modalSectionTitle}>Selecionados</Text>
            <View style={styles.selectListContainer}>
              <ScrollView
                style={styles.modalSelectedList}
                contentContainerStyle={styles.selectListContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="always">
                {pendingEquipments.length === 0 ? (
                  <Text style={styles.emptySelectText}>Nenhum equipamento selecionado.</Text>
                ) : (
                  pendingEquipments.map(equipment => (
                    <View key={`pending-${equipment.id}`} style={styles.equipmentRow}>
                      <View style={styles.equipmentInfoBox}>
                        <Text style={styles.equipmentName}>{equipment.name}</Text>
                        <Text style={styles.equipmentMeta}>
                          Modalidade: {rentalModeLabelMap[equipment.rentalMode]}
                        </Text>
                        <Text style={styles.equipmentMeta}>
                          Valor locacao: {toCurrency(getEquipmentRateByMode(equipment), currency)}
                        </Text>
                      </View>
                      <Pressable
                        style={styles.modalRemoveButton}
                        onPress={() => removeQueuedEquipment(equipment.id)}
                        hitSlop={BUTTON_HIT_SLOP}>
                        <Text style={styles.modalRemoveButtonText}>Remover</Text>
                      </Pressable>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={closeEquipmentPicker}
                hitSlop={BUTTON_HIT_SLOP}>
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={confirmEquipmentSelection}
                hitSlop={BUTTON_HIT_SLOP}>
                <Text style={styles.modalConfirmButtonText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 10,
    paddingBottom: 28,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  selectSection: {
    gap: 8,
  },
  selectTrigger: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selectTriggerOpen: {
    borderColor: colors.primary,
  },
  selectTriggerContent: {
    flex: 1,
    gap: 2,
  },
  selectTriggerLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  selectTriggerValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  selectTriggerPlaceholder: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  selectTriggerIndicator: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  selectExpandedPanel: {
    gap: 8,
  },
  selectListContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  selectList: {
    maxHeight: 220,
  },
  selectListContent: {
    padding: 8,
    gap: 8,
  },
  selectOption: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
    gap: 2,
  },
  selectOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  selectOptionTitle: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  selectOptionTitleSelected: {
    color: colors.surface,
  },
  selectOptionMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  selectOptionMetaSelected: {
    color: colors.surface,
    opacity: 0.95,
  },
  emptySelectText: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: 6,
    paddingVertical: 8,
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
  dateTimeSection: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 8,
  },
  dateTimeSectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTimeField: {
    flex: 1,
    gap: 4,
  },
  dateTimeLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  dateTimeButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFCFD',
    minHeight: 42,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  dateTimeButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryModeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  modeOption: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minHeight: 40,
    justifyContent: 'center',
  },
  modeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  modeOptionText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  modeOptionTextSelected: {
    color: colors.surface,
  },
  deliverySection: {
    gap: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quoteSection: {
    gap: 8,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  equipmentRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equipmentInfoBox: {
    flex: 1,
    gap: 2,
  },
  equipmentName: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  equipmentMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  smallPrimaryButton: {
    borderRadius: 8,
    backgroundColor: colors.secondary,
    paddingVertical: 9,
    paddingHorizontal: 10,
    justifyContent: 'center',
    minHeight: 40,
  },
  smallPrimaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 15, 25, 0.45)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 8,
    maxHeight: '88%',
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '800',
  },
  modalSectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  modalList: {
    maxHeight: 220,
  },
  modalSelectedList: {
    maxHeight: 180,
  },
  modalRemoveButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    paddingVertical: 9,
    paddingHorizontal: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  modalRemoveButtonText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: colors.primary,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  cartCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 8,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartName: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  removeText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterButton: {
    width: 42,
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  quantityText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  lineTotalText: {
    color: colors.success,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 6,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  summaryValueSmall: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 4,
  },
  saveButtonText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: 14,
  },
  warningText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  warningCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 10,
  },
  warningActionButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  warningActionButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

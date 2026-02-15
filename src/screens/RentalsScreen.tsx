import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { rentalService } from '../database/services/rentalService';
import { colors } from '../theme/colors';
import { RentalListItem, RentalStatus } from '../types/domain';
import { RootStackParamList } from '../types/navigation';
import { toCurrency } from '../utils/format';

type RentalsScreenProps = NativeStackScreenProps<RootStackParamList, 'Rentals'>;

const BUTTON_HIT_SLOP = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

const statusLabelMap: Record<RentalStatus, string> = {
  in_progress: 'Em Andamento',
  completed: 'Concluido',
  canceled: 'Cancelada',
  quote: 'Orcamento',
};

export const RentalsScreen = ({ navigation }: RentalsScreenProps): React.JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [rentals, setRentals] = useState<RentalListItem[]>([]);

  const loadRentals = useCallback(async () => {
    setIsLoading(true);

    try {
      const list = await rentalService.list();
      setRentals(list);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRentals().catch(() => {
        // loadRentals already updates local UI state.
      });
    }, [loadRentals]),
  );

  const handleRefresh = (): void => {
    loadRentals().catch(() => {
      // loadRentals already updates local UI state.
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.createButton}
        onPress={() => navigation.navigate('RentalForm')}
        hitSlop={BUTTON_HIT_SLOP}>
        <Text style={styles.createButtonText}>Nova Locacao</Text>
      </Pressable>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={rentals}
          keyExtractor={item => String(item.id)}
          onRefresh={handleRefresh}
          refreshing={isLoading}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma locacao encontrada.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Locacao #{item.id}</Text>
              <Text style={styles.cardInfo}>Cliente: {item.clientName}</Text>
              <Text style={styles.cardInfo}>Status: {statusLabelMap[item.status]}</Text>
              <Text style={styles.cardInfo}>
                Periodo: {item.startDate} {item.startTime} ate {item.endDate} {item.endTime}
              </Text>
              <Text style={styles.cardInfo}>
                Modalidade: {item.deliveryMode === 'delivery' ? 'Entrega' : 'Retirada'}
              </Text>
              {item.deliveryMode === 'delivery' ? (
                <Text style={styles.cardInfo}>
                  Frete: {toCurrency(item.freightValue, item.currency)}
                </Text>
              ) : null}
              {item.quoteValidUntil ? (
                <Text style={styles.cardInfo}>Validade do orcamento: {item.quoteValidUntil}</Text>
              ) : null}
              {item.quoteExpired ? (
                <Text style={styles.warningText}>
                  Orcamento expirado. Status ajustado para cancelada.
                </Text>
              ) : null}
              <Text style={styles.cardInfo}>Itens: {item.itemCount}</Text>
              <Text style={styles.totalText}>Total: {toCurrency(item.total, item.currency)}</Text>

              <Pressable
                style={styles.editButton}
                onPress={() => navigation.navigate('RentalForm', { rentalId: item.id })}
                hitSlop={BUTTON_HIT_SLOP}>
                <Text style={styles.editButtonText}>Editar Locacao</Text>
              </Pressable>
            </View>
          )}
        />
      )}
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
  createButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  createButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  loadingBox: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  cardInfo: {
    color: colors.textMuted,
    fontSize: 13,
  },
  totalText: {
    marginTop: 4,
    color: colors.success,
    fontWeight: '800',
    fontSize: 14,
  },
  warningText: {
    marginTop: 2,
    color: colors.danger,
    fontWeight: '700',
    fontSize: 12,
  },
  editButton: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: 32,
    fontSize: 14,
  },
});

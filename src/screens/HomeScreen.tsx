import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { clientService } from '../database/services/clientService';
import { equipmentService } from '../database/services/equipmentService';
import { rentalService } from '../database/services/rentalService';
import { colors } from '../theme/colors';
import { RootStackParamList } from '../types/navigation';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

type DashboardStats = {
  clients: number;
  equipments: number;
  rentals: number;
};

const BUTTON_HIT_SLOP = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

const StatCard = ({ label, value }: { label: string; value: number }): React.JSX.Element => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const HomeScreen = ({ navigation }: HomeScreenProps): React.JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    clients: 0,
    equipments: 0,
    rentals: 0,
  });

  const loadStats = useCallback(async () => {
    setIsLoading(true);

    try {
      const [clients, equipments, rentals] = await Promise.all([
        clientService.count(),
        equipmentService.count(),
        rentalService.count(),
      ]);

      setStats({ clients, equipments, rentals });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats().catch(() => {
        // loadStats handles loading state transitions.
      });
    }, [loadStats]),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="always">
      <Text style={styles.title}>Painel Operacional</Text>
      <Text style={styles.subtitle}>
        Gestao offline para clientes, equipamentos e locacoes.
      </Text>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.statsGrid}>
          <StatCard label="Clientes" value={stats.clients} />
          <StatCard label="Equipamentos" value={stats.equipments} />
          <StatCard label="Locacoes" value={stats.rentals} />
        </View>
      )}

      <View style={styles.actionsSection}>
        <Pressable
          style={styles.primaryAction}
          onPress={() => navigation.navigate('Clients')}
          hitSlop={BUTTON_HIT_SLOP}>
          <Text style={styles.primaryActionText}>Gerenciar Clientes</Text>
        </Pressable>

        <Pressable
          style={styles.primaryAction}
          onPress={() => navigation.navigate('Equipments')}
          hitSlop={BUTTON_HIT_SLOP}>
          <Text style={styles.primaryActionText}>Gerenciar Equipamentos</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryAction}
          onPress={() => navigation.navigate('Rentals')}
          hitSlop={BUTTON_HIT_SLOP}>
          <Text style={styles.secondaryActionText}>Criar e Listar Locacoes</Text>
        </Pressable>

        <Pressable
          style={styles.outlineAction}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={BUTTON_HIT_SLOP}>
          <Text style={styles.outlineActionText}>Configuracoes</Text>
        </Pressable>
      </View>
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
    gap: 16,
  },
  title: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
  },
  loadingBox: {
    height: 100,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  statValue: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  actionsSection: {
    gap: 10,
  },
  primaryAction: {
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryActionText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryAction: {
    borderRadius: 12,
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  outlineAction: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  outlineActionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
});

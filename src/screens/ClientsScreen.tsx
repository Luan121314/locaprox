import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
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

import { clientService } from '../database/services/clientService';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/colors';
import { Client } from '../types/domain';
import { RootStackParamList } from '../types/navigation';

type ClientsScreenProps = NativeStackScreenProps<RootStackParamList, 'Clients'>;

type ClientFormState = {
  name: string;
  phone: string;
  document: string;
  notes: string;
};

const emptyForm: ClientFormState = {
  name: '',
  phone: '',
  document: '',
  notes: '',
};

const BUTTON_HIT_SLOP = {
  top: 12,
  bottom: 12,
  left: 12,
  right: 12,
} as const;

export const ClientsScreen = (_props: ClientsScreenProps): React.JSX.Element => {
  const bumpDataVersion = useAppStore(state => state.bumpDataVersion);

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientFormState>(emptyForm);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextClients = await clientService.list();
      setClients(nextClients);
    } catch {
      Alert.alert('Erro', 'Nao foi possivel carregar os clientes.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients().catch(() => {
        // loadClients already reports and handles failures.
      });
    }, [loadClients]),
  );

  const openCreateForm = (): void => {
    setEditingClientId(null);
    setForm(emptyForm);
    setIsFormVisible(true);
  };

  const openEditForm = (client: Client): void => {
    setEditingClientId(client.id);
    setForm({
      name: client.name,
      phone: client.phone ?? '',
      document: client.document ?? '',
      notes: client.notes ?? '',
    });
    setIsFormVisible(true);
  };

  const closeForm = (): void => {
    setIsFormVisible(false);
    setEditingClientId(null);
    setForm(emptyForm);
  };

  const onSave = async (): Promise<void> => {
    if (!form.name.trim()) {
      Alert.alert('Validacao', 'Informe o nome do cliente.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingClientId) {
        await clientService.update(editingClientId, form);
      } else {
        await clientService.create(form);
      }

      bumpDataVersion();
      closeForm();
      await loadClients();
    } catch {
      Alert.alert('Erro', 'Nao foi possivel salvar o cliente.');
    } finally {
      setIsSaving(false);
    }
  };

  const onDelete = (client: Client): void => {
    Alert.alert(
      'Excluir cliente',
      `Deseja remover ${client.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await clientService.remove(client.id);
              bumpDataVersion();
              await loadClients();
            } catch {
              Alert.alert(
                'Erro',
                'Nao foi possivel excluir. Verifique se este cliente possui locacoes ativas.',
              );
            }
          },
        },
      ],
    );
  };

  const handleRefresh = (): void => {
    loadClients().catch(() => {
      // loadClients already reports and handles failures.
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
        <Text style={styles.addButtonText}>Novo Cliente</Text>
      </Pressable>

      <FlatList
        data={clients}
        keyExtractor={item => String(item.id)}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum cliente cadastrado.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardInfo}>Telefone: {item.phone || '-'}</Text>
            <Text style={styles.cardInfo}>Documento: {item.document || '-'}</Text>

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
        )}
      />

      <Modal
        animationType="slide"
        transparent
        visible={isFormVisible}
        onRequestClose={closeForm}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingClientId ? 'Editar Cliente' : 'Novo Cliente'}
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
              placeholder="Telefone"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={value => setForm(current => ({ ...current, phone: value }))}
            />

            <TextInput
              style={styles.input}
              placeholder="Documento"
              placeholderTextColor={colors.textMuted}
              value={form.document}
              onChangeText={value => setForm(current => ({ ...current, document: value }))}
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
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFCFD',
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
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

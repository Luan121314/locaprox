import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { RootStackParamList } from '../types/navigation';
import { ClientsScreen } from '../screens/ClientsScreen';
import { EquipmentsScreen } from '../screens/EquipmentsScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { RentalFormScreen } from '../screens/RentalFormScreen';
import { RentalsScreen } from '../screens/RentalsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const MainNavigator = (): React.JSX.Element => {
  const insets = useSafeAreaInsets();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.surface,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: {
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'LocaProX' }}
      />
      <Stack.Screen
        name="Clients"
        component={ClientsScreen}
        options={{ title: 'Clientes' }}
      />
      <Stack.Screen
        name="Equipments"
        component={EquipmentsScreen}
        options={{ title: 'Equipamentos' }}
      />
      <Stack.Screen
        name="Rentals"
        component={RentalsScreen}
        options={{ title: 'Locacoes' }}
      />
      <Stack.Screen
        name="RentalForm"
        component={RentalFormScreen}
        options={({ route }) => ({
          title: route.params?.rentalId ? 'Editar Locacao' : 'Nova Locacao',
        })}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configuracoes' }}
      />
    </Stack.Navigator>
  );
};

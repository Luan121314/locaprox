import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import SplashScreen from 'react-native-splash-screen';

import { initDatabase } from './src/database/connection';
import { MainNavigator } from './src/navigation/MainNavigator';
import { useAppStore } from './src/store/useAppStore';
import { colors } from './src/theme/colors';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.primary,
    primary: colors.secondary,
    text: colors.text,
    border: colors.border,
  },
};

function App(): React.JSX.Element {
  const setDbReady = useAppStore(state => state.setDbReady);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const bootstrap = useCallback(async () => {
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      await initDatabase();
      setDbReady(true);
    } catch (error) {
      setDbReady(false);
      const details = error instanceof Error ? error.message : String(error);
      console.error('[App] Database bootstrap failed:', details);
      setBootstrapError(`Nao foi possivel inicializar o banco local.\n\n${details}`);
    } finally {
      setIsBootstrapping(false);
      SplashScreen.hide();
    }
  }, [setDbReady]);

  useEffect(() => {
    bootstrap().catch(() => {
      // bootstrap already updates UI state on failure.
    });
  }, [bootstrap]);

  const retryBootstrap = (): void => {
    bootstrap().catch(() => {
      // bootstrap already updates UI state on failure.
    });
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider style={styles.safeAreaProvider}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primary}
          translucent={false}
        />

        <View style={styles.appContainer}>
          {isBootstrapping ? (
            <SafeAreaView style={styles.centeredScreen} edges={['top', 'bottom', 'left', 'right']}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.centeredText}>Preparando ambiente offline...</Text>
            </SafeAreaView>
          ) : bootstrapError ? (
            <SafeAreaView style={styles.centeredScreen} edges={['top', 'bottom', 'left', 'right']}>
              <Text style={styles.errorText}>{bootstrapError}</Text>
              <Pressable style={styles.retryButton} onPress={retryBootstrap} hitSlop={12}>
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </Pressable>
            </SafeAreaView>
          ) : (
            <NavigationContainer theme={navigationTheme}>
              <MainNavigator />
            </NavigationContainer>
          )}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeAreaProvider: {
    flex: 1,
    backgroundColor: colors.background,
  },
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 20,
    gap: 14,
  },
  centeredText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    borderRadius: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default App;

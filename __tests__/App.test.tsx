/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-navigation/native', () => {
  const ReactLib = require('react');

  return {
    NavigationContainer: ({ children }: { children: React.ReactNode }) => (
      <ReactLib.Fragment>{children}</ReactLib.Fragment>
    ),
    DefaultTheme: { colors: {} },
    useFocusEffect: (callback: () => void | (() => void)) => {
      ReactLib.useEffect(() => {
        const cleanup = callback();
        return cleanup;
      }, [callback]);
    },
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const ReactLib = require('react');

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) => (
        <ReactLib.Fragment>{children}</ReactLib.Fragment>
      ),
      Screen: () => null,
    }),
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });
});

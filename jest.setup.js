/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaProvider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaView: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    SafeAreaConsumer: ({ children }) =>
      children({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('react-native-splash-screen', () => ({
  hide: jest.fn(),
  show: jest.fn(),
}));

jest.mock('react-native-sqlite-storage', () => {
  const db = {
    executeSql: jest.fn(async () => [
      {
        rows: {
          length: 0,
          item: () => ({}),
        },
        insertId: 1,
      },
    ]),
  };

  return {
    enablePromise: jest.fn(),
    openDatabase: jest.fn(async () => db),
  };
});

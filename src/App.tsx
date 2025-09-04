
/** @format */

import React from "react";
import { StatusBar } from "expo-status-bar";
import { MD3LightTheme as DefaultTheme, PaperProvider } from "react-native-paper";
import AppNavigator from "./navigation/AppNavigator";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0069B5',
    secondary: '#0c57aa',
    background: '#ffffff'
  },
};

const App = () => {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="auto" />
      <AppNavigator />
    </PaperProvider>
  );
};

export default App;

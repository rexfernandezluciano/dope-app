
/** @format */

import React from "react";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import AppNavigator from "./navigation/AppNavigator";

const App = () => {
  return (
    <PaperProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </PaperProvider>
  );
};

export default App;

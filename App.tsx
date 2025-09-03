import "react-native-gesture-handler";
import React, { useMemo } from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  Theme,
} from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";
import { DesignProvider, useDesign } from "./src/design/DesignProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const AppInner: React.FC = () => {
  const { mode } = useDesign();

  const navTheme: Theme = useMemo(
    () => (mode === "dark" ? DarkTheme : DefaultTheme),
    [mode]
  );

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DesignProvider>
          <AppInner />
        </DesignProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import 'react-native-gesture-handler';
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DesignProvider } from "./src/design/DesignProvider";
import AuthNavigator from "./src/navigation/AuthNavigator";
import RootNavigator from "./src/navigation/RootNavigator";

import { auth } from "./src/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setBooting(false);
    });
    return () => unsub();
  }, []);

  if (booting) return null;

  return (
    <DesignProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          {user ? <RootNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </SafeAreaProvider>
    </DesignProvider>
  );
}

// src/navigation/AuthNavigator.tsx
import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

export type AuthStackParamList = { Login: undefined; Register: undefined; };
const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator: React.FC = () => {
  const { theme: t } = useDesign();
  const headerCommon = {
    headerShown: true,
    headerTitleAlign: "center" as const,
    headerStyle: { backgroundColor: t.backgroundColor },
    headerTintColor: t.textColor,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };

  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} options={{ ...headerCommon, headerTitle: "Sign In" }} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={({ navigation }) => ({
          ...headerCommon,
          headerTitle: "Sign Up",
          headerLeft: () => (
            <Pressable onPress={navigation.goBack} hitSlop={10} style={{ paddingHorizontal: rs.ms(8) }}>
              <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;

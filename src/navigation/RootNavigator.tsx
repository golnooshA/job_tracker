import React from "react";
import { Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

import HomeScreen from "../screens/home/HomeScreen";
import CategoriesScreen from "../screens/category/CategoriesScreen";
import CategoryJobsScreen from "../screens/category/CategoryJobsScreen";
import RecentJobsScreen from "../screens/recent/RecentJobsScreen";
import SearchScreen from "../screens/search/SearchScreen";
import CompaniesScreen from "../screens/companies/CompaniesScreen";
import CompanyDetailScreen from "../screens/companies/CompanyDetailScreen";
import JobDetailScreen from "../screens/job/JobDetailScreen";
import WebViewScreen from "../screens/common/WebViewScreen";
import AboutScreen from "../screens/profile/AboutScreen";
import ProfileScreen from "../screens/profile/ProfileScreen";
import ThemeScreen from "../screens/profile/ThemeScreen";
import ActivityScreen from "../screens/activity/ActivityScreen";

/* ---------- Types ---------- */
export type HomeStackParamList = {
  Home: undefined;
  Categories: undefined;
  CategoryJobs: { key: string; label: string } | undefined;
  RecentJobs: undefined;
  JobDetail: any;
  WebView: { title?: string; url: string };
};

export type CompaniesStackParamList = {
  CompaniesList: undefined;
  CompanyDetail: { key: string } | undefined;
  JobDetail: any;
  WebView: { title?: string; url: string };
};

export type ActivityStackParamList = {
  ActivityHome: undefined;
  JobDetail: any;
  WebView: { title?: string; url: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Theme: undefined;
  About: undefined;
};

export type RootTabParamList = {
  HomeStack: undefined;
  Search: undefined;
  Companies: undefined;
  Activity: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CompStack = createNativeStackNavigator<CompaniesStackParamList>();
const ActivityStack = createNativeStackNavigator<ActivityStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

/* -------- Home Stack -------- */
const HomeStackNavigator: React.FC = () => (
  <HomeStack.Navigator screenOptions={{ headerShown: false }}>
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="Categories" component={CategoriesScreen} />
    <HomeStack.Screen name="CategoryJobs" component={CategoryJobsScreen} />
    <HomeStack.Screen name="RecentJobs" component={RecentJobsScreen} />
    <HomeStack.Screen name="JobDetail" component={JobDetailScreen} />
    <HomeStack.Screen name="WebView" component={WebViewScreen} />
  </HomeStack.Navigator>
);

/* -------- Companies Stack -------- */
const CompaniesStackNavigator: React.FC = () => (
  <CompStack.Navigator screenOptions={{ headerShown: false }}>
    <CompStack.Screen name="CompaniesList" component={CompaniesScreen} />
    <CompStack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
    <CompStack.Screen name="JobDetail" component={JobDetailScreen} />
    <CompStack.Screen name="WebView" component={WebViewScreen} />
  </CompStack.Navigator>
);

/* -------- Activity Stack -------- */
const ActivityStackNavigator: React.FC = () => (
  <ActivityStack.Navigator screenOptions={{ headerShown: false }}>
    <ActivityStack.Screen name="ActivityHome" component={ActivityScreen} />
    <ActivityStack.Screen name="JobDetail" component={JobDetailScreen} />
    <ActivityStack.Screen name="WebView" component={WebViewScreen} />
  </ActivityStack.Navigator>
);

/* -------- Profile Stack -------- */
const ProfileStackNavigator: React.FC = () => {
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
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="Theme"
        component={ThemeScreen}
        options={({ navigation }) => ({
          ...headerCommon,
          headerTitle: "Theme",
          headerLeft: () => (
            <Pressable
              onPress={navigation.goBack}
              hitSlop={10}
              style={{ paddingHorizontal: rs.ms(8) }}
            >
              <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
            </Pressable>
          ),
        })}
      />
      <ProfileStack.Screen
        name="About"
        component={AboutScreen}
        options={({ navigation }) => ({
          ...headerCommon,
          headerTitle: "About",
          headerLeft: () => (
            <Pressable
              onPress={navigation.goBack}
              hitSlop={10}
              style={{ paddingHorizontal: rs.ms(8) }}
            >
              <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
            </Pressable>
          ),
        })}
      />
    </ProfileStack.Navigator>
  );
};

/* -------- Tab Icons -------- */
function getTabIcon(
  routeName: keyof RootTabParamList,
  size: number,
  color: string
) {
  switch (routeName) {
    case "HomeStack":
      return <Ionicons name="home" size={size} color={color} />;
    case "Search":
      return <Ionicons name="search" size={size} color={color} />;
    case "Companies":
      return <MaterialIcons name="apartment" size={size} color={color} />;
    case "Activity":
      return <Ionicons name="bar-chart" size={size} color={color} />;
    case "Profile":
    default:
      return <Ionicons name="person" size={size} color={color} />;
  }
}

/* -------- Root Tabs -------- */
export default function RootNavigator() {
  const insets = useSafeAreaInsets();
  const { theme: t } = useDesign();

  return (
    <Tab.Navigator
      initialRouteName="HomeStack"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: t.primaryColor,
        tabBarInactiveTintColor: t.subtextColor,
        tabBarLabelStyle: { fontSize: t.small },
        tabBarStyle: {
          backgroundColor: t.backgroundColor,
          height: rs.ms(50) + insets.bottom,
          paddingBottom: Math.max(rs.ms(8), insets.bottom),
          paddingTop: rs.ms(8),
          borderTopLeftRadius: rs.ms(20),
          borderTopRightRadius: rs.ms(20),
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarIcon: ({ color, size }) =>
          getTabIcon(route.name as keyof RootTabParamList, size, color),
      })}
    >
      <Tab.Screen name="HomeStack" component={HomeStackNavigator} options={{ title: "Home" }} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Companies" component={CompaniesStackNavigator} />
      <Tab.Screen name="Activity" component={ActivityStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

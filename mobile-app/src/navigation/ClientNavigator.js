import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

// Import Client screens
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import ProjectsScreen from '../screens/client/projects/ProjectsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Import Project footer tabs (nested navigator)
import ProjectFooterTabs from '../screens/client/projects/ProjectDetailsFooter';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- Dashboard Stack ---
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClientDashboard" component={ClientDashboardScreen} />
  </Stack.Navigator>
);

// --- Projects Stack ---
const ProjectsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProjectsList" component={ProjectsScreen} />
    {/* Nested footer tabs for project details */}
    <Stack.Screen name="ProjectDetails" component={ProjectFooterTabs} />
  </Stack.Navigator>
);

// --- Profile Stack ---
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileDetails" component={ProfileScreen} />
  </Stack.Navigator>
);

// --- Main Tabs ---
const ClientNavigator = () => {
  return (
    <Tab.Navigator
      id="rootTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#9C27B0',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Projects':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />

      <Tab.Screen
        name="Projects"
        component={ProjectsStack}
        options={({ route }) => {
          // Find which child route is active
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProjectsList';

          // Hide parent bottom tab bar when in ProjectDetails
          if (routeName === 'ProjectDetails') {
            return {
              tabBarStyle: { display: 'none' },
            };
          }
          return {};
        }}
      />

      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

export default ClientNavigator;

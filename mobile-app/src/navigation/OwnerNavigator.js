import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

// Owner Screens
import OwnerDashboardScreen from '../screens/owner/OwnerDashboardScreen';

// Placeholder screens for future implementation
const EmployeeManagementScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Employee Management</Text></View>;
const ClientOverviewScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Client Overview</Text></View>;
const FinancialReportsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Financial Reports</Text></View>;
const OwnerProfileScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Owner Profile</Text></View>;
const ProjectApprovalScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Project Approval</Text></View>;
const SettingsScreen = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Settings</Text></View>;

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/* ===========================
   INDIVIDUAL STACKS
=========================== */

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
    <Stack.Screen name="ProjectApproval" component={ProjectApprovalScreen} />
  </Stack.Navigator>
);

const EmployeesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EmployeeManagement" component={EmployeeManagementScreen} />
  </Stack.Navigator>
);

const ClientsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClientOverview" component={ClientOverviewScreen} />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FinancialReports" component={FinancialReportsScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="OwnerProfile" component={OwnerProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

/* ===========================
   MAIN TAB NAVIGATOR
=========================== */

const OwnerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Employees':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Clients':
              iconName = focused ? 'briefcase' : 'briefcase-outline';
              break;
            case 'Reports':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary[500],
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: theme.colors.background.primary,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 6,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Employees"
        component={EmployeesStack}
        options={{ tabBarLabel: 'Employees' }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsStack}
        options={{ tabBarLabel: 'Clients' }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsStack}
        options={{ tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default OwnerNavigator;
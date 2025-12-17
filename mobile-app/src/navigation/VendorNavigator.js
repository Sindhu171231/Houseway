import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

// Vendor Screens
import VendorDashboardScreen from '../screens/vendor/VendorDashboardScreen';
import MaterialRequestsScreen from '../screens/vendor/screens/MaterialRequests';
import QuotationManagementScreen from '../screens/vendor/screens/QuotationManagement';
import PaymentsInvoicesScreen from '../screens/vendor/screens/PaymentsInvoices';
import MediaGalleryScreen from '../screens/vendor/screens/MediaGallery';
import NotificationsScreen from '../screens/vendor/screens/NotificationScreen';
import VendorProfileScreen from '../screens/vendor/screens/VendorProfile';
import WorkUpdatesScreen from '../screens/vendor/screens/WorkUpdates';
import NegotiationChatScreen from '../screens/vendor/screens/NegotiationChat';
import UploadWorkStatusScreen from '../screens/vendor/screens/UploadWorkStatus';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/* ===========================
   INDIVIDUAL STACKS
=========================== */

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VendorDashboard" component={VendorDashboardScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
  </Stack.Navigator>
);

const MaterialsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MaterialRequests" component={MaterialRequestsScreen} />
    <Stack.Screen name="QuotationManagement" component={QuotationManagementScreen} />
    <Stack.Screen name="NegotiationChat" component={NegotiationChatScreen} />
    <Stack.Screen name="UploadWorkStatus" component={UploadWorkStatusScreen} />
  </Stack.Navigator>
);

const PaymentsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PaymentsInvoices" component={PaymentsInvoicesScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="VendorProfile" component={VendorProfileScreen} />
    <Stack.Screen name="MediaGallery" component={MediaGalleryScreen} />
    <Stack.Screen name="WorkUpdates" component={WorkUpdatesScreen} />
    <Stack.Screen name="UploadWorkStatus" component={UploadWorkStatusScreen} />
  </Stack.Navigator>
);

/* ===========================
   MAIN TAB NAVIGATOR
=========================== */

const VendorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Materials':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'Payments':
              iconName = focused ? 'card' : 'card-outline';
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
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="Materials"
        component={MaterialsStack}
        options={{ tabBarLabel: 'Materials' }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentsStack}
        options={{ tabBarLabel: 'Invoices' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default VendorNavigator;
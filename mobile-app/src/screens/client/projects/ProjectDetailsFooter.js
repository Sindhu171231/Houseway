import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import MediaScreen from './MediaScreen';
import PaymentsScreen from './PaymentsScreen';
import CatalogScreen from './CatalogScreen';
import InspirationScreen from './InspirationScreen';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // optional for icons
import ProjectOverview from './OverviewPage';
const Tab = createBottomTabNavigator();

export default function ProjectFooterTabs() {
  const route = useRoute();
  const { projectId } = route.params || {};
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: 'rgba(44,62,80,0.95)', // match footer bg
        },
        headerTintColor: '#fff',
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
        headerTitleAlign: 'center',

        // 👇 Replace text button with a styled home icon
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('Dashboard')}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="home-outline" size={22} color="#d4bda5" />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: 'rgba(44,62,80,0.9)', // matches var(--secondary-color)/90
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
        },
        tabBarActiveTintColor: '#d4bda5', // primary color
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tab.Screen 
        name="Overview" 
        component={ProjectOverview} 
        initialParams={{ projectId }}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Media" 
        component={MediaScreen} 
        initialParams={{ projectId }}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="images-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Payments" 
        component={PaymentsScreen} 
        initialParams={{ projectId }}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Catalog" 
        component={CatalogScreen} 
        initialParams={{ projectId }}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />
        }}
      />
      <Tab.Screen 
        name="Inspiration" 
        component={InspirationScreen} 
        initialParams={{ projectId }}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} />
        }}
      />
    </Tab.Navigator>
  );
}
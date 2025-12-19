import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import LoginSelectionScreen from '../screens/employee/LoginSelectionScreen';
import EmployeeDashboardScreen from '../screens/employee/EmployeeDashboardScreen';

import CheckInScreen from '../screens/employee/CheckInScreen';
import SettingsScreen from '../screens/employee/SettingsScreen';
import ProfileScreen from '../screens/employee/ProfileScreen';

// Import client management screens
import HomeDashboardScreen from '../screens/clientManagement/HomeDashboardScreen';
import ClientsListScreen from '../screens/clientManagement/ClientsListScreen';
import ClientProfileScreen from '../screens/clientManagement/ClientProfileScreen';
import ProjectListScreen from '../screens/clientManagement/ProjectListScreen';
import ProjectDetailScreen from '../screens/clientManagement/ProjectDetailScreen';
import AddClientScreen from '../screens/clientManagement/AddClientScreen';
import CreateProjectScreen from '../screens/client/projects/CreateProjectScreen';
import CreateInvoiceScreen from '../screens/clientManagement/CreateInvoiceScreen';
import InvoiceDetailScreen from '../screens/clientManagement/InvoiceDetailScreen';
import ViewInvoicesScreen from '../screens/clientManagement/ViewInvoicesScreen';
import EditClientScreen from '../screens/clientManagement/EditClientScreen';

const Stack = createStackNavigator();

const EmployeeNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="CheckIn"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyle: { backgroundColor: '#F5F5F0' },
      }}
    >
      {/* Check-In Screen - First screen after login */}
      <Stack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{
          title: 'Check In',
          gestureEnabled: false,
        }}
      />


      {/* Original Employee Dashboard */}
      <Stack.Screen
        name="EmployeeDashboard"
        component={EmployeeDashboardScreen}
        options={{
          title: 'Project Dashboard',
        }}
      />


      {/* Client Management Dashboard */}
      <Stack.Screen
        name="HomeDashboard"
        component={HomeDashboardScreen}
        options={{
          title: 'Client Management',
          gestureEnabled: false, // Prevent going back to selection
        }}
      />

      {/* Client Management Screens */}
      <Stack.Screen
        name="ClientsList"
        component={ClientsListScreen}
        options={{
          title: 'Clients',
        }}
      />

      <Stack.Screen
        name="ClientProfile"
        component={ClientProfileScreen}
        options={{
          title: 'Client Profile',
        }}
      />

      <Stack.Screen
        name="AddClient"
        component={AddClientScreen}
        options={{
          title: 'Add Client',
        }}
      />

      <Stack.Screen
        name="EditClient"
        component={EditClientScreen}
        options={{
          title: 'Edit Client',
        }}
      />

      <Stack.Screen
        name="ProjectList"
        component={ProjectListScreen}
        options={{
          title: 'Projects',
        }}
      />

      <Stack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{
          title: 'Project Details',
        }}
      />

      {/* TODO: Add remaining client management screens when implemented */}
      <Stack.Screen
        name="AddTimelineEvent"
        component={() => null}
        options={{
          title: 'Add Timeline Event',
        }}
      />

      <Stack.Screen
        name="UploadMedia"
        component={() => null}
        options={{
          title: 'Upload Media',
        }}
      />

      <Stack.Screen
        name="CreateInvoice"
        component={CreateInvoiceScreen}
        options={{
          title: 'Create Invoice',
        }}
      />

      <Stack.Screen
        name="ViewInvoice"
        component={InvoiceDetailScreen}
        options={{
          title: 'Invoice Details',
        }}
      />

      <Stack.Screen
        name="ViewInvoices"
        component={ViewInvoicesScreen}
        options={{
          title: 'Project Invoices',
        }}
      />

      <Stack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{
          title: 'Create Project',
        }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />

      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Stack.Navigator>
  );
};

export default EmployeeNavigator;
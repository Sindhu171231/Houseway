import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI, usersAPI, materialRequestsAPI, quotationsAPI, dashboardAPI } from '../../utils/api';

const OwnerDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    projects: { total: 0, active: 0, completed: 0 },
    users: { total: 0, employees: 0, vendors: 0, clients: 0 },
    materialRequests: { total: 0, pending: 0, approved: 0 },
    quotations: { total: 0, pending: 0, approved: 0 },
    recentActivities: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load dashboard statistics and recent activities
      const [projectsRes, usersRes, materialRequestsRes, quotationsRes, activitiesRes] = await Promise.allSettled([
        projectsAPI.getProjects({ limit: 100 }),
        usersAPI.getUsers({ limit: 100 }),
        materialRequestsAPI.getMaterialRequests({ limit: 100 }),
        quotationsAPI.getQuotations({ limit: 100 }),
        dashboardAPI.getRecentActivity(5), // Get last 5 activities
      ]);

      // Process projects data
      if (projectsRes.status === 'fulfilled' && projectsRes.value.success) {
        const projects = projectsRes.value.data.projects;
        setDashboardData(prev => ({
          ...prev,
          projects: {
            total: projects.length,
            active: projects.filter(p => ['planning', 'in-progress'].includes(p.status)).length,
            completed: projects.filter(p => p.status === 'completed').length,
          },
        }));
      }

      // Process users data
      if (usersRes.status === 'fulfilled' && usersRes.value.success) {
        const users = usersRes.value.data.users;
        setDashboardData(prev => ({
          ...prev,
          users: {
            total: users.length,
            employees: users.filter(u => u.role === 'employee').length,
            vendors: users.filter(u => u.role === 'vendor').length,
            clients: users.filter(u => u.role === 'client').length,
          },
        }));
      }

      // Process material requests data
      if (materialRequestsRes.status === 'fulfilled' && materialRequestsRes.value.success) {
        const requests = materialRequestsRes.value.data.materialRequests;
        setDashboardData(prev => ({
          ...prev,
          materialRequests: {
            total: requests.length,
            pending: requests.filter(r => r.status === 'pending').length,
            approved: requests.filter(r => r.status === 'approved').length,
          },
        }));
      }

      // Process quotations data
      if (quotationsRes.status === 'fulfilled' && quotationsRes.value.success) {
        const quotations = quotationsRes.value.data.quotations;
        setDashboardData(prev => ({
          ...prev,
          quotations: {
            total: quotations.length,
            pending: quotations.filter(q => ['submitted', 'under_review'].includes(q.status)).length,
            approved: quotations.filter(q => q.status === 'approved').length,
          },
        }));
      }

      // Process recent activities
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.success) {
        setDashboardData(prev => ({
          ...prev,
          recentActivities: activitiesRes.value.data.activities || []
        }));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleLogout = () => {
    // For web, use window.confirm; for mobile, use Alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const performLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      if (Platform.OS === 'web') {
        alert('Failed to logout. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to logout. Please try again.');
      }
    }
  };

  const StatCard = ({ title, value, subtitle, color, onPress }) => (
    <TouchableOpacity style={{...styles.statCard, borderLeftColor: color}} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'project': return 'folder';
        case 'materialRequest': return 'package';
        case 'quotation': return 'file-text';
        default: return 'bell';
      }
    };

    return (
      <View style={styles.activityItem}>
        <View style={styles.activityIconContainer}>
          <Feather name={getActivityIcon(activity.type)} size={20} color="#666" />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle} numberOfLines={1}>{activity.message || activity.title}</Text>
          <Text style={styles.activityTime}>{activity.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.roleText}>Owner Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Projects"
            value={dashboardData.projects.total}
            subtitle={`${dashboardData.projects.active} active`}
            color="#2196F3"
            onPress={() => navigation.navigate('Projects')}
          />
          
          <StatCard
            title="Total Users"
            value={dashboardData.users.total}
            subtitle={`${dashboardData.users.employees} employees`}
            color="#4CAF50"
            onPress={() => navigation.navigate('Users')}
          />
          
          <StatCard
            title="Material Requests"
            value={dashboardData.materialRequests.total}
            subtitle={`${dashboardData.materialRequests.pending} pending`}
            color="#FF9800"
            onPress={() => navigation.navigate('Materials')}
          />
          
          <StatCard
            title="Quotations"
            value={dashboardData.quotations.total}
            subtitle={`${dashboardData.quotations.pending} pending review`}
            color="#9C27B0"
            onPress={() => navigation.navigate('Quotations')}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Projects', { screen: 'CreateProject' })}
          >
            <Text style={styles.actionIcon}>➕</Text>
            <Text style={styles.actionTitle}>New Project</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Users')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Manage Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Materials')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionTitle}>Review Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Quotations')}
          >
            <Text style={styles.actionIcon}>📄</Text>
            <Text style={styles.actionTitle}>Review Quotations</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {dashboardData.recentActivities.length > 0 ? (
            dashboardData.recentActivities.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))
          ) : (
            <Text style={styles.activityText}>
              No recent activities. System events will appear here.
            </Text>
          )}
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefdfb',
  },
  header: {
    backgroundColor: '#1e3a8a',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#fefdfb',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 2,
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },

});

export default OwnerDashboardScreen;

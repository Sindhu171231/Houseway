import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// Import components
import WaveHeader from '../../components/clientManagement/WaveHeader';
import { clientsAPI } from '../../utils/api';

// Yellow/Black Theme
const COLORS = {
  primary: '#FFD700',
  background: '#0D0D0D',
  cardBg: '#1A1A1A',
  cardBorder: 'rgba(255, 215, 0, 0.15)',
  text: '#FFFFFF',
  textMuted: '#888888',
  textDim: '#666666',
};

const HomeDashboardScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalClients: 0,
    activeProjects: 0,
    recentInvoices: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const statsResponse = await clientsAPI.getDashboardStats();
      if (statsResponse.success) {
        setDashboardStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const tiles = [
    {
      id: 'clients',
      title: 'View Clients',
      subtitle: `${dashboardStats.totalClients} clients`,
      icon: 'users',
      route: 'ClientsList',
    },
    {
      id: 'add_client',
      title: 'Add Client',
      subtitle: 'New client',
      icon: 'user-plus',
      route: 'AddClient',
    },
    {
      id: 'projects',
      title: 'View Projects',
      subtitle: `${dashboardStats.activeProjects} active`,
      icon: 'briefcase',
      route: 'ProjectList',
    },
    {
      id: 'add_project',
      title: 'Add Project',
      subtitle: 'Create new',
      icon: 'plus-square',
      route: 'CreateProject',
    },
    {
      id: 'invoices',
      title: 'Invoices',
      subtitle: 'View all',
      icon: 'file-text',
      route: 'ViewInvoices',
    },
    {
      id: 'create_invoice',
      title: 'Create Invoice',
      subtitle: 'Generate new',
      icon: 'plus-circle',
      route: 'CreateInvoice',
    },
  ];

  const DashboardTile = ({ tile }) => (
    <TouchableOpacity
      style={styles.tile}
      activeOpacity={0.8}
      onPress={() => navigation.navigate(tile.route)}
    >
      <View style={styles.tileContent}>
        <View style={styles.tileIconContainer}>
          <Feather name={tile.icon} size={28} color={COLORS.background} />
        </View>
        <Text style={styles.tileTitle}>{tile.title}</Text>
        <Text style={styles.tileSubtitle}>{tile.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <WaveHeader
          title="Client Management"
          subtitle="Manage clients, projects & invoices"
          height={180}
          showBackButton
          backButtonPress={() => navigation.goBack()}
        />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search clients, projects..."
              placeholderTextColor={COLORS.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardStats.totalClients}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardStats.activeProjects}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboardStats.recentInvoices || 0}</Text>
            <Text style={styles.statLabel}>Invoices</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.tilesGrid}>
          {tiles.map((tile) => (
            <DashboardTile key={tile.id} tile={tile} />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  tile: {
    width: (width - 44) / 2,
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tileContent: {
    alignItems: 'center',
  },
  tileIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  tileSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default HomeDashboardScreen;
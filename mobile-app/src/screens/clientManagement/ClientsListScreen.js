import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Animated,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

// Import components
import StatusRibbonCard from '../../components/clientManagement/StatusRibbonCard';
import WaveHeader from '../../components/clientManagement/WaveHeader';
import { clientsAPI } from '../../utils/api';

const { width } = Dimensions.get('window');

const ClientsListScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const filters = ['All', 'Active', 'At Risk', 'Pending', 'Inactive'];

  useEffect(() => {
    if (isAuthenticated && user) {
      loadClients();
      animateIn();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    filterClients();
  }, [searchQuery, activeFilter, clients]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadClients = async (isRefresh = false) => {
    try {
      // Check if user is authenticated before making API call
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping clients load');
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
      } else {
        setLoading(true);
      }

      const currentPage = isRefresh ? 1 : page;
      const statusFilter = activeFilter === 'All' ? null : activeFilter.toLowerCase().replace(' ', '-');

      const response = await clientsAPI.getClients({
        page: currentPage,
        limit: 20,
        status: statusFilter,
        search: searchQuery || undefined,
      });

      if (response.success) {
        const newClients = response.data.clients;

        if (isRefresh) {
          setClients(newClients);
        } else {
          setClients(prev => [...prev, ...newClients]);
        }

        setHasMore(response.data.pagination.current < response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (activeFilter !== 'All') {
      const statusMap = {
        'Active': 'active',
        'At Risk': 'at-risk',
        'Pending': 'pending',
        'Inactive': 'inactive'
      };
      const statusKey = statusMap[activeFilter];
      filtered = filtered.filter(client =>
        client.clientDetails?.clientStatus === statusKey
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(client =>
        client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredClients(filtered);
  };

  const handleFilterPress = (filter) => {
    if (activeFilter !== filter) {
      setActiveFilter(filter);
      setPage(1);
      setHasMore(true);
      loadClients(true);
    }
  };

  const handleClientPress = (client) => {
    navigation.navigate('ClientProfile', { clientId: client._id });
  };

  const handleRefresh = () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping refresh');
      return;
    }
    loadClients(true);
  };

  const handleLoadMore = () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping load more');
      return;
    }
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      loadClients();
    }
  };

  const getStatusValue = (client) => {
    const status = client.clientDetails?.clientStatus || 'active';
    return status === 'at-risk' ? 'at-risk' : status;
  };

  const renderClientCard = ({ item, index }) => {
    const scaleValue = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 3,
        tension: 40,
      }).start();
    };

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleValue }
            ],
          }
        ]}
      >
        <StatusRibbonCard
          title={`${item.firstName} ${item.lastName}`}
          subtitle={item.email}
          avatar={item.profileImage}
          status={getStatusValue(item)}
          onPress={() => handleClientPress(item)}
          contactInfo={{
            email: item.email,
            phone: item.phone,
          }}
          tags={item.clientDetails?.tags || []}
          rightComponent={
            <TouchableOpacity
              style={styles.viewButton}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => handleClientPress(item)}
            >
              <Text style={styles.viewButtonText}>View</Text>
              <Feather name="arrow-right" size={16} color="#3E60D8" />
            </TouchableOpacity>
          }
        />
      </Animated.View>
    );
  };

  const renderFilterChip = (filter) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterChip,
        activeFilter === filter && styles.activeFilterChip,
      ]}
      onPress={() => handleFilterPress(filter)}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.filterChipText,
          activeFilter === filter && styles.activeFilterChipText,
        ]}
      >
        {filter}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      {/* Wave Header */}
      <WaveHeader
        title="Clients"
        subtitle={`${filteredClients.length} clients found`}
        height={180}
        showBackButton
        backButtonPress={() => navigation.goBack()}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#7487C1" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor="#7487C1"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#7487C1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map(renderFilterChip)}
        </ScrollView>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="users" size={64} color="#C9B89A" />
      <Text style={styles.emptyStateTitle}>No clients found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || activeFilter !== 'All'
          ? 'Try adjusting your filters or search query'
          : 'Start by adding your first client'
        }
      </Text>
      {!searchQuery && activeFilter === 'All' && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateClient')}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Client</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) {
      return (
        <Text style={styles.footerText}>You've reached the end</Text>
      );
    }

    if (loading) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color="#3E60D8" />
          <Text style={styles.footerLoadingText}>Loading more clients...</Text>
        </View>
      );
    }

    return null;
  };

  if (loading && clients.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <WaveHeader
          title="Clients"
          subtitle="Loading..."
          height={180}
          showBackButton
          backButtonPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#3E60D8" />
          <Text style={styles.loadingText}>Loading clients...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredClients}
        renderItem={renderClientCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmptyState()}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF7EE',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FBF7EE',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -180, // Account for header
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7487C1',
    fontWeight: '500',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginTop: -30,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(62, 96, 216, 0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1B2540',
    fontWeight: '500',
  },
  filtersContainer: {
    marginTop: 24,
  },
  filtersScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0F4F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeFilterChip: {
    backgroundColor: '#3E60D8',
    borderColor: '#3E60D8',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7487C1',
  },
  activeFilterChipText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  cardContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E60D8',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B2540',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7487C1',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E60D8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#3E60D8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footerText: {
    textAlign: 'center',
    padding: 20,
    color: '#7487C1',
    fontSize: 14,
    fontWeight: '500',
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 8,
  },
  footerLoadingText: {
    color: '#7487C1',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ClientsListScreen;
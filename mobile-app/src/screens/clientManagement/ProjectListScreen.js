import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import WaveHeader from '../../components/clientManagement/WaveHeader';
import { projectsAPI } from '../../utils/api';

const { width } = Dimensions.get('window');

// Yellow/Black Theme
const COLORS = {
  primary: '#FFD700',
  background: '#0D0D0D',
  cardBg: '#1A1A1A',
  cardBorder: 'rgba(255, 215, 0, 0.15)',
  text: '#FFFFFF',
  textMuted: '#888888',
  success: '#00C853',
  warning: '#FFB300',
  danger: '#FF5252',
};

const ProjectListScreen = ({ navigation, route }) => {
  const { clientId } = route.params || {};
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProjects();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, clientId]);

  const loadProjects = async () => {
    try {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      let response;
      if (clientId) {
        response = await projectsAPI.getClientProjects(clientId);
      } else {
        response = await projectsAPI.getProjects({ assignedTo: user._id });
      }

      if (response.success) {
        setProjects(response.data.projects || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  const handleProjectPress = (project) => {
    navigation.navigate('ProjectDetail', { projectId: project._id });
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: COLORS.warning,
      'in-progress': COLORS.primary,
      'on-hold': COLORS.textMuted,
      completed: COLORS.success,
      cancelled: COLORS.danger,
    };
    return colors[status] || COLORS.textMuted;
  };

  const renderProjectCard = ({ item }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => handleProjectPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.projectContent}>
        <View style={styles.projectHeader}>
          <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status?.replace('-', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.projectDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>

        {/* Project info */}
        <View style={styles.projectInfo}>
          <View style={styles.infoItem}>
            <Feather name="calendar" size={14} color={COLORS.textMuted} />
            <Text style={styles.infoText}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {item.budget && (
            <View style={styles.infoItem}>
              <Feather name="dollar-sign" size={14} color={COLORS.primary} />
              <Text style={[styles.infoText, { color: COLORS.primary }]}>
                ${(item.budget.estimated || 0).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Client name */}
        {item.client && (
          <View style={styles.clientRow}>
            <Feather name="user" size={12} color={COLORS.textMuted} />
            <Text style={styles.clientName}>
              {item.client.firstName} {item.client.lastName}
            </Text>
          </View>
        )}
      </View>

      <Feather name="chevron-right" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );

  if (loading && projects.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <WaveHeader
          title="Projects"
          subtitle="Loading..."
          height={180}
          showBackButton
          backButtonPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProjectCard}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <WaveHeader
            title={clientId ? "Client Projects" : "All Projects"}
            subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
            height={180}
            showBackButton
            backButtonPress={() => navigation.goBack()}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="briefcase" size={64} color={COLORS.textMuted} />
            <Text style={styles.emptyStateTitle}>No projects found</Text>
            <Text style={styles.emptyStateText}>
              {clientId ? 'This client has no projects yet' : 'No projects assigned to you'}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateProject')}
            >
              <Feather name="plus" size={20} color={COLORS.background} />
              <Text style={styles.addButtonText}>Create Project</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Add Client Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => navigation.navigate('AddClient')}
        activeOpacity={0.8}
      >
        <Feather name="user-plus" size={24} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -180,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 20,
  },
  projectCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  projectContent: {
    flex: 1,
    marginRight: 12,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  projectDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  projectInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clientName: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.background,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});

export default ProjectListScreen;
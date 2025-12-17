import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI } from '../../../utils/api';
// Removed problematic animation components
import ModernCard, { ProjectCard } from '../../../components/ModernCard';
import ModernHeader, { ProjectsHeader } from '../../../components/ModernHeader';
import SearchAndFilter, { QuickFilters } from '../../../components/SearchAndFilter';
import theme from '../../../styles/theme';

const ProjectsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All Projects' },
    { key: 'planning', label: 'Planning' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'on-hold', label: 'On Hold' },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, selectedFilter]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);

      let params = { limit: 50 };

      // Filter based on user role
      if (user.role === 'client') {
        params.client = user._id;
      } else if (user.role === 'employee') {
        params.assignedTo = user._id;
      }

      const response = await projectsAPI.getProjects(params);

      if (response.success) {
        setProjects(response.data.projects || []);
      } else {
        Alert.alert('Error', 'Failed to load projects');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(project => project.status === selectedFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        (project.location?.city && project.location?.city.toLowerCase().includes(query))
      );
    }

    setFilteredProjects(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const getStatusColor = (status) => {
    return theme.statusColors.project[status] || theme.statusColors.project.planning;
  };

  const ProjectCard = ({ project }) => (
    <ModernCard
      variant="outlined"
      style={{...styles.projectCard, borderTopColor: getStatusColor(project.status), borderTopWidth: 4}}
      onPress={() => navigation.navigate('ProjectDetails', { projectId: project._id })}
    >
      <View style={styles.cardContent}>
        <View style={styles.projectIdHeader}>
          <Text style={styles.projectIdText}>
            Project ID: {project.projectId || project._id.slice(-8).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardHeader}>
          <Text style={styles.projectTitle} numberOfLines={2}>
            {project.title}
          </Text>
          <View style={{...styles.statusBadge, backgroundColor: 'rgba(255,255,255,0.2)'}}>
            <Text style={styles.statusText}>
              {project.status.replace('-', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.projectDescription} numberOfLines={3}>
          {project.description}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.progressSection}>
            <View style={styles.simpleProgressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={{
                    ...styles.progressFill,
                    width: `${project.progress?.percentage || 0}%`,
                    backgroundColor: getStatusColor(project.status)
                  }}
                />
              </View>
              <Text style={styles.progressPercentage}>
                {project.progress?.percentage || 0}%
              </Text>
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {project.progress?.percentage || 0}% Complete
              </Text>
              <Text style={styles.locationText}>
                {project.location?.city || 'Location not set'}
              </Text>
            </View>
          </View>

          <View style={styles.budgetSection}>
            <Text style={styles.budgetLabel}>Budget</Text>
            <Text style={styles.budgetAmount}>
              ${(project.budget?.estimated || 0).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </ModernCard>
  );

  const FilterButton = ({ filter }) => (
    <TouchableOpacity
      style={{
        ...styles.filterButton,
        ...(selectedFilter === filter.key && styles.activeFilterButton)
      }}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <Text style={{
        ...styles.filterButtonText,
        ...(selectedFilter === filter.key && styles.activeFilterButtonText)
      }}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>No Projects Found</Text>
      <Text style={styles.emptyStateDescription}>
        {searchQuery ? 'Try adjusting your search criteria' : 'No projects match the selected filter'}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  const quickFilters = [
    { key: 'all', label: 'All', count: projects.length, icon: '📋' },
    { key: 'planning', label: 'Planning', count: projects.filter(p => p.status === 'planning').length, icon: '📝' },
    { key: 'in-progress', label: 'Active', count: projects.filter(p => p.status === 'in-progress').length, icon: '🔄' },
    { key: 'completed', label: 'Done', count: projects.filter(p => p.status === 'completed').length, icon: '✅' },
    { key: 'on-hold', label: 'On Hold', count: projects.filter(p => p.status === 'on-hold').length, icon: '⏸️' },
  ];

  return (
    <View style={styles.container}>
      {/* Projects List */}
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={
          <>
            {/* Modern Header */}
            <ProjectsHeader
              onAddPress={() => navigation.navigate('CreateProject')}
              onSearchPress={() => {/* Handle search */}}
            />

            {/* Search and Filters */}
            <SearchAndFilter
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              filters={quickFilters}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
              placeholder="Search projects..."
            />
          </>
        }
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item._id })}
          />
        )}
        contentContainerStyle={styles.projectsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <ModernCard variant="outlined" style={styles.emptyCard}>
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏗️</Text>
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery ? 'Try adjusting your search criteria' : 'Create your first project to get started'}
              </Text>
              {(user.role === 'owner' || user.role === 'employee') && (
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('CreateProject')}
                >
                  <Text style={styles.emptyButtonText}>Create Project</Text>
                </TouchableOpacity>
              )}
            </View>
          </ModernCard>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  projectsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Empty State
  emptyCard: {
    marginVertical: 40,
    marginHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Simple Progress Bar Styles
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  simpleProgressContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    width: 40,
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
});

export default ProjectsScreen;
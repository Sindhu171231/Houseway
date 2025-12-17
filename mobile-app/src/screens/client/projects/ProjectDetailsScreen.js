import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { projectsAPI } from '../../../utils/api';
import theme from '../../../styles/theme';
import { StandardCard } from '../../../components/StandardCard';
// Removed problematic animation components and gradients
// Removed animation imports to prevent CSS errors

const { width: screenWidth } = Dimensions.get('window');

const ProjectDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { projectId } = route.params || {};

  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Removed all animation values to prevent CSS errors

  useEffect(() => {
    if (projectId) {
      loadProjectDetails();
    }
  }, [projectId]);

  const loadProjectDetails = async () => {
    try {
      setIsLoading(true);
      const response = await projectsAPI.getProjectById(projectId);
      if (response.success) {
        setProject(response.data.project);
      }
    } catch (error) {
      console.error('Error loading project details:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProjectDetails();
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    // Animation removed for web compatibility
  };

  const getStatusColor = (status) => {
    return theme.statusColors.project[status] || theme.colors.primary[500];
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={getStatusColor(project.status)} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: getStatusColor(project.status) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle} numberOfLines={2}>
              {project.title}
            </Text>
            <Text style={styles.headerSubtitle}>
              Project Details
            </Text>
          </View>

          <TouchableOpacity style={styles.moreButton}>
            <Text style={styles.moreButtonText}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 3D Project Viewer - Replaced with placeholder */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3D Visualization</Text>
            <TouchableOpacity
              style={styles.viewer3D}
              onPress={() => {
                console.log('Open full-screen 3D viewer');
              }}
            >
              <View style={styles.viewer3DPlaceholder}>
                <Text style={styles.viewer3DIcon}>🏗️</Text>
                <Text style={styles.viewer3DText}>3D View</Text>
                <Text style={styles.viewer3DSubtext}>Tap to view project in 3D</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Project Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Progress</Text>
            <StandardCard variant="accent" style={styles.progressCard}>
              <View style={styles.progressContent}>
                <View style={styles.progressHeader}>
                  <View>
                    <Text style={styles.progressTitle}>Overall Progress</Text>
                    <Text style={styles.progressSubtitle}>
                      {project?.progress?.percentage || 0}% Complete
                    </Text>
                  </View>
                  <View style={styles.progressCircle}>
                    <View style={styles.progressBackground}>
                      <View
                        style={{
                          ...styles.progressFill,
                          width: `${project?.progress?.percentage || 0}%`,
                          backgroundColor: theme.statusColors.project[project?.status] || theme.colors.primary[500]
                        }}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {project?.progress?.percentage || 0}%
                    </Text>
                  </View>
                </View>
              </View>
            </StandardCard>
          </View>

          {/* Project Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Information</Text>
            <StandardCard variant="secondary" style={styles.infoCard}>
              <View style={styles.infoContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <View style={{...styles.statusBadge, backgroundColor: getStatusColor(project?.status)}}>
                    <Text style={styles.statusText}>
                      {project?.status?.replace('-', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Budget:</Text>
                  <Text style={styles.infoValue}>
                    ${project?.budget?.estimated?.toLocaleString() || 'Not specified'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Location:</Text>
                  <Text style={styles.infoValue}>
                    {project?.location?.address || 'Not specified'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Start Date:</Text>
                  <Text style={styles.infoValue}>
                    {project?.timeline?.startDate 
                      ? new Date(project.timeline.startDate).toLocaleDateString() 
                      : 'Not specified'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Expected End Date:</Text>
                  <Text style={styles.infoValue}>
                    {project?.timeline?.expectedEndDate 
                      ? new Date(project.timeline.expectedEndDate).toLocaleDateString() 
                      : 'Not specified'}
                  </Text>
                </View>
              </View>
            </StandardCard>
          </View>

          {/* Description */}
          {project?.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <StandardCard variant="secondary" style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{project.description}</Text>
              </StandardCard>
            </View>
          )}

          {/* Assigned Team */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assigned Team</Text>
            <StandardCard variant="secondary" style={styles.infoCard}>
              <View style={styles.infoContent}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Client:</Text>
                  <Text style={styles.infoValue}>
                    {project?.client?.firstName} {project?.client?.lastName}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Assigned Employees:</Text>
                  <Text style={styles.infoValue}>
                    {project?.assignedEmployees?.length || 0} team members
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Assigned Vendors:</Text>
                  <Text style={styles.infoValue}>
                    {project?.assignedVendors?.length || 0} vendors
                  </Text>
                </View>
              </View>
            </StandardCard>
          </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error[500],
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },

  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 15,
  },
  viewer3D: {
    height: 300,
    borderRadius: 20,
  },
  progressCard: {
    minHeight: 150,
  },
  progressContent: {
    flex: 1,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  progressSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  infoCard: {
    minHeight: 120,
  },
  infoContent: {
    flex: 1,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  descriptionCard: {
    minHeight: 100,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    padding: 20,
  },
  progressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    width: 80,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  viewer3DPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  viewer3DIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  viewer3DText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  viewer3DSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default ProjectDetailsScreen;
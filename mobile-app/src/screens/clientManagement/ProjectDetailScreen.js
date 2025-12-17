import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI } from '../../utils/api';
import ScheduleTab from '../../components/clientManagement/ScheduleTab';
import InvoicesListTab from '../../components/clientManagement/InvoicesListTab';

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

const ProjectDetailScreen = ({ navigation, route }) => {
  const { projectId } = route.params;
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');

  // Simplified tabs - removed Progress, Timeline, Media. Added Schedule.
  const tabs = ['Overview', 'Schedule', 'Invoices', 'Files', 'Notes', 'Team'];

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProject();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, projectId]);

  const loadProject = async () => {
    try {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await projectsAPI.getProject(projectId);

      if (response.success) {
        setProject(response.data.project);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProject();
    setRefreshing(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading project...</Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={64} color={COLORS.danger} />
        <Text style={styles.errorText}>Project not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.background, '#1a1a0d', COLORS.cardBg]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.headerBackBtn} onPress={() => navigation.goBack()}>
              <Feather name="arrow-left" size={24} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('CreateProject', { projectId: project._id, editMode: true })}
            >
              <Feather name="edit-2" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.projectTitle}>{project.title}</Text>

          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(project.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
              {project.status?.replace('-', ' ').toUpperCase()}
            </Text>
          </View>

          {/* Client Info */}
          {project.client && (
            <View style={styles.clientInfo}>
              <Feather name="user" size={14} color={COLORS.textMuted} />
              <Text style={styles.clientName}>
                {project.client.firstName} {project.client.lastName}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'Overview' && <OverviewTab project={project} />}
          {activeTab === 'Schedule' && <ScheduleTab projectId={projectId} />}
          {activeTab === 'Invoices' && <InvoicesListTab projectId={projectId} navigation={navigation} />}
          {activeTab === 'Files' && <FilesTab projectId={projectId} />}
          {activeTab === 'Notes' && <NotesTab projectId={projectId} />}
          {activeTab === 'Team' && <TeamTab project={project} navigation={navigation} />}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// Tab Components
const OverviewTab = ({ project }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.sectionLabel}>Description</Text>
    <Text style={styles.description}>
      {project.description || 'No description available'}
    </Text>

    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          ${(project.budget?.estimated || 0).toLocaleString()}
        </Text>
        <Text style={styles.statLabel}>Budget</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>
          {new Date(project.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.statLabel}>Start Date</Text>
      </View>
    </View>

    {/* Location */}
    {project.location?.address && (
      <>
        <Text style={styles.sectionLabel}>Location</Text>
        <View style={styles.infoCard}>
          <Feather name="map-pin" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            {project.location.address}, {project.location.city}, {project.location.state}
          </Text>
        </View>
      </>
    )}
  </View>
);

const InvoicesTab = ({ projectId, navigation }) => (
  <View style={styles.tabContainer}>
    <View style={styles.centeredContent}>
      <Feather name="file-text" size={48} color={COLORS.primary} />
      <Text style={styles.placeholderTitle}>Project Invoices</Text>
      <Text style={styles.placeholderText}>Manage invoices for this project</Text>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate('CreateInvoice', { projectId })}
      >
        <Feather name="plus" size={20} color={COLORS.background} />
        <Text style={styles.actionButtonText}>Create Invoice</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton]}
        onPress={() => navigation.navigate('ViewInvoices', { projectId })}
      >
        <Feather name="eye" size={20} color={COLORS.primary} />
        <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>View Invoices</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const FilesTab = ({ projectId }) => (
  <View style={styles.tabContainer}>
    <View style={styles.centeredContent}>
      <Feather name="folder" size={48} color={COLORS.primary} />
      <Text style={styles.placeholderTitle}>Project Files</Text>
      <Text style={styles.placeholderText}>Documents and files will appear here</Text>
    </View>
  </View>
);

const NotesTab = ({ projectId }) => (
  <View style={styles.tabContainer}>
    <View style={styles.centeredContent}>
      <Feather name="edit-3" size={48} color={COLORS.primary} />
      <Text style={styles.placeholderTitle}>Project Notes</Text>
      <Text style={styles.placeholderText}>Notes and observations will appear here</Text>
    </View>
  </View>
);

const TeamTab = ({ project, navigation }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.sectionLabel}>Assigned Team</Text>

    {project.assignedEmployees && project.assignedEmployees.length > 0 ? (
      project.assignedEmployees.map((employee, index) => (
        <View key={employee._id || index} style={styles.teamMember}>
          <View style={styles.teamAvatar}>
            <Feather name="user" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>
              {employee.firstName} {employee.lastName}
            </Text>
            <Text style={styles.teamRole}>{employee.subRole || 'Team Member'}</Text>
          </View>
          <TouchableOpacity style={styles.removeBtn}>
            <Feather name="x" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      ))
    ) : (
      <View style={styles.centeredContent}>
        <Feather name="users" size={48} color={COLORS.textMuted} />
        <Text style={styles.placeholderTitle}>No Team Assigned</Text>
        <Text style={styles.placeholderText}>Add team members to this project</Text>
      </View>
    )}

    <TouchableOpacity
      style={styles.actionButton}
      onPress={() => navigation.navigate('CreateProject', { projectId: project._id, editMode: true })}
    >
      <Feather name="user-plus" size={20} color={COLORS.background} />
      <Text style={styles.actionButtonText}>Manage Team</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.danger,
    marginTop: 20,
    marginBottom: 24,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  backBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,215,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  projectTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientName: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeTabText: {
    color: COLORS.background,
  },
  tabContent: {
    flex: 1,
  },
  tabContainer: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  description: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  centeredContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  teamAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  teamRole: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,82,82,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProjectDetailScreen;
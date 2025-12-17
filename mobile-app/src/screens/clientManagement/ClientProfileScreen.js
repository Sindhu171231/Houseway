import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Svg, Path } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';

// Import components
import FoldedPanel from '../../components/clientManagement/FoldedPanel';
import GradientButton from '../../components/clientManagement/GradientButton';
import WorkloadRing from '../../components/clientManagement/WorkloadRing';
import { clientsAPI } from '../../utils/api';

const { width, height } = Dimensions.get('window');

const ClientProfileScreen = ({ navigation, route }) => {
  const { clientId } = route.params;
  const { user, isAuthenticated } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
    outstandingInvoices: 0,
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      loadClientData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, clientId]);

  const loadClientData = async () => {
    try {
      // Check if user is authenticated before making API call
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping client data load');
        setLoading(false);
        return;
      }
      
      setLoading(true);

      const response = await clientsAPI.getClient(clientId);
      if (response.success) {
        const { client: clientData, projects: projectsData, recentEvents: eventsData, invoiceStats } = response.data;
        setClient(clientData);
        setProjects(projectsData?.list || []);
        setRecentEvents(eventsData || []);

        // Calculate financial summary
        const summary = {
          totalProjects: projectsData?.stats?.total || 0,
          completedProjects: projectsData?.stats?.completed || 0,
          totalSpent: clientData?.clientDetails?.totalSpent || 0,
          outstandingInvoices: invoiceStats?.reduce((total, stat) => {
            return stat._id !== 'paid' ? total + stat.total : total;
          }, 0) || 0,
        };
        setFinancialSummary(summary);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!isAuthenticated || !user) {
      console.log('User not authenticated, skipping refresh');
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    await loadClientData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#7DB87A',
      'at-risk': '#E8B25D',
      pending: '#7487C1',
      inactive: '#D75A5A',
    };
    return colors[status] || colors.active;
  };

  const getStatusLabel = (status) => {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleTimelineEvent = () => {
    navigation.navigate('AddTimelineEvent', { clientId });
  };

  const handleUploadMedia = () => {
    navigation.navigate('UploadMedia', { clientId });
  };

  const handleCreateInvoice = () => {
    navigation.navigate('CreateInvoice', { clientId });
  };

  const handleViewProjects = () => {
    navigation.navigate('ProjectList', { clientId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E60D8" />
        <Text style={styles.loadingText}>Loading client profile...</Text>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="alert-circle" size={64} color="#D75A5A" />
        <Text style={styles.errorText}>Client not found</Text>
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Wave Header with Hero */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={['#3E60D8', '#566FE0', '#7487C1', '#FBF7EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Wave shape at bottom */}
        <Svg
          width={width}
          height={120}
          style={styles.wave}
          viewBox={`0 0 ${width} 120`}
          preserveAspectRatio="none"
        >
          <Path
            d={`M0,60 Q${width * 0.25},20 ${width * 0.5},60 T${width},60 L${width},120 L0,120 Z`}
            fill="#FBF7EE"
          />
        </Svg>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Avatar and Info */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarWrapper}>
            {client.profileImage ? (
              <Image source={{ uri: client.profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Feather name="user" size={48} color="#7487C1" />
              </View>
            )}
            <View style={styles.avatarGlow} />
          </View>

          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>
              {client.firstName} {client.lastName}
            </Text>
            <Text style={styles.clientEmail}>{client.email}</Text>

            <View style={styles.statusContainer}>
              <View style={[styles.statusOrb, { backgroundColor: getStatusColor(client.clientDetails?.clientStatus) }]} />
              <Text style={styles.statusText}>
                {getStatusLabel(client.clientDetails?.clientStatus || 'active')}
              </Text>
            </View>
          </View>
        </View>

        {/* Floating Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTimelineEvent}>
            <View style={styles.actionIcon}>
              <Feather name="plus-circle" size={20} color="#3E60D8" />
            </View>
            <Text style={styles.actionText}>New Timeline Update</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleUploadMedia}>
            <View style={styles.actionIcon}>
              <Feather name="camera" size={20} color="#7DB87A" />
            </View>
            <Text style={styles.actionText}>Upload Media</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleCreateInvoice}>
            <View style={styles.actionIcon}>
              <Feather name="file-plus" size={20} color="#E8B25D" />
            </View>
            <Text style={styles.actionText}>Create Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Financial Summary Cards */}
      <View style={styles.financialSection}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <View style={styles.financialCards}>
          <View style={styles.financialCard}>
            <WorkloadRing
              percentage={Math.round((financialSummary.completedProjects / Math.max(financialSummary.totalProjects, 1)) * 100)}
              label="Projects"
              color="#7DB87A"
              size={80}
            />
            <Text style={styles.financialLabel}>{financialSummary.completedProjects}/{financialSummary.totalProjects}</Text>
          </View>

          <View style={styles.financialCard}>
            <WorkloadRing
              percentage={75} // Example value
              label="Media"
              color="#7487C1"
              size={80}
            />
            <Text style={styles.financialLabel}>{recentEvents.length} updates</Text>
          </View>

          <View style={styles.financialCard}>
            <WorkloadRing
              percentage={60} // Example value
              label="Invoices"
              color="#E8B25D"
              size={80}
            />
            <Text style={styles.financialLabel}>${(financialSummary.outstandingInvoices / 1000).toFixed(1)}k pending</Text>
          </View>
        </View>
      </View>

      {/* Client Details Panels */}
      <View style={styles.detailsSection}>
        <FoldedPanel
          title="Client Details"
          defaultExpanded={true}
          icon={<Feather name="user" size={20} color="#3E60D8" />}
        >
          <View style={styles.panelContent}>
            <DetailRow
              label="Client Since"
              value={new Date(client.createdAt).toLocaleDateString()}
              icon="calendar"
            />
            <DetailRow
              label="Priority Level"
              value={client.clientDetails?.priorityLevel || 'medium'}
              icon="flag"
            />
            <DetailRow
              label="Preferred Contact"
              value={client.clientDetails?.preferredContact || 'both'}
              icon="mail"
            />
            <DetailRow
              label="Total Projects Completed"
              value={client.clientDetails?.totalProjectsCompleted || 0}
              icon="check-circle"
            />
          </View>
        </FoldedPanel>

        <FoldedPanel
          title="Contact Information"
          icon={<Feather name="phone" size={20} color="#3E60D8" />}
        >
          <View style={styles.panelContent}>
            <DetailRow
              label="Email"
              value={client.email}
              icon="mail"
            />
            {client.phone && (
              <DetailRow
                label="Phone"
                value={client.phone}
                icon="phone"
              />
            )}
            {client.address && (
              <DetailRow
                label="Address"
                value={`${client.address.city || ''}, ${client.address.state || ''}`}
                icon="map-pin"
              />
            )}
          </View>
        </FoldedPanel>

        {client.address && (
          <FoldedPanel
            title="Address"
            icon={<Feather name="home" size={20} color="#3E60D8" />}
          >
            <View style={styles.panelContent}>
              <DetailRow
                label="Street"
                value={client.address.street || ''}
                icon="map-pin"
              />
              <DetailRow
                label="City"
                value={client.address.city || ''}
                icon="map-pin"
              />
              <DetailRow
                label="State"
                value={client.address.state || ''}
                icon="map-pin"
              />
              <DetailRow
                label="ZIP Code"
                value={client.address.zipCode || ''}
                icon="hash"
              />
            </View>
          </FoldedPanel>
        )}

        {client.clientDetails?.tags && client.clientDetails.tags.length > 0 && (
          <FoldedPanel
            title="Tags"
            icon={<Feather name="tag" size={20} color="#3E60D8" />}
          >
            <View style={styles.tagsContainer}>
              {client.clientDetails.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </FoldedPanel>
        )}

        {client.clientDetails?.projectBudget && (
          <FoldedPanel
            title="Project Preferences"
            icon={<Feather name="settings" size={20} color="#3E60D8" />}
          >
            <View style={styles.panelContent}>
              <DetailRow
                label="Project Budget"
                value={`$${client.clientDetails.projectBudget.toLocaleString()}`}
                icon="dollar-sign"
              />
              <DetailRow
                label="Preferred Style"
                value={client.clientDetails.preferredStyle || 'Not specified'}
                icon="palette"
              />
              <DetailRow
                label="Property Type"
                value={client.clientDetails.propertyType || 'Not specified'}
                icon="home"
              />
              <DetailRow
                label="Timeline"
                value={client.clientDetails.timeline || 'Not specified'}
                icon="clock"
              />
            </View>
          </FoldedPanel>
        )}
      </View>

      {/* Call to Action */}
      <View style={styles.ctaSection}>
        <GradientButton
          title="View Client Projects"
          onPress={handleViewProjects}
          gradientColors={['#3E60D8', '#566FE0']}
          icon={<Feather name="briefcase" size={20} color="#fff" />}
          width="full"
        />
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const DetailRow = ({ label, value, icon }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Feather name={icon} size={16} color="#7487C1" />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF7EE',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7487C1',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#D75A5A',
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3E60D8',
  },
  heroSection: {
    height: 400,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  avatarContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E8EEF4',
  },
  avatarGlow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  clientInfo: {
    alignItems: 'center',
    marginTop: 20,
  },
  clientName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  clientEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusOrb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B2540',
  },
  financialSection: {
    paddingHorizontal: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B2540',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  financialCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  financialCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  financialLabel: {
    fontSize: 12,
    color: '#7487C1',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  detailsSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  panelContent: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#7487C1',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1B2540',
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F0F4F8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EEF4',
  },
  tagText: {
    fontSize: 13,
    color: '#7487C1',
    fontWeight: '600',
  },
  ctaSection: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  bottomPadding: {
    height: 40,
  },
});

export default ClientProfileScreen;
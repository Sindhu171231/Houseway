import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI } from '../../utils/api';

// Premium Beige Theme (matching Executive screens)
const COLORS = {
    primary: '#B8860B',
    primaryLight: 'rgba(184, 134, 11, 0.15)',
    background: '#F5F5F0',
    cardBg: '#FFFFFF',
    cardBorder: 'rgba(184, 134, 11, 0.1)',
    text: '#1A1A1A',
    textMuted: '#666666',
    success: '#388E3C',
    warning: '#F57C00',
    danger: '#D32F2F',
};

const VendorTeamDashboardScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        pendingRequests: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Backend now filters by assignedVendors for vendorTeam employees
            const response = await projectsAPI.getProjects({ limit: 100 });

            if (response.success) {
                const assignedProjects = response.data.projects || [];
                console.log('[VendorTeamDashboard] Projects from API:', assignedProjects.length);

                setProjects(assignedProjects);

                // Calculate stats
                const active = assignedProjects.filter(p => p.status === 'in-progress').length;
                setStats({
                    totalProjects: assignedProjects.length,
                    activeProjects: active,
                    pendingRequests: 0,
                });
            }
        } catch (error) {
            console.error('Error loading vendor team data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return COLORS.success;
            case 'in-progress': return COLORS.primary;
            case 'on-hold': return COLORS.warning;
            case 'cancelled': return COLORS.danger;
            default: return COLORS.textMuted;
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading projects...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.welcomeText}>
                            Welcome, {user?.firstName || 'Vendor Team'}
                        </Text>
                        <Text style={styles.roleText}>Vendor Employee</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Feather name="briefcase" size={24} color={COLORS.primary} />
                        <Text style={styles.statValue}>{stats.totalProjects}</Text>
                        <Text style={styles.statLabel}>Total Projects</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Feather name="activity" size={24} color={COLORS.success} />
                        <Text style={styles.statValue}>{stats.activeProjects}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Feather name="package" size={24} color={COLORS.warning} />
                        <Text style={styles.statValue}>{stats.pendingRequests}</Text>
                        <Text style={styles.statLabel}>Pending Requests</Text>
                    </View>
                </View>

                {/* Projects List */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Projects</Text>

                    {projects.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="inbox" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No projects found</Text>
                        </View>
                    ) : (
                        projects.map((project) => (
                            <TouchableOpacity
                                key={project._id}
                                style={styles.projectCard}
                                onPress={() => navigation.navigate('VendorTeamProjectDetail', { projectId: project._id })}
                            >
                                <View style={styles.projectHeader}>
                                    <Text style={styles.projectTitle} numberOfLines={1}>
                                        {project.title || project.name}
                                    </Text>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                                            {project.status?.replace('-', ' ').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Client Info (limited) */}
                                {project.client && (
                                    <View style={styles.clientInfo}>
                                        <Feather name="user" size={14} color={COLORS.textMuted} />
                                        <Text style={styles.clientName}>
                                            {project.client.firstName} {project.client.lastName}
                                        </Text>
                                    </View>
                                )}

                                {/* Progress */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBar}>
                                        <View
                                            style={[styles.progressFill, { width: `${project.progress?.percentage || 0}%` }]}
                                        />
                                    </View>
                                    <Text style={styles.progressText}>{project.progress?.percentage || 0}%</Text>
                                </View>

                                {/* Meta Info */}
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <Feather name="calendar" size={12} color={COLORS.textMuted} />
                                        <Text style={styles.metaText}>{formatDate(project.timeline?.startDate)}</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
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
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.textMuted,
    },
    header: {
        backgroundColor: COLORS.cardBg,
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    headerContent: {
        flex: 1,
    },
    welcomeText: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
    },
    roleText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
        marginTop: 4,
    },
    backButton: {
        padding: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 4,
        textAlign: 'center',
    },
    sectionContainer: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    projectCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    projectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    projectTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    clientName: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginLeft: 6,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 3,
        marginRight: 10,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        width: 35,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginLeft: 4,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: COLORS.textMuted,
    },
});

export default VendorTeamDashboardScreen;

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { projectsAPI } from '../../utils/api';
import ExecutiveBottomNavBar from '../../components/common/ExecutiveBottomNavBar';
import { COLORS } from '../../styles/colors';

const ExecutiveDashboardScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { isCheckedIn, checkOutTime, performCheckOut } = useAttendance();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
    });
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        if (!isCheckedIn) {
            navigation.replace('CheckIn');
            return;
        }
        loadData();
    }, [isCheckedIn]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await projectsAPI.getProjects({ limit: 50 });

            if (response.success) {
                const allProjects = response.data.projects || [];

                // Filter to show only projects assigned to this executive
                const assignedProjects = allProjects.filter(project => {
                    const isAssigned = project.assignedEmployees?.some(
                        emp => emp._id === user?._id || emp === user?._id
                    );
                    return isAssigned;
                });

                setRecentProjects(assignedProjects.slice(0, 3));
                setStats({
                    totalProjects: assignedProjects.length,
                    activeProjects: assignedProjects.filter(p => p.status === 'in-progress').length,
                    completedProjects: assignedProjects.filter(p => p.status === 'completed').length,
                });
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleCheckOut = () => {
        const doCheckout = async () => {
            try {
                await performCheckOut();
                if (Platform.OS === 'web') {
                    alert('Checked out successfully!');
                } else {
                    Alert.alert('Success', 'Checked out successfully!');
                }
                navigation.replace('CheckIn');
            } catch (error) {
                console.error('Check-out error:', error);
            }
        };

        if (Platform.OS === 'web') {
            if (confirm('Are you sure you want to check out?')) {
                doCheckout();
            }
        } else {
            Alert.alert('Check Out', 'Are you sure you want to check out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Check Out', onPress: doCheckout },
            ]);
        }
    };

    const handleLogout = async () => {
        const doLogout = async () => {
            try {
                await logout();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to logout?')) {
                doLogout();
            }
        } else {
            Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: doLogout },
            ]);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            planning: COLORS.warning,
            'in-progress': COLORS.primary,
            completed: COLORS.success,
            'on-hold': COLORS.textMuted,
        };
        return colors[status] || COLORS.textMuted;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <LinearGradient
                    colors={['#B8860B', '#D4A017', '#C9A227']}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <View>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                            <Text style={styles.roleText}>Executive Team</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity style={styles.checkOutBtn} onPress={handleCheckOut}>
                                <Feather name="log-out" size={18} color={COLORS.danger} />
                                <Text style={styles.checkOutText}>Check Out</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.checkOutBtn, { marginLeft: 8, backgroundColor: 'rgba(211, 47, 47, 0.1)' }]}
                                onPress={handleLogout}
                            >
                                <Feather name="power" size={18} color={COLORS.danger} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Feather name="briefcase" size={24} color={COLORS.primary} />
                        <Text style={styles.statNumber}>{stats.totalProjects}</Text>
                        <Text style={styles.statLabel}>Total Projects</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Feather name="activity" size={24} color={COLORS.success} />
                        <Text style={styles.statNumber}>{stats.activeProjects}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Feather name="check-circle" size={24} color={COLORS.warning} />
                        <Text style={styles.statNumber}>{stats.completedProjects}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionsGrid}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('ExecutiveProjectList')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#EBF5FF' }]}>
                                <Feather name="folder" size={24} color="#3B82F6" />
                            </View>
                            <Text style={styles.actionTitle}>View Projects</Text>
                            <Text style={styles.actionSubtitle}>See all assigned projects</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('ExecutiveProjectList', { action: 'upload' })}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#F0FFF4' }]}>
                                <Feather name="upload" size={24} color="#22C55E" />
                            </View>
                            <Text style={styles.actionTitle}>Upload Media</Text>
                            <Text style={styles.actionSubtitle}>Photos & videos</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('ExecutiveProjectList', { action: 'timeline' })}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
                                <Feather name="clock" size={24} color="#F97316" />
                            </View>
                            <Text style={styles.actionTitle}>Add Timeline</Text>
                            <Text style={styles.actionSubtitle}>Update progress</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
                                <Feather name="user" size={24} color="#8B5CF6" />
                            </View>
                            <Text style={styles.actionTitle}>Profile</Text>
                            <Text style={styles.actionSubtitle}>Settings</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Projects */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Projects</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('ExecutiveProjectList')}>
                            <Text style={styles.seeAllText}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    {recentProjects.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="folder" size={40} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>No projects assigned yet</Text>
                        </View>
                    ) : (
                        recentProjects.map((project) => (
                            <TouchableOpacity
                                key={project._id}
                                style={styles.projectCard}
                                onPress={() => navigation.navigate('ExecutiveProjectDetail', { projectId: project._id })}
                            >
                                <View style={[styles.projectIndicator, { backgroundColor: getStatusColor(project.status) }]} />
                                <View style={styles.projectInfo}>
                                    <Text style={styles.projectTitle} numberOfLines={1}>{project.title}</Text>
                                    <Text style={styles.projectStatus}>{project.status?.replace('-', ' ')}</Text>
                                </View>
                                <Feather name="chevron-right" size={20} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            <ExecutiveBottomNavBar navigation={navigation} activeTab="dashboard" />
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginTop: 4,
    },
    roleText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 4,
        fontWeight: '500',
    },
    checkOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    checkOutText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.danger,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: -20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 16,
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionCard: {
        width: '48%',
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    actionSubtitle: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 12,
    },
    projectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    projectIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    projectInfo: {
        flex: 1,
    },
    projectTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    projectStatus: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 2,
        textTransform: 'capitalize',
    },
});

export default ExecutiveDashboardScreen;

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

// Yellow/Black Theme Colors
const COLORS = {
    primary: '#FFD700',
    background: '#1a1a1a',
    backgroundLight: '#2d2d2d',
    card: '#333333',
    cardBorder: 'rgba(255,215,0,0.3)',
    text: '#FFFFFF',
    textMuted: '#aaaaaa',
    danger: '#f44336',
};

const SettingsScreen = ({ navigation }) => {
    const { user, logout } = useAuth();
    const { isCheckedIn, todayStats, checkOut, getStats } = useAttendance();
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [monthlyStats, setMonthlyStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [weekly, monthly] = await Promise.all([
                getStats('weekly'),
                getStats('monthly'),
            ]);
            setWeeklyStats(weekly);
            setMonthlyStats(monthly);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckOut = async () => {
        const confirmCheckout = () => {
            setCheckingOut(true);
            checkOut().then((result) => {
                setCheckingOut(false);
                if (result.success) {
                    if (Platform.OS === 'web') {
                        alert('✅ Checked out successfully! Great work today.');
                    } else {
                        Alert.alert('Success', 'Checked out successfully! Great work today.');
                    }
                    navigation.navigate('CheckIn');
                } else {
                    if (Platform.OS === 'web') {
                        alert('Failed to check out: ' + result.message);
                    } else {
                        Alert.alert('Error', result.message || 'Failed to check out');
                    }
                }
            });
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to check out?')) {
                confirmCheckout();
            }
        } else {
            Alert.alert('Check Out', 'Are you sure you want to check out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Check Out', onPress: confirmCheckout },
            ]);
        }
    };

    const handleLogout = () => {
        const doLogout = async () => {
            if (isCheckedIn) {
                await checkOut();
            }
            logout();
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

    const formatHours = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <LinearGradient
            colors={[COLORS.background, COLORS.backgroundLight, COLORS.background]}
            style={styles.container}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => navigation.goBack()}
                    >
                        <Feather name="arrow-left" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.firstName?.[0] || 'E'}{user?.lastName?.[0] || ''}
                            </Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.userRole}>{user?.subRole || user?.role}</Text>
                    <TouchableOpacity
                        style={styles.editProfileBtn}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Feather name="edit-2" size={14} color={COLORS.primary} />
                        <Text style={styles.editProfileText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Overview Section */}
                <Text style={styles.sectionTitle}>📊 Work Overview</Text>

                {isLoading ? (
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                ) : (
                    <>
                        {/* Today's Stats */}
                        <View style={styles.statsCard}>
                            <View style={styles.statsIcon}>
                                <Feather name="clock" size={24} color={COLORS.primary} />
                            </View>
                            <View style={styles.statsInfo}>
                                <Text style={styles.statsLabel}>Today</Text>
                                <Text style={styles.statsValue}>
                                    {formatHours(todayStats?.totalActiveMinutes || 0)}
                                </Text>
                            </View>
                        </View>

                        {/* Weekly & Monthly Stats */}
                        <View style={styles.statsRow}>
                            <View style={styles.halfCard}>
                                <Text style={styles.cardLabel}>This Week</Text>
                                <Text style={styles.cardValue}>{weeklyStats?.totalHours || 0}h</Text>
                                <Text style={styles.cardSubtext}>{weeklyStats?.totalDays || 0} days</Text>
                            </View>

                            <View style={styles.halfCard}>
                                <Text style={styles.cardLabel}>This Month</Text>
                                <Text style={styles.cardValue}>{monthlyStats?.totalHours || 0}h</Text>
                                <Text style={styles.cardSubtext}>{monthlyStats?.totalDays || 0} days</Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Quick Actions */}
                <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

                {isCheckedIn && (
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleCheckOut}
                        disabled={checkingOut}
                    >
                        {checkingOut ? (
                            <ActivityIndicator color={COLORS.background} />
                        ) : (
                            <>
                                <Feather name="log-out" size={20} color={COLORS.background} />
                                <Text style={styles.actionButtonText}>Check Out</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionButton, styles.logoutButton]}
                    onPress={handleLogout}
                >
                    <Feather name="power" size={20} color="#fff" />
                    <Text style={[styles.actionButtonText, { color: '#fff' }]}>Logout</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,215,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.background,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    userRole: {
        fontSize: 14,
        color: COLORS.textMuted,
        textTransform: 'capitalize',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginHorizontal: 20,
        marginBottom: 16,
        marginTop: 8,
    },
    loadingCard: {
        backgroundColor: COLORS.card,
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    statsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        gap: 16,
    },
    statsIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,215,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsInfo: {
        flex: 1,
    },
    statsLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        gap: 12,
        marginBottom: 24,
    },
    halfCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    cardLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    cardValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginTop: 8,
    },
    cardSubtext: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginTop: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    actionButtonText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: COLORS.danger,
    },
    editProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,215,0,0.15)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        gap: 6,
    },
    editProfileText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
});

export default SettingsScreen;

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';
import { attendanceAPI } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from '../../components/common/BottomNavBar';

// Premium Beige Theme
const COLORS = {
    primary: '#B8860B',      // Dark Golden Rod
    background: '#F5F5F0',   // Beige
    card: '#FFFFFF',
    text: '#1A1A1A',
    textMuted: '#666666',
    success: '#388E3C',
    danger: '#D32F2F',
};

const CheckInScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { isCheckedIn: contextIsCheckedIn, todayStats, checkIn, checkOut, fetchStatus } = useAttendance();
    const [isLoading, setIsLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [sessionDuration, setSessionDuration] = useState(0);

    useEffect(() => {
        const init = async () => {
            try {
                await fetchStatus();
            } catch (error) {
                console.error('CheckIn init error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        init();

        const timer = setInterval(() => {
            setCurrentTime(new Date());

            if (contextIsCheckedIn && todayStats?.checkInTime) {
                const checkInDate = new Date(todayStats.checkInTime);
                const diff = Math.floor((new Date() - checkInDate) / 1000);
                // Ensure diff is not negative due to clock skew
                setSessionDuration(Math.max(0, diff));
            } else {
                setSessionDuration(0);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [contextIsCheckedIn, todayStats?.checkInTime]);

    const handleCheckIn = async () => {
        setCheckingIn(true);
        try {
            const result = await checkIn();
            if (result.success) {
                if (Platform.OS === 'web') {
                    alert('✅ Checked in successfully!');
                } else {
                    Alert.alert('Success', 'Checked in successfully!');
                }
            } else {
                throw new Error(result.message || 'Check-in failed');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            const errorMsg = error.message || 'Failed to check in';
            if (Platform.OS === 'web') {
                alert('Failed: ' + errorMsg);
            } else {
                Alert.alert('Error', errorMsg);
            }
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        const performCheckOut = async () => {
            setCheckingIn(true);
            try {
                const result = await checkOut();
                if (result.success) {
                    if (Platform.OS === 'web') {
                        alert('✅ Checked out successfully!');
                    } else {
                        Alert.alert('Success', 'Checked out successfully!');
                    }
                } else {
                    const errorMsg = result.message || 'Check-out failed';
                    if (Platform.OS === 'web') {
                        alert('Error: ' + errorMsg);
                    } else {
                        Alert.alert('Error', errorMsg);
                    }
                }
            } catch (error) {
                console.error('Check-out error:', error);
                const errorMsg = 'Failed to check out. Please try again.';
                if (Platform.OS === 'web') {
                    alert('Error: ' + errorMsg);
                } else {
                    Alert.alert('Error', errorMsg);
                }
            } finally {
                setCheckingIn(false);
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to check out?')) {
                performCheckOut();
            }
        } else {
            Alert.alert(
                'Check Out',
                'Are you sure you want to finish your session?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Check Out', style: 'destructive', onPress: performCheckOut }
                ]
            );
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDuration = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Checking status...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[COLORS.background, '#F9F9F4', COLORS.background]} style={styles.gradient}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.welcomeText}>Welcome back</Text>
                            <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.refreshBtn}
                            onPress={async () => {
                                setIsLoading(true);
                                await fetchStatus();
                                setIsLoading(false);
                            }}
                        >
                            <Feather name="refresh-cw" size={20} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Time Display */}
                    <View style={styles.timeContainer}>
                        <Text style={styles.time}>{formatTime(currentTime)}</Text>
                        <Text style={styles.date}>{formatDate(currentTime)}</Text>
                    </View>

                    {/* Session Card */}
                    <View style={styles.sessionCard}>
                        {contextIsCheckedIn && (
                            <View style={styles.activeSessionBadge}>
                                <View style={styles.activeDot} />
                                <Text style={styles.activeSessionText}>ACTIVE SESSION</Text>
                            </View>
                        )}

                        <View style={styles.durationContainer}>
                            <Text style={styles.duration}>{formatDuration(sessionDuration)}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.actionButton, contextIsCheckedIn && styles.checkOutButton]}
                            onPress={contextIsCheckedIn ? handleCheckOut : handleCheckIn}
                            disabled={checkingIn}
                        >
                            {checkingIn ? (
                                <ActivityIndicator color={contextIsCheckedIn ? '#fff' : '#1a1a1a'} />
                            ) : (
                                <>
                                    <Feather
                                        name={contextIsCheckedIn ? "log-out" : "log-in"}
                                        size={20}
                                        color={contextIsCheckedIn ? '#fff' : '#1a1a1a'}
                                    />
                                    <Text style={[styles.actionText, contextIsCheckedIn && styles.checkOutText]}>
                                        {contextIsCheckedIn ? 'Check Out' : 'Check In'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Hours Logged */}
                    <View style={styles.hoursCard}>
                        <Feather name="clock" size={18} color="#666" />
                        <View style={styles.hoursContent}>
                            <Text style={styles.hoursLabel}>Active Hours (This Week)</Text>
                            <Text style={styles.hoursValue}>9 hours logged</Text>
                        </View>
                    </View>

                    {/* Client Management Card - Only show when checked in */}
                    {contextIsCheckedIn && (
                        <TouchableOpacity
                            style={styles.clientManagementCard}
                            onPress={() => navigation.navigate('HomeDashboard')}
                        >
                            <View style={styles.cmIconContainer}>
                                <Feather name="users" size={20} color="#fff" />
                            </View>
                            <View style={styles.cmContent}>
                                <Text style={styles.cmTitle}>Client Management</Text>
                                <Text style={styles.cmSubtitle}>Projects · Clients · Invoices</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#ccc" />
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </LinearGradient>

            {/* Bottom Navigation */}
            <BottomNavBar navigation={navigation} activeTab="home" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFBF7',
    },
    gradient: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 150, // Extra space for BottomNavBar
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    welcomeText: {
        fontSize: 14,
        color: '#888',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginTop: 2,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    timeContainer: {
        alignItems: 'center',
        marginTop: 32,
    },
    time: {
        fontSize: 48,
        fontWeight: '300',
        color: '#1a1a1a',
        letterSpacing: 1,
    },
    date: {
        fontSize: 14,
        color: '#888',
        marginTop: 4,
    },
    sessionCard: {
        backgroundColor: '#fff',
        marginHorizontal: 24,
        marginTop: 28,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    activeSessionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4caf50',
        marginRight: 6,
    },
    activeSessionText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4caf50',
        letterSpacing: 0.5,
    },
    durationContainer: {
        marginBottom: 20,
    },
    duration: {
        fontSize: 48,
        fontWeight: '300',
        color: '#1a1a1a',
        letterSpacing: 2,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#B8860B', // Dark Gold
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 30,
        gap: 10,
        minWidth: 180,
    },
    checkOutButton: {
        backgroundColor: '#333',
    },
    actionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    checkOutText: {
        color: '#fff',
    },
    hoursCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 24,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    hoursContent: {
        marginLeft: 12,
    },
    hoursLabel: {
        fontSize: 12,
        color: '#888',
    },
    hoursValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginTop: 2,
    },
    clientManagementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 24,
        marginTop: 12,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cmIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cmContent: {
        flex: 1,
        marginLeft: 12,
    },
    cmTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    cmSubtitle: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
});

export default CheckInScreen;

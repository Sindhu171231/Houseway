import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { attendanceAPI } from '../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import theme from '../../styles/theme';

const CheckInScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [checkingIn, setCheckingIn] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        checkAttendanceStatus();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const checkAttendanceStatus = async () => {
        try {
            const response = await attendanceAPI.getStatus();

            if (response.success && response.data.isCheckedIn) {
                // Already checked in, go to dashboard
                navigateToDashboard();
            }
        } catch (error) {
            console.error('Error checking attendance status:', error);
            // If error, continue to show check-in screen
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setCheckingIn(true);
        try {
            const response = await attendanceAPI.checkIn();

            if (response.success) {
                await AsyncStorage.setItem('lastCheckIn', new Date().toISOString());

                if (Platform.OS === 'web') {
                    alert('✅ Checked in successfully! Have a productive day.');
                } else {
                    Alert.alert('Success', 'Checked in successfully! Have a productive day.');
                }

                navigateToDashboard();
            } else {
                throw new Error(response.message || 'Check-in failed');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            const errorMsg = error.message || 'Failed to check in';
            if (Platform.OS === 'web') {
                alert('Failed to check in: ' + errorMsg);
            } else {
                Alert.alert('Error', 'Failed to check in: ' + errorMsg);
            }
        } finally {
            setCheckingIn(false);
        }
    };

    const navigateToDashboard = () => {
        const subRole = user?.subRole || 'none';
        // Navigate based on subRole
        if (subRole === 'designTeam') {
            navigation.replace('HomeDashboard');
        } else {
            navigation.replace('EmployeeDashboard');
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        return 'Evening';
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
        <LinearGradient
            colors={['#1a1a1a', '#2d2d2d', '#1a1a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <Text style={styles.greeting}>Good {getGreeting()},</Text>
                <Text style={styles.userName}>{user?.firstName || 'Employee'}</Text>
            </View>

            <View style={styles.timeContainer}>
                <Text style={styles.time}>{formatTime(currentTime)}</Text>
                <Text style={styles.date}>{formatDate(currentTime)}</Text>
            </View>

            <View style={styles.cardContainer}>
                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <Feather name="clock" size={48} color="#1a1a1a" />
                    </View>
                    <Text style={styles.cardTitle}>Start Your Work Day</Text>
                    <Text style={styles.cardSubtitle}>
                        Check in to begin tracking your work hours
                    </Text>

                    <TouchableOpacity
                        style={[styles.checkInButton, checkingIn && styles.buttonDisabled]}
                        onPress={handleCheckIn}
                        disabled={checkingIn}
                    >
                        {checkingIn ? (
                            <ActivityIndicator color="#1a1a1a" />
                        ) : (
                            <>
                                <Feather name="log-in" size={24} color="#1a1a1a" />
                                <Text style={styles.buttonText}>Check In</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Your attendance helps track productivity
                </Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#FFD700',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
    },
    greeting: {
        fontSize: 18,
        color: '#aaa',
    },
    userName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 4,
    },
    timeContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    time: {
        fontSize: 56,
        fontWeight: '200',
        color: '#FFD700',
        letterSpacing: 2,
    },
    date: {
        fontSize: 16,
        color: '#aaa',
        marginTop: 8,
    },
    cardContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    card: {
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFD700',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 8,
        textAlign: 'center',
    },
    checkInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: 30,
        marginTop: 24,
        gap: 12,
        minWidth: 200,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#1a1a1a',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#666',
    },
});

export default CheckInScreen;

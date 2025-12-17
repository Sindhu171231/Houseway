import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useAttendance } from '../../context/AttendanceContext';

// Premium Yellow/Black Theme
const COLORS = {
  primary: '#FFD700',
  background: '#0D0D0D',
  cardBg: '#1A1A1A',
  cardBorder: 'rgba(255, 215, 0, 0.15)',
  text: '#FFFFFF',
  textMuted: '#888888',
  success: '#00C853',
  danger: '#FF5252',
};

const EmployeeDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { isCheckedIn, checkOut, todayStats, getStats } = useAttendance();
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadWeeklyStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadWeeklyStats = async () => {
    try {
      const stats = await getStats('weekly');
      setWeeklyHours(stats?.totalHours || 0);
    } catch (error) {
      console.log('Stats error:', error);
    }
  };

  const handleCheckOut = async () => {
    const doCheckout = async () => {
      const result = await checkOut();
      if (result.success) {
        if (Platform.OS === 'web') {
          alert('✅ Checked out successfully! Great work today.');
        } else {
          Alert.alert('Success', 'Checked out successfully! Great work today.');
        }
        navigation.navigate('CheckIn');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Ready to end your work session?')) doCheckout();
    } else {
      Alert.alert('Check Out', 'Ready to end your work session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Check Out', style: 'destructive', onPress: doCheckout },
      ]);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Logout from your account?')) logout();
    } else {
      Alert.alert('Logout', 'Logout from your account?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]);
    }
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatActiveTime = () => {
    const mins = todayStats?.totalActiveMinutes || 0;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return { hours, minutes };
  };

  const time = formatActiveTime();

  return (
    <LinearGradient
      colors={[COLORS.background, '#151515', COLORS.background]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName || 'Employee'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Feather name="power" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* Current Time Display */}
        <View style={styles.timeDisplay}>
          <Text style={styles.currentTime}>{formatTime()}</Text>
          <Text style={styles.dateText}>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Active Session Card */}
        {isCheckedIn && (
          <View style={styles.sessionCard}>
            <LinearGradient
              colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
              style={styles.sessionGradient}
            >
              <View style={styles.sessionHeader}>
                <View style={styles.statusIndicator}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusLabel}>ACTIVE SESSION</Text>
                </View>
              </View>

              <View style={styles.timeTracker}>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeNumber}>{String(time.hours).padStart(2, '0')}</Text>
                  <Text style={styles.timeLabel}>Hours</Text>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timeBlock}>
                  <Text style={styles.timeNumber}>{String(time.minutes).padStart(2, '0')}</Text>
                  <Text style={styles.timeLabel}>Minutes</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut}>
                <Feather name="log-out" size={20} color={COLORS.background} />
                <Text style={styles.checkOutText}>Check Out</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Weekly Summary */}
        <View style={styles.summaryCard}>
          <Feather name="activity" size={24} color={COLORS.primary} />
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>This Week</Text>
            <Text style={styles.summaryValue}>{weeklyHours} hours logged</Text>
          </View>
        </View>

        {/* Client Management Link */}
        <TouchableOpacity
          style={styles.managementCard}
          onPress={() => navigation.navigate('HomeDashboard')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#2A2A2A', '#1F1F1F']}
            style={styles.managementGradient}
          >
            <View style={styles.managementIcon}>
              <Feather name="briefcase" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.managementContent}>
              <Text style={styles.managementTitle}>Client Management</Text>
              <Text style={styles.managementSubtitle}>
                Projects • Clients • Invoices • Team
              </Text>
            </View>
            <Feather name="chevron-right" size={24} color={COLORS.primary} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Settings Link */}
        <TouchableOpacity
          style={styles.settingsLink}
          onPress={() => navigation.navigate('Settings')}
        >
          <Feather name="settings" size={20} color={COLORS.textMuted} />
          <Text style={styles.settingsText}>Settings & Statistics</Text>
          <Feather name="chevron-right" size={18} color={COLORS.textMuted} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
  },
  logoutBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.danger + '30',
  },
  timeDisplay: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  currentTime: {
    fontSize: 48,
    fontWeight: '200',
    color: COLORS.text,
    letterSpacing: 2,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  sessionCard: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  sessionGradient: {
    padding: 24,
  },
  sessionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,200,83,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 1.5,
  },
  timeTracker: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  timeBlock: {
    alignItems: 'center',
    minWidth: 80,
  },
  timeNumber: {
    fontSize: 64,
    fontWeight: '200',
    color: COLORS.primary,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 48,
    fontWeight: '200',
    color: COLORS.primary,
    marginHorizontal: 8,
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  checkOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },
  managementCard: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  managementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  managementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,215,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  managementContent: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  managementSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  settingsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    gap: 12,
  },
  settingsText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textMuted,
  },
});

export default EmployeeDashboardScreen;

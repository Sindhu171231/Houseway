import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
    Image,
    TextInput,
    Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, authAPI } from '../../utils/api';
import ToastMessage from '../../components/common/ToastMessage';
import { COLORS } from '../../styles/colors';

export default function VendorTeamProfileScreen({ navigation }) {
    const { user, updateUser, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileImage, setProfileImage] = useState(user?.profileImage || null);

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        role: '',
        subRole: '',
    });

    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // OTP Password Reset State
    const [otpStep, setOtpStep] = useState(0);
    const [otpEmail, setOtpEmail] = useState(user?.email || '');
    const [otp, setOtp] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user) {
            setProfile({
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                email: user.email,
                phone: user.phone || 'Not provided',
                role: user.role || 'employee',
                subRole: user.subRole || 'vendorTeam',
            });
            setProfileImage(user.profileImage || null);
        }
    }, [user]);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showToast('Please allow access to photos', 'error');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadProfilePhoto(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            showToast('Failed to pick image', 'error');
        }
    };

    const uploadProfilePhoto = async (imageUri) => {
        try {
            setIsSaving(true);
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            if (Platform.OS === 'web') {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                formData.append('photo', blob, filename);
            } else {
                formData.append('photo', { uri: imageUri, name: filename, type });
            }

            const uploadResponse = await usersAPI.uploadProfilePhoto(formData);
            if (uploadResponse.success) {
                setProfileImage(uploadResponse.data.profileImage);
                if (updateUser) {
                    updateUser({ ...user, profileImage: uploadResponse.data.profileImage });
                }
                showToast('Profile photo updated!', 'success');
            } else {
                showToast(uploadResponse.message || 'Failed to upload photo', 'error');
            }
        } catch (error) {
            console.error('Upload photo error:', error);
            showToast('Failed to upload photo', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const deletePhoto = async () => {
        try {
            setIsSaving(true);
            const response = await usersAPI.deleteProfilePhoto();
            if (response.success) {
                setProfileImage(null);
                if (updateUser) {
                    updateUser({ ...user, profileImage: null });
                }
                showToast('Profile photo removed', 'success');
            } else {
                showToast(response.message || 'Failed to delete photo', 'error');
            }
        } catch (error) {
            console.error('Delete photo error:', error);
            showToast('Failed to delete photo', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // OTP Password Reset Flow
    const handleChangePassword = () => {
        setOtpEmail(user?.email || '');
        setOtpStep(1);
    };

    const requestOTP = async () => {
        if (!otpEmail) {
            showToast('Please enter your email', 'error');
            return;
        }
        try {
            setOtpLoading(true);
            const response = await authAPI.requestPasswordOTP(otpEmail);
            if (response.success) {
                showToast('OTP sent to your email', 'success');
                setOtpStep(2);
            } else {
                showToast(response.message || 'Failed to send OTP', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to send OTP', 'error');
        } finally {
            setOtpLoading(false);
        }
    };

    const verifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            showToast('Please enter the 6-digit OTP', 'error');
            return;
        }
        try {
            setOtpLoading(true);
            const response = await authAPI.verifyPasswordOTP(otpEmail, otp);
            if (response.success) {
                setResetToken(response.resetToken);
                setOtpStep(3);
            } else {
                showToast(response.message || 'Invalid OTP', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to verify OTP', 'error');
        } finally {
            setOtpLoading(false);
        }
    };

    const resetPasswordWithOTP = async () => {
        const { newPassword, confirmPassword } = passwordData;
        if (!newPassword || newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }
        try {
            setOtpLoading(true);
            const response = await authAPI.resetPasswordWithOTP(otpEmail, resetToken, newPassword);
            if (response.success) {
                showToast('Password changed successfully!', 'success');
                closeOtpModal();
                setTimeout(() => logout(), 2000);
            } else {
                showToast(response.message || 'Failed to reset password', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Failed to reset password', 'error');
        } finally {
            setOtpLoading(false);
        }
    };

    const closeOtpModal = () => {
        setOtpStep(0);
        setOtp('');
        setResetToken('');
        setPasswordData({ newPassword: '', confirmPassword: '' });
    };

    const performLogout = async () => {
        try {
            setLoading(true);
            await logout();
        } catch (error) {
            showToast('Failed to logout', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        showToast('Logging out...', 'info');
        setTimeout(() => performLogout(), 1000);
    };

    const MenuItem = ({ icon, title, subtitle, onPress, danger }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <View style={[styles.menuIconContainer, danger && styles.dangerIconContainer]}>
                <Feather name={icon} size={22} color={danger ? '#EF4444' : COLORS.primary} />
            </View>
            <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, danger && styles.dangerText]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <Feather name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Logging out...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ToastMessage
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={hideToast}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={22} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <TouchableOpacity onPress={pickImage} disabled={isSaving}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Text style={styles.avatarText}>
                                        {profile.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'V'}
                                    </Text>
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                {isSaving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Feather name="camera" size={14} color="#fff" />
                                )}
                            </View>
                        </TouchableOpacity>
                        {profileImage && !isSaving && (
                            <TouchableOpacity style={styles.deleteBadge} onPress={deletePhoto}>
                                <Feather name="x" size={12} color="#fff" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <Text style={styles.profileName}>{profile.name || 'User'}</Text>
                    <Text style={styles.profileEmail}>{profile.email}</Text>
                    <View style={styles.roleBadge}>
                        <Feather name="package" size={14} color={COLORS.primary} />
                        <Text style={styles.roleText}>Vendor Team</Text>
                    </View>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <View style={styles.menuContainer}>
                        <MenuItem
                            icon="user"
                            title="Edit Profile"
                            subtitle="Update your personal information"
                            onPress={() => showToast('Edit profile coming soon', 'info')}
                        />
                        <MenuItem
                            icon="phone"
                            title="Phone Number"
                            subtitle={profile.phone}
                            onPress={() => { }}
                        />
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>
                    <View style={styles.menuContainer}>
                        <MenuItem
                            icon="lock"
                            title="Change Password"
                            subtitle="Update your password"
                            onPress={handleChangePassword}
                        />
                    </View>
                </View>

                {/* More Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>More</Text>
                    <View style={styles.menuContainer}>
                        <MenuItem
                            icon="info"
                            title="About Houseway"
                            subtitle="Learn more about us"
                            onPress={() => navigation.navigate('AboutHouseway')}
                        />
                        <MenuItem
                            icon="help-circle"
                            title="Help & Support"
                            subtitle="Get help with your account"
                            onPress={() => showToast('Contact: support@houseway.co.in', 'info')}
                        />
                    </View>
                </View>

                {/* Logout Section */}
                <View style={styles.section}>
                    <View style={styles.menuContainer}>
                        <MenuItem
                            icon="log-out"
                            title="Logout"
                            subtitle="Sign out from your account"
                            onPress={handleLogout}
                            danger
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* OTP Password Reset Modal */}
            <Modal visible={otpStep > 0} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.otpModal}>
                        <View style={styles.otpHeader}>
                            <Text style={styles.otpTitle}>
                                {otpStep === 1 && 'Request OTP'}
                                {otpStep === 2 && 'Verify OTP'}
                                {otpStep === 3 && 'Set New Password'}
                            </Text>
                            <TouchableOpacity onPress={closeOtpModal} style={styles.closeButton}>
                                <Feather name="x" size={24} color="#999" />
                            </TouchableOpacity>
                        </View>

                        {otpStep === 1 && (
                            <View>
                                <Text style={styles.otpLabel}>Enter your email to receive OTP</Text>
                                <TextInput
                                    style={styles.otpInput}
                                    value={otpEmail}
                                    onChangeText={setOtpEmail}
                                    placeholder="your@email.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity style={styles.otpButton} onPress={requestOTP} disabled={otpLoading}>
                                    {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Send OTP</Text>}
                                </TouchableOpacity>
                            </View>
                        )}

                        {otpStep === 2 && (
                            <View>
                                <Text style={styles.otpLabel}>Enter the 6-digit OTP</Text>
                                <TextInput
                                    style={[styles.otpInput, { letterSpacing: 8, textAlign: 'center', fontSize: 20 }]}
                                    value={otp}
                                    onChangeText={setOtp}
                                    placeholder="000000"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity style={styles.otpButton} onPress={verifyOTP} disabled={otpLoading}>
                                    {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Verify OTP</Text>}
                                </TouchableOpacity>
                                <TouchableOpacity onPress={requestOTP} style={styles.resendLink}>
                                    <Text style={styles.resendText}>Resend OTP</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {otpStep === 3 && (
                            <View>
                                <Text style={styles.otpLabel}>Enter your new password</Text>
                                <TextInput
                                    style={styles.otpInput}
                                    value={passwordData.newPassword}
                                    onChangeText={(val) => setPasswordData(prev => ({ ...prev, newPassword: val }))}
                                    placeholder="New Password"
                                    secureTextEntry
                                    placeholderTextColor="#999"
                                />
                                <TextInput
                                    style={[styles.otpInput, { marginTop: 12 }]}
                                    value={passwordData.confirmPassword}
                                    onChangeText={(val) => setPasswordData(prev => ({ ...prev, confirmPassword: val }))}
                                    placeholder="Confirm Password"
                                    secureTextEntry
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity style={styles.otpButton} onPress={resetPasswordWithOTP} disabled={otpLoading}>
                                    {otpLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.otpButtonText}>Change Password</Text>}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    loadingText: { marginTop: 12, fontSize: 16, color: COLORS.textMuted },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 50,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.cardBg,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    profileCard: {
        backgroundColor: COLORS.cardBg,
        margin: 16,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    avatarContainer: { marginBottom: 16, position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 36, fontWeight: '700', color: '#1F2937' },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.cardBg,
    },
    deleteBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.cardBg,
    },
    profileName: { fontSize: 24, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
    profileEmail: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    roleText: { fontSize: 14, color: COLORS.primary, fontWeight: '500', marginLeft: 6 },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textMuted,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    menuContainer: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dangerIconContainer: { backgroundColor: '#FEE2E2' },
    menuContent: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '500', color: COLORS.text, marginBottom: 2 },
    menuSubtitle: { fontSize: 13, color: COLORS.textMuted },
    dangerText: { color: '#EF4444' },
    // OTP Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    otpModal: { backgroundColor: COLORS.cardBg, marginHorizontal: 24, borderRadius: 20, padding: 24, width: '90%', maxWidth: 400 },
    otpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    otpTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
    closeButton: { padding: 4 },
    otpLabel: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
    otpInput: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    otpButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 16,
    },
    otpButtonText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
    resendLink: { alignItems: 'center', marginTop: 16 },
    resendText: { fontSize: 14, color: COLORS.primary, fontWeight: '500' },
});

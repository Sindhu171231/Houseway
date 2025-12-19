import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Platform,
    Image,
    KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { usersAPI, authAPI } from '../../utils/api';
import BottomNavBar from '../../components/common/BottomNavBar';

// Premium Beige Theme
const COLORS = {
    primary: '#B8860B',      // Dark Golden Rod
    background: '#F5F5F0',   // Beige
    cardBg: '#FFFFFF',       // White
    cardBorder: 'rgba(184, 134, 11, 0.15)',
    text: '#1A1A1A',
    textMuted: '#666666',
    inputBg: '#F9F9F9',
    success: '#388E3C',
    danger: '#D32F2F',
};

const ProfileScreen = ({ navigation, route }) => {
    const { user, updateUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profileImage, setProfileImage] = useState(user?.profilePicture || null);

    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const scrollRef = React.useRef(null);
    const passwordSectionRef = React.useRef(null);

    useEffect(() => {
        if (route.params?.scrollToPassword) {
            setShowPasswordSection(true);
            // Wait for section to render
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 500);
        }
    }, [route.params]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    };

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const pickImage = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permission Required', 'Please allow access to photos');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Image picker error:', error);
            showAlert('Error', 'Failed to pick image');
        }
    };

    const handleSaveProfile = async () => {
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
            showAlert('Error', 'First name and last name are required');
            return;
        }

        try {
            setIsSaving(true);

            const updateData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
                profilePicture: profileImage, // Include the profile picture URI
            };

            // If profile image is a local URI, we should upload it to GCP/storage
            if (profileImage && !profileImage.startsWith('http')) {
                const formData = new FormData();
                const filename = profileImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('photo', { uri: profileImage, name: filename, type });

                const uploadResponse = await authAPI.uploadProfilePhoto(formData);
                if (uploadResponse.success) {
                    updateData.profilePicture = uploadResponse.data.url;
                }
            }

            const response = await usersAPI.updateProfile(updateData);

            if (response.success) {
                if (updateUser) {
                    updateUser({ ...user, ...updateData });
                }
                showAlert('Success', 'Profile updated successfully!');
            } else {
                showAlert('Error', response.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            showAlert('Error', 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        const { currentPassword, newPassword, confirmPassword } = passwordData;

        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Error', 'Please fill all password fields');
            return;
        }

        if (newPassword.length < 6) {
            showAlert('Error', 'New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            showAlert('Error', 'New passwords do not match');
            return;
        }

        try {
            setIsLoading(true);

            const response = await usersAPI.changePassword({
                currentPassword,
                newPassword,
            });

            if (response.success) {
                showAlert('Success', 'Password changed successfully!');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordSection(false);
            } else {
                showAlert('Error', response.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Change password error:', error);
            showAlert('Error', 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const InputField = ({ label, value, onChangeText, placeholder, secureTextEntry = false, editable = true }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, !editable && styles.inputDisabled]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={secureTextEntry}
                editable={editable}
            />
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={[COLORS.background, '#F9F9F4', COLORS.background]}
                style={styles.gradient}
            >
                <ScrollView
                    ref={scrollRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Feather name="arrow-left" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Profile Picture */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                            {profileImage ? (
                                <Image source={{ uri: profileImage }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Feather name="user" size={48} color={COLORS.primary} />
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Feather name="camera" size={14} color={COLORS.background} />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.avatarName}>
                            {formData.firstName} {formData.lastName}
                        </Text>
                        <Text style={styles.avatarRole}>{user?.role || 'Employee'}</Text>
                    </View>

                    {/* Personal Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <InputField
                                    label="First Name"
                                    value={formData.firstName}
                                    onChangeText={(v) => handleInputChange('firstName', v)}
                                    placeholder="First name"
                                />
                            </View>
                            <View style={styles.halfInput}>
                                <InputField
                                    label="Last Name"
                                    value={formData.lastName}
                                    onChangeText={(v) => handleInputChange('lastName', v)}
                                    placeholder="Last name"
                                />
                            </View>
                        </View>

                        <InputField
                            label="Email"
                            value={formData.email}
                            placeholder="Email"
                            editable={false}
                        />

                        <InputField
                            label="Phone"
                            value={formData.phone}
                            onChangeText={(v) => handleInputChange('phone', v)}
                            placeholder="+1 234 567 8900"
                        />

                        <TouchableOpacity
                            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                            onPress={handleSaveProfile}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={COLORS.background} />
                            ) : (
                                <>
                                    <Feather name="save" size={18} color={COLORS.background} />
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Security Section */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.sectionHeader}
                            onPress={() => setShowPasswordSection(!showPasswordSection)}
                        >
                            <Text style={styles.sectionTitle}>Security</Text>
                            <Feather
                                name={showPasswordSection ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={COLORS.primary}
                            />
                        </TouchableOpacity>

                        {showPasswordSection && (
                            <View style={styles.passwordSection}>
                                <InputField
                                    label="Current Password"
                                    value={passwordData.currentPassword}
                                    onChangeText={(v) => handlePasswordChange('currentPassword', v)}
                                    placeholder="Enter current password"
                                    secureTextEntry
                                />

                                <InputField
                                    label="New Password"
                                    value={passwordData.newPassword}
                                    onChangeText={(v) => handlePasswordChange('newPassword', v)}
                                    placeholder="Enter new password"
                                    secureTextEntry
                                />

                                <InputField
                                    label="Confirm New Password"
                                    value={passwordData.confirmPassword}
                                    onChangeText={(v) => handlePasswordChange('confirmPassword', v)}
                                    placeholder="Confirm new password"
                                    secureTextEntry
                                />

                                <TouchableOpacity
                                    style={[styles.changePasswordBtn, isLoading && styles.saveButtonDisabled]}
                                    onPress={handleChangePassword}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator color={COLORS.danger} />
                                    ) : (
                                        <>
                                            <Feather name="lock" size={18} color={COLORS.danger} />
                                            <Text style={styles.changePasswordText}>Change Password</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Account Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Member Since</Text>
                            <Text style={styles.infoValue}>
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Role</Text>
                            <Text style={styles.infoValue}>{user?.role || 'Employee'}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>User ID</Text>
                            <Text style={[styles.infoValue, { fontSize: 12 }]}>{user?._id || 'N/A'}</Text>
                        </View>
                    </View>

                    <View style={{ height: 60 }} />
                </ScrollView>
                <BottomNavBar navigation={navigation} activeTab="settings" />
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 10,
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
        fontWeight: '700',
        color: COLORS.primary,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,215,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: COLORS.primary,
    },
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
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    avatarName: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 12,
    },
    avatarRole: {
        fontSize: 14,
        color: COLORS.primary,
        marginTop: 4,
        textTransform: 'capitalize',
    },
    section: {
        marginHorizontal: 20,
        marginTop: 20,
        backgroundColor: COLORS.cardBg,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    inputDisabled: {
        opacity: 0.6,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 14,
        borderRadius: 10,
        gap: 8,
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.background,
    },
    passwordSection: {
        marginTop: 8,
    },
    changePasswordBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,82,82,0.1)',
        padding: 14,
        borderRadius: 10,
        gap: 8,
        borderWidth: 1,
        borderColor: COLORS.danger + '40',
    },
    changePasswordText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.danger,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
});

export default ProfileScreen;

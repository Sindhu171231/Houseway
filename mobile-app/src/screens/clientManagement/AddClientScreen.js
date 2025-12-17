import React, { useState } from 'react';
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
    KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { usersAPI } from '../../utils/api';

// Yellow/Black Theme
const COLORS = {
    primary: '#FFD700',
    background: '#0D0D0D',
    cardBg: '#1A1A1A',
    cardBorder: 'rgba(255, 215, 0, 0.15)',
    text: '#FFFFFF',
    textMuted: '#888888',
    inputBg: '#2d2d2d',
    success: '#00C853',
    danger: '#FF5252',
};

const AddClientScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        city: '',
        state: '',
        notes: '',
        // Login credentials
        username: '',
        password: '',
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!formData.firstName.trim()) {
            showAlert('Error', 'First name is required');
            return false;
        }
        if (!formData.lastName.trim()) {
            showAlert('Error', 'Last name is required');
            return false;
        }
        if (!formData.email.trim()) {
            showAlert('Error', 'Email is required');
            return false;
        }
        if (!formData.phone.trim()) {
            showAlert('Error', 'Phone number is required');
            return false;
        }
        if (!formData.username.trim()) {
            showAlert('Error', 'Username is required for client login');
            return false;
        }
        if (!formData.password.trim() || formData.password.length < 6) {
            showAlert('Error', 'Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const showAlert = (title, message) => {
        if (Platform.OS === 'web') {
            alert(`${title}: ${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        try {
            setIsLoading(true);

            const clientData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                role: 'client',
                username: formData.username || formData.email,
                password: formData.password,
                clientDetails: {
                    company: formData.company,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    notes: formData.notes,
                },
            };

            const response = await usersAPI.registerClient(clientData);

            if (response.success) {
                if (Platform.OS === 'web') {
                    alert('✅ Client added successfully!');
                    navigation.goBack();
                } else {
                    Alert.alert('Success', 'Client added successfully!', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                }
            } else {
                showAlert('Error', response.message || 'Failed to add client');
            }
        } catch (error) {
            console.error('Add client error:', error);
            showAlert('Error', 'Failed to add client');
        } finally {
            setIsLoading(false);
        }
    };

    const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
        <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textMuted}
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
            />
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={[COLORS.background, '#151515', COLORS.background]}
                style={styles.gradient}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Feather name="arrow-left" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add New Client</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Form */}
                    <View style={styles.formCard}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>Personal Information</Text>

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <InputField
                                        label="First Name *"
                                        value={formData.firstName}
                                        onChangeText={(v) => handleInputChange('firstName', v)}
                                        placeholder="John"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <InputField
                                        label="Last Name *"
                                        value={formData.lastName}
                                        onChangeText={(v) => handleInputChange('lastName', v)}
                                        placeholder="Doe"
                                    />
                                </View>
                            </View>

                            <InputField
                                label="Email *"
                                value={formData.email}
                                onChangeText={(v) => handleInputChange('email', v)}
                                placeholder="john.doe@email.com"
                                keyboardType="email-address"
                            />

                            <InputField
                                label="Phone *"
                                value={formData.phone}
                                onChangeText={(v) => handleInputChange('phone', v)}
                                placeholder="+1 234 567 8900"
                                keyboardType="phone-pad"
                            />

                            <InputField
                                label="Company"
                                value={formData.company}
                                onChangeText={(v) => handleInputChange('company', v)}
                                placeholder="Company name (optional)"
                            />
                        </View>

                        {/* Login Credentials Section */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>🔐 Login Credentials</Text>
                            <Text style={styles.helpText}>
                                These credentials will allow the client to log in and view their projects
                            </Text>

                            <InputField
                                label="Username *"
                                value={formData.username}
                                onChangeText={(v) => handleInputChange('username', v)}
                                placeholder="client_username"
                            />

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Password *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.password}
                                    onChangeText={(v) => handleInputChange('password', v)}
                                    placeholder="Min 6 characters"
                                    placeholderTextColor={COLORS.textMuted}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>Address</Text>

                            <InputField
                                label="Street Address"
                                value={formData.address}
                                onChangeText={(v) => handleInputChange('address', v)}
                                placeholder="123 Main Street"
                            />

                            <View style={styles.row}>
                                <View style={styles.halfInput}>
                                    <InputField
                                        label="City"
                                        value={formData.city}
                                        onChangeText={(v) => handleInputChange('city', v)}
                                        placeholder="City"
                                    />
                                </View>
                                <View style={styles.halfInput}>
                                    <InputField
                                        label="State"
                                        value={formData.state}
                                        onChangeText={(v) => handleInputChange('state', v)}
                                        placeholder="State"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.sectionLabel}>Additional Notes</Text>
                            <InputField
                                label="Notes"
                                value={formData.notes}
                                onChangeText={(v) => handleInputChange('notes', v)}
                                placeholder="Any additional notes about the client..."
                                multiline
                            />
                        </View>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.background} />
                        ) : (
                            <>
                                <Feather name="user-plus" size={20} color={COLORS.background} />
                                <Text style={styles.submitButtonText}>Add Client</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
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
        fontWeight: '700',
        color: COLORS.primary,
    },
    formCard: {
        marginHorizontal: 20,
        backgroundColor: COLORS.cardBg,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    formSection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
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
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.inputBg,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    multilineInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        marginHorizontal: 20,
        marginTop: 20,
        padding: 18,
        borderRadius: 14,
        gap: 10,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.background,
    },
    helpText: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 16,
        lineHeight: 18,
    },
});

export default AddClientScreen;

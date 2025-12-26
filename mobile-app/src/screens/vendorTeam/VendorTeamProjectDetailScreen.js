import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    TextInput,
    Modal,
    Alert,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { projectsAPI, materialRequestsAPI, usersAPI } from '../../utils/api';

// Premium Beige Theme
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

const MATERIAL_CATEGORIES = [
    { value: 'cement', label: 'Cement' },
    { value: 'steel', label: 'Steel' },
    { value: 'wood', label: 'Wood' },
    { value: 'tiles', label: 'Tiles' },
    { value: 'paint', label: 'Paint' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'plumbing', label: 'Plumbing' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'other', label: 'Other' },
];

const UNITS = ['pcs', 'kg', 'lbs', 'sqft', 'sqm', 'cubic_ft', 'cubic_m', 'liters', 'gallons', 'meters', 'feet'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const VendorTeamProjectDetailScreen = ({ navigation, route }) => {
    const { projectId } = route.params;
    const { user } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('Overview');

    // Material request state
    const [materialRequests, setMaterialRequests] = useState([]);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [requestForm, setRequestForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        requiredBy: '',
        materials: [{ name: '', quantity: '', unit: 'pcs', category: 'other' }],
        selectedVendor: null,
    });
    const [submitting, setSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [expandedVendor, setExpandedVendor] = useState(null);
    const [expandedRequest, setExpandedRequest] = useState(null);

    const tabs = ['Overview', 'Vendors', 'Material Requests'];

    useEffect(() => {
        loadProject();
        loadMaterialRequests();
        loadVendors();
    }, [projectId]);

    const loadProject = async () => {
        try {
            setLoading(true);
            const response = await projectsAPI.getProject(projectId);
            if (response.success) {
                setProject(response.data.project);
            }
        } catch (error) {
            console.error('Error loading project:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMaterialRequests = async () => {
        try {
            const response = await materialRequestsAPI.getMaterialRequests({ projectId });
            if (response.success) {
                setMaterialRequests(response.data.materialRequests || []);
            }
        } catch (error) {
            console.error('Error loading material requests:', error);
        }
    };

    const loadVendors = async () => {
        try {
            // Fetch vendorTeam employees (role: employee, subRole: vendorTeam)
            const response = await usersAPI.getUsers({ role: 'employee', subRole: 'vendorTeam' });
            if (response.data?.users) {
                setVendors(response.data.users);
            }
        } catch (error) {
            console.error('Error loading vendor team employees:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadProject(), loadMaterialRequests()]);
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': case 'fulfilled': case 'approved': return COLORS.success;
            case 'in-progress': case 'pending': return COLORS.warning;
            case 'rejected': return COLORS.danger;
            default: return COLORS.textMuted;
        }
    };

    const addMaterial = () => {
        setRequestForm(prev => ({
            ...prev,
            materials: [...prev.materials, { name: '', quantity: '', unit: 'pcs', category: 'other' }]
        }));
    };

    const updateMaterial = (index, field, value) => {
        setRequestForm(prev => {
            const materials = [...prev.materials];
            materials[index] = { ...materials[index], [field]: value };
            return { ...prev, materials };
        });
    };

    const removeMaterial = (index) => {
        if (requestForm.materials.length > 1) {
            setRequestForm(prev => ({
                ...prev,
                materials: prev.materials.filter((_, i) => i !== index)
            }));
        }
    };

    const submitMaterialRequest = async () => {
        const { title, materials, priority, requiredBy, selectedVendor } = requestForm;

        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        if (!materials[0].name.trim() || !materials[0].quantity) {
            Alert.alert('Error', 'Please add at least one material with name and quantity');
            return;
        }

        if (!requiredBy) {
            Alert.alert('Error', 'Please select a required by date');
            return;
        }

        try {
            setSubmitting(true);

            // Format materials for API
            const formattedMaterials = materials
                .filter(m => m.name.trim() && m.quantity)
                .map(m => ({
                    ...m,
                    quantity: parseFloat(m.quantity),
                    requiredBy: new Date(requiredBy).toISOString(),
                }));

            const requestData = {
                projectId: projectId,
                title: title.trim(),
                description: requestForm.description.trim(),
                priority,
                requiredBy: new Date(requiredBy).toISOString(),
                materials: formattedMaterials,
                assignedVendors: selectedVendor ? [{ vendor: selectedVendor }] : [],
            };

            const response = await materialRequestsAPI.createMaterialRequest(requestData);

            if (response.success) {
                setShowRequestModal(false);
                setRequestForm({
                    title: '',
                    description: '',
                    priority: 'medium',
                    requiredBy: '',
                    materials: [{ name: '', quantity: '', unit: 'pcs', category: 'other' }],
                    selectedVendor: null,
                });
                setSuccessMessage('Material request sent successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
                loadMaterialRequests();
            } else {
                throw new Error(response.message || 'Failed to create request');
            }
        } catch (error) {
            console.error('Error creating material request:', error);
            Platform.OS === 'web'
                ? alert('Failed to create request: ' + error.message)
                : Alert.alert('Error', 'Failed to create request: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Overview Tab
    const OverviewTab = () => (
        <View style={styles.tabContent}>
            {/* Progress Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Project Progress</Text>
                <View style={styles.progressRow}>
                    <View style={styles.progressBarLarge}>
                        <View style={[styles.progressFill, { width: `${project?.progress?.percentage || 0}%` }]} />
                    </View>
                    <Text style={styles.progressPercent}>{project?.progress?.percentage || 0}%</Text>
                </View>
                <Text style={styles.progressHint}>
                    Status: {project?.status?.replace('-', ' ').toUpperCase() || 'N/A'}
                </Text>
            </View>

            {/* Client Info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Client Information</Text>
                {project?.client ? (
                    <>
                        <View style={styles.infoRow}>
                            <Feather name="user" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoText}>
                                {project.client.firstName} {project.client.lastName}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Feather name="mail" size={16} color={COLORS.textMuted} />
                            <Text style={styles.infoText}>{project.client.email}</Text>
                        </View>
                    </>
                ) : (
                    <Text style={styles.emptyText}>No client assigned</Text>
                )}
            </View>

            {/* Project Info */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Project Details</Text>
                <View style={styles.infoRow}>
                    <Feather name="calendar" size={16} color={COLORS.textMuted} />
                    <Text style={styles.infoText}>
                        Start: {project?.timeline?.startDate ? new Date(project.timeline.startDate).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Feather name="flag" size={16} color={COLORS.textMuted} />
                    <Text style={styles.infoText}>
                        End: {project?.timeline?.expectedEndDate ? new Date(project.timeline.expectedEndDate).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Team Working on Project */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Team Working</Text>

                {/* Executive */}
                {project?.assignedEmployees && project.assignedEmployees.length > 0 ? (
                    project.assignedEmployees.map((employee, index) => (
                        <View key={employee._id || index} style={styles.teamMember}>
                            <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                                <Feather name="hard-hat" size={16} color={COLORS.primary} />
                            </View>
                            <View style={{ marginLeft: 10 }}>
                                <Text style={styles.memberName}>
                                    {employee.firstName} {employee.lastName}
                                </Text>
                                <Text style={styles.memberRole}>Executive</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <View style={styles.infoRow}>
                        <Feather name="user-x" size={16} color={COLORS.textMuted} />
                        <Text style={styles.infoText}>No executive assigned</Text>
                    </View>
                )}

                {/* Design Team */}
                {project?.designTeam && project.designTeam.length > 0 && (
                    <>
                        <View style={{ height: 8 }} />
                        {project.designTeam.map((designer, index) => (
                            <View key={designer._id || index} style={styles.teamMember}>
                                <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                                    <Feather name="pen-tool" size={16} color={COLORS.primary} />
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.memberName}>
                                        {designer.firstName} {designer.lastName}
                                    </Text>
                                    <Text style={styles.memberRole}>Designer</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

                {/* Vendor Team */}
                {project?.assignedVendors && project.assignedVendors.length > 0 && (
                    <>
                        <View style={{ height: 8 }} />
                        {project.assignedVendors.map((vendor, index) => (
                            <View key={vendor._id || index} style={styles.teamMember}>
                                <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                                    <Feather name="truck" size={16} color={COLORS.primary} />
                                </View>
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.memberName}>
                                        {vendor.firstName} {vendor.lastName}
                                    </Text>
                                    <Text style={styles.memberRole}>Vendor Team</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </View>
        </View>
    );

    // Team Tab
    const TeamTab = () => (
        <View style={styles.tabContent}>
            {/* Executive Team */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Executive Team</Text>
                {project?.assignedEmployee ? (
                    <View style={styles.teamMember}>
                        <View style={styles.avatar}>
                            <Feather name="hard-hat" size={20} color={COLORS.primary} />
                        </View>
                        <View style={styles.memberInfo}>
                            <Text style={styles.memberName}>
                                {project.assignedEmployee.firstName} {project.assignedEmployee.lastName}
                            </Text>
                            <Text style={styles.memberRole}>Executive</Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No executive assigned</Text>
                )}
            </View>

            {/* Design Team */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Design Team</Text>
                {project?.designTeam && project.designTeam.length > 0 ? (
                    project.designTeam.map((member, index) => (
                        <View key={index} style={styles.teamMember}>
                            <View style={styles.avatar}>
                                <Feather name="pen-tool" size={20} color={COLORS.primary} />
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>
                                    {member.firstName} {member.lastName}
                                </Text>
                                <Text style={styles.memberRole}>Designer</Text>
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No designers assigned</Text>
                )}
            </View>
        </View>
    );

    // Vendors Tab - Show available vendor team employees with inline details
    const VendorsTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Available Vendor Team</Text>
                {vendors && vendors.length > 0 ? (
                    vendors.map((vendor, index) => (
                        <View key={vendor._id || index}>
                            <TouchableOpacity
                                style={styles.vendorItem}
                                onPress={() => setExpandedVendor(expandedVendor === vendor._id ? null : vendor._id)}
                            >
                                <View style={styles.avatar}>
                                    <Feather name="user" size={20} color={COLORS.primary} />
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>
                                        {vendor.firstName} {vendor.lastName}
                                    </Text>
                                    <Text style={styles.memberRole}>Vendor Team Employee</Text>
                                </View>
                                <Feather
                                    name={expandedVendor === vendor._id ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color={COLORS.textMuted}
                                />
                            </TouchableOpacity>
                            {/* Expanded Details */}
                            {expandedVendor === vendor._id && (
                                <View style={{
                                    backgroundColor: COLORS.primaryLight,
                                    padding: 12,
                                    marginLeft: 48,
                                    marginBottom: 8,
                                    borderRadius: 8,
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <Feather name="mail" size={14} color={COLORS.primary} />
                                        <Text style={{ marginLeft: 8, color: COLORS.text }}>{vendor.email}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                        <Feather name="phone" size={14} color={COLORS.primary} />
                                        <Text style={{ marginLeft: 8, color: COLORS.text }}>{vendor.phone || 'No phone available'}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Feather name="briefcase" size={14} color={COLORS.primary} />
                                        <Text style={{ marginLeft: 8, color: COLORS.text }}>Vendor Team</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>No vendor team employees available</Text>
                )}
            </View>
        </View>
    );

    // Material Requests Tab
    const MaterialRequestsTab = () => (
        <View style={styles.tabContent}>
            {/* New Request Button */}
            <TouchableOpacity
                style={styles.addRequestBtn}
                onPress={() => setShowRequestModal(true)}
            >
                <Feather name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.addRequestBtnText}>Create Material Request</Text>
            </TouchableOpacity>

            {/* Sent Requests */}
            <Text style={styles.sectionTitle}>Sent Requests</Text>
            {materialRequests.length > 0 ? (
                materialRequests.map((request, index) => (
                    <View key={request._id || index}>
                        <TouchableOpacity
                            style={styles.requestCard}
                            onPress={() => setExpandedRequest(expandedRequest === request._id ? null : request._id)}
                        >
                            <View style={styles.requestHeader}>
                                <Text style={styles.requestTitle}>{request.title}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                                        <Text style={[styles.statusBadgeText, { color: getStatusColor(request.status) }]}>
                                            {request.status?.toUpperCase()}
                                        </Text>
                                    </View>
                                    <Feather
                                        name={expandedRequest === request._id ? "chevron-up" : "chevron-down"}
                                        size={20}
                                        color={COLORS.textMuted}
                                    />
                                </View>
                            </View>
                            <Text style={styles.requestMeta}>
                                {request.materials?.length || 0} materials • Priority: {request.priority}
                            </Text>
                            <Text style={styles.requestDate}>
                                Required by: {new Date(request.requiredBy).toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>

                        {/* Expanded Details */}
                        {expandedRequest === request._id && (
                            <View style={{
                                backgroundColor: COLORS.primaryLight,
                                padding: 12,
                                marginHorizontal: 4,
                                marginBottom: 8,
                                borderRadius: 8,
                            }}>
                                {request.description && (
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={{ fontWeight: '600', color: COLORS.text, marginBottom: 4 }}>Description:</Text>
                                        <Text style={{ color: COLORS.textMuted }}>{request.description}</Text>
                                    </View>
                                )}
                                <Text style={{ fontWeight: '600', color: COLORS.text, marginBottom: 8 }}>Materials:</Text>
                                {request.materials?.map((material, mIndex) => (
                                    <View key={mIndex} style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        backgroundColor: '#FFFFFF',
                                        padding: 8,
                                        borderRadius: 6,
                                        marginBottom: 4,
                                    }}>
                                        <Text style={{ color: COLORS.text }}>{material.name}</Text>
                                        <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                                            {material.quantity} {material.unit}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                ))
            ) : (
                <View style={styles.emptyState}>
                    <Feather name="package" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>No material requests yet</Text>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Header */}
                <LinearGradient colors={['#B8860B', '#DAA520']} style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Feather name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.projectTitle}>{project?.title || 'Project'}</Text>
                    <Text style={styles.projectSubtitle}>Vendor Team View</Text>
                </LinearGradient>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Success Message Toast */}
                {successMessage ? (
                    <View style={{
                        backgroundColor: '#388E3C',
                        padding: 12,
                        marginHorizontal: 16,
                        marginTop: 8,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <Feather name="check-circle" size={20} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', marginLeft: 8, fontWeight: '600' }}>{successMessage}</Text>
                    </View>
                ) : null}

                {/* Tab Content */}
                {activeTab === 'Overview' && <OverviewTab />}
                {activeTab === 'Vendors' && <VendorsTab />}
                {activeTab === 'Material Requests' && <MaterialRequestsTab />}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Material Request Modal */}
            <Modal visible={showRequestModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Create Material Request</Text>

                            <Text style={styles.inputLabel}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={requestForm.title}
                                onChangeText={(text) => setRequestForm(prev => ({ ...prev, title: text }))}
                                placeholder="Enter request title"
                            />

                            <Text style={styles.inputLabel}>Description</Text>
                            <TextInput
                                style={[styles.input, { minHeight: 80 }]}
                                value={requestForm.description}
                                onChangeText={(text) => setRequestForm(prev => ({ ...prev, description: text }))}
                                placeholder="Enter description"
                                multiline
                            />

                            <Text style={styles.inputLabel}>Priority</Text>
                            <View style={styles.priorityRow}>
                                {PRIORITIES.map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.priorityBtn, requestForm.priority === p && styles.priorityBtnActive]}
                                        onPress={() => setRequestForm(prev => ({ ...prev, priority: p }))}
                                    >
                                        <Text style={[styles.priorityBtnText, requestForm.priority === p && styles.priorityBtnTextActive]}>
                                            {p.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Required By Date *</Text>
                            <TextInput
                                style={styles.input}
                                value={requestForm.requiredBy}
                                onChangeText={(text) => setRequestForm(prev => ({ ...prev, requiredBy: text }))}
                                placeholder="YYYY-MM-DD"
                            />

                            <Text style={styles.inputLabel}>Select Vendor</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vendorScroll}>
                                {vendors.map((v) => (
                                    <TouchableOpacity
                                        key={v._id}
                                        style={[styles.vendorChip, requestForm.selectedVendor === v._id && styles.vendorChipActive]}
                                        onPress={() => setRequestForm(prev => ({ ...prev, selectedVendor: v._id }))}
                                    >
                                        <Text style={[styles.vendorChipText, requestForm.selectedVendor === v._id && styles.vendorChipTextActive]}>
                                            {v.vendorDetails?.companyName || v.firstName}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.inputLabel}>Materials *</Text>
                            {requestForm.materials.map((material, index) => (
                                <View key={index} style={styles.materialCard}>
                                    <View style={styles.materialRowTop}>
                                        <TextInput
                                            style={[styles.input, { flex: 2 }]}
                                            value={material.name}
                                            onChangeText={(text) => updateMaterial(index, 'name', text)}
                                            placeholder="Material name"
                                        />
                                        <TextInput
                                            style={[styles.input, { flex: 1, marginLeft: 8 }]}
                                            value={material.quantity}
                                            onChangeText={(text) => updateMaterial(index, 'quantity', text)}
                                            placeholder="Qty"
                                            keyboardType="numeric"
                                        />
                                        {index > 0 && (
                                            <TouchableOpacity onPress={() => removeMaterial(index)} style={styles.removeBtn}>
                                                <Feather name="x" size={18} color={COLORS.danger} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <View style={styles.materialRowBottom}>
                                        <View style={styles.pickerContainer}>
                                            <Text style={styles.pickerLabel}>Category:</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                {MATERIAL_CATEGORIES.map((cat) => (
                                                    <TouchableOpacity
                                                        key={cat.value}
                                                        style={[styles.categoryChip, material.category === cat.value && styles.categoryChipActive]}
                                                        onPress={() => updateMaterial(index, 'category', cat.value)}
                                                    >
                                                        <Text style={[styles.categoryChipText, material.category === cat.value && styles.categoryChipTextActive]}>
                                                            {cat.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                        <View style={styles.pickerContainer}>
                                            <Text style={styles.pickerLabel}>Unit:</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                {UNITS.map((u) => (
                                                    <TouchableOpacity
                                                        key={u}
                                                        style={[styles.unitChip, material.unit === u && styles.unitChipActive]}
                                                        onPress={() => updateMaterial(index, 'unit', u)}
                                                    >
                                                        <Text style={[styles.unitChipText, material.unit === u && styles.unitChipTextActive]}>
                                                            {u}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    </View>
                                </View>
                            ))}
                            <TouchableOpacity style={styles.addMaterialBtn} onPress={addMaterial}>
                                <Feather name="plus" size={16} color={COLORS.primary} />
                                <Text style={styles.addMaterialText}>Add Material</Text>
                            </TouchableOpacity>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => setShowRequestModal(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                                    onPress={submitMaterialRequest}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.submitBtnText}>Submit Request</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 30,
    },
    backBtn: { marginBottom: 16 },
    projectTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
    projectSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    tabsContainer: {
        backgroundColor: COLORS.cardBg,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    tab: { paddingHorizontal: 20, paddingVertical: 8 },
    activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
    tabText: { fontSize: 14, color: COLORS.textMuted },
    activeTabText: { color: COLORS.primary, fontWeight: '600' },
    tabContent: { padding: 16 },
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 12 },
    progressRow: { flexDirection: 'row', alignItems: 'center' },
    progressBarLarge: { flex: 1, height: 10, backgroundColor: COLORS.primaryLight, borderRadius: 5 },
    progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 5 },
    progressPercent: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginLeft: 12, width: 50 },
    progressHint: { fontSize: 12, color: COLORS.textMuted, marginTop: 8 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoText: { fontSize: 14, color: COLORS.text, marginLeft: 10 },
    emptyText: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic' },
    teamMember: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    vendorItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: COLORS.primaryLight,
        justifyContent: 'center', alignItems: 'center',
    },
    memberInfo: { marginLeft: 12 },
    memberName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
    memberRole: { fontSize: 12, color: COLORS.textMuted },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginVertical: 12 },
    addRequestBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.primary, borderRadius: 12, padding: 16,
    },
    addRequestBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    requestCard: {
        backgroundColor: COLORS.cardBg, borderRadius: 12, padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.cardBorder,
    },
    requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    requestTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, flex: 1 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusBadgeText: { fontSize: 10, fontWeight: '600' },
    requestMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 8 },
    requestDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    emptyState: { alignItems: 'center', padding: 40 },
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        padding: 20, maxHeight: '85%',
    },
    modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: '500', color: COLORS.text, marginBottom: 6, marginTop: 12 },
    input: {
        borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 8,
        padding: 12, fontSize: 14, backgroundColor: COLORS.background,
    },
    priorityRow: { flexDirection: 'row', flexWrap: 'wrap' },
    priorityBtn: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.cardBorder, marginRight: 8, marginBottom: 8,
    },
    priorityBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    priorityBtnText: { fontSize: 12, color: COLORS.textMuted },
    priorityBtnTextActive: { color: '#FFFFFF' },
    vendorScroll: { marginVertical: 8 },
    vendorChip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: COLORS.cardBorder, marginRight: 8,
    },
    vendorChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    vendorChipText: { fontSize: 12, color: COLORS.textMuted },
    vendorChipTextActive: { color: '#FFFFFF' },
    materialCard: {
        backgroundColor: COLORS.background, borderRadius: 8, padding: 12,
        marginBottom: 12, borderWidth: 1, borderColor: COLORS.cardBorder,
    },
    materialRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    materialRowBottom: { marginTop: 4 },
    materialRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    pickerContainer: { marginBottom: 8 },
    pickerLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
    categoryChip: {
        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        borderWidth: 1, borderColor: COLORS.cardBorder, marginRight: 6,
        backgroundColor: COLORS.cardBg,
    },
    categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    categoryChipText: { fontSize: 11, color: COLORS.textMuted },
    categoryChipTextActive: { color: '#FFFFFF' },
    unitChip: {
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
        borderWidth: 1, borderColor: COLORS.cardBorder, marginRight: 6,
        backgroundColor: COLORS.cardBg,
    },
    unitChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    unitChipText: { fontSize: 10, color: COLORS.textMuted },
    unitChipTextActive: { color: '#FFFFFF' },
    removeBtn: { marginLeft: 8, padding: 8 },
    addMaterialBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderWidth: 1, borderColor: COLORS.primary,
        borderStyle: 'dashed', borderRadius: 8,
    },
    addMaterialText: { color: COLORS.primary, marginLeft: 8 },
    modalActions: { flexDirection: 'row', marginTop: 24 },
    cancelBtn: {
        flex: 1, paddingVertical: 14, alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 8, marginRight: 8,
    },
    cancelBtnText: { color: COLORS.textMuted, fontSize: 16 },
    submitBtn: {
        flex: 1, paddingVertical: 14, alignItems: 'center',
        backgroundColor: COLORS.primary, borderRadius: 8,
    },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default VendorTeamProjectDetailScreen;

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { invoicesAPI } from '../../utils/api';

// Yellow/Black Theme
const COLORS = {
    primary: '#FFD700',
    background: '#0D0D0D',
    cardBg: '#1A1A1A',
    cardBorder: 'rgba(255, 215, 0, 0.15)',
    text: '#FFFFFF',
    textMuted: '#888888',
    success: '#00C853',
    warning: '#FFB300',
    danger: '#FF5252',
};

const InvoicesListTab = ({ projectId, navigation }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadInvoices();
    }, [projectId]);

    const loadInvoices = async () => {
        try {
            const response = await invoicesAPI.getProjectInvoices(projectId);
            if (response.success) {
                setInvoices(response.data.invoices || []);
            }
        } catch (error) {
            console.error('Load invoices error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadInvoices();
        setRefreshing(false);
    };

    const getStatusStyle = (status) => {
        const colors = {
            draft: { bg: COLORS.textMuted + '20', text: COLORS.textMuted },
            sent: { bg: COLORS.primary + '20', text: COLORS.primary },
            viewed: { bg: COLORS.warning + '20', text: COLORS.warning },
            paid: { bg: COLORS.success + '20', text: COLORS.success },
            overdue: { bg: COLORS.danger + '20', text: COLORS.danger },
            cancelled: { bg: COLORS.textMuted + '20', text: COLORS.textMuted },
        };
        return colors[status] || colors.draft;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatCurrency = (amount) => {
        return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    };

    const renderInvoice = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);

        return (
            <TouchableOpacity
                style={styles.invoiceCard}
                onPress={() => navigation.navigate('ViewInvoice', { invoice: item })}
                activeOpacity={0.8}
            >
                <View style={styles.invoiceHeader}>
                    <View>
                        <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
                        <Text style={styles.invoiceClient}>
                            {item.clientId?.firstName} {item.clientId?.lastName}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.invoiceDetails}>
                    <View style={styles.detailItem}>
                        <Feather name="calendar" size={14} color={COLORS.textMuted} />
                        <Text style={styles.detailText}>
                            Due: {formatDate(item.dueDate)}
                        </Text>
                    </View>
                    <Text style={styles.invoiceAmount}>
                        {formatCurrency(item.totalAmount)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.sectionLabel}>Project Invoices</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('CreateInvoice', { projectId })}
                >
                    <Feather name="plus" size={18} color={COLORS.background} />
                    <Text style={styles.addBtnText}>Create</Text>
                </TouchableOpacity>
            </View>

            {/* Invoice List */}
            {invoices.length === 0 ? (
                <View style={styles.emptyState}>
                    <Feather name="file-text" size={48} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>No Invoices Yet</Text>
                    <Text style={styles.emptyText}>Create your first invoice for this project</Text>
                    <TouchableOpacity
                        style={styles.createBtn}
                        onPress={() => navigation.navigate('CreateInvoice', { projectId })}
                    >
                        <Feather name="plus" size={20} color={COLORS.background} />
                        <Text style={styles.createBtnText}>Create Invoice</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={invoices}
                    renderItem={renderInvoice}
                    keyExtractor={(item) => item._id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.invoiceList}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
    },
    addBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.background,
    },
    invoiceList: {
        gap: 12,
    },
    invoiceCard: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    invoiceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    invoiceNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    invoiceClient: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    invoiceDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    invoiceAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.primary,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 4,
        marginBottom: 20,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 8,
    },
    createBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.background,
    },
});

export default InvoicesListTab;

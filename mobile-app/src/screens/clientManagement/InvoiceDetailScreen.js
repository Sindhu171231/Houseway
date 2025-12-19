import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Linking,
    Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import WaveHeader from '../../components/clientManagement/WaveHeader';
import BottomNavBar from '../../components/common/BottomNavBar';

const COLORS = {
    primary: '#FFD700',
    background: '#0D0D0D',
    cardBg: '#1A1A1A',
    text: '#FFFFFF',
    textMuted: '#888888',
    success: '#00C853',
    warning: '#FFB300',
    danger: '#FF5252',
};

const InvoiceDetailScreen = ({ route, navigation }) => {
    // Expecting invoice object or invoiceId
    // For now, let's assume we update InvoicesListTab to pass the whole object, 
    // or we handle invoiceId if needed (requires fetching).
    // Given the constraints, I will update InvoicesListTab to pass 'invoice' object.
    const { invoice } = route.params || {};

    if (!invoice) {
        return (
            <View style={styles.container}>
                <WaveHeader title="Invoice Details" height={100} showBackButton backButtonPress={() => navigation.goBack()} />
                <View style={styles.content}>
                    <Text style={{ color: COLORS.text }}>Invoice not found</Text>
                </View>
            </View>
        );
    }

    const handleViewPDF = async () => {
        const attachment = invoice.attachments && invoice.attachments[0];
        if (attachment && attachment.url) {
            try {
                const supported = await Linking.canOpenURL(attachment.url);
                if (supported) {
                    await Linking.openURL(attachment.url);
                } else {
                    Alert.alert("Error", "Cannot open this URL: " + attachment.url);
                }
            } catch (err) {
                console.error('An error occurred', err);
                Alert.alert("Error", "Failed to open PDF");
            }
        } else {
            Alert.alert("Error", "No PDF attachment found for this invoice");
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString();
    const formatCurrency = (amount) => `₹${(amount || 0).toFixed(2)}`;

    return (
        <View style={styles.container}>
            <WaveHeader
                title={invoice.invoiceNumber}
                subtitle={`Issued: ${formatDate(invoice.issueDate)}`}
                height={180}
                showBackButton
                backButtonPress={() => navigation.goBack()}
            />

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Status Card */}
                <View style={styles.card}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Status</Text>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getStatusColor(invoice.status) }]}>
                                {invoice.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Due Date</Text>
                        <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Total Amount</Text>
                        <Text style={[styles.value, { color: COLORS.primary, fontSize: 20, fontWeight: 'bold' }]}>
                            {formatCurrency(invoice.totalAmount)}
                        </Text>
                    </View>
                </View>

                {/* Line Items */}
                <Text style={styles.sectionTitle}>Line Items</Text>
                <View style={styles.card}>
                    {invoice.lineItems.map((item, index) => (
                        <View key={index} style={styles.lineItem}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemTitle}>{item.description}</Text>
                                <Text style={styles.itemSubtitle}>{item.quantity} x {formatCurrency(item.unitPrice)}</Text>
                            </View>
                            <Text style={styles.itemTotal}>{formatCurrency(item.total)}</Text>
                        </View>
                    ))}
                    <View style={[styles.divider, { marginVertical: 10 }]} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Subtotal</Text>
                        <Text style={styles.value}>{formatCurrency(invoice.subtotal)}</Text>
                    </View>
                    {invoice.taxAmount > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.label}>Tax ({invoice.taxRate}%)</Text>
                            <Text style={styles.value}>{formatCurrency(invoice.taxAmount)}</Text>
                        </View>
                    )}
                    <View style={[styles.divider, { marginVertical: 10 }]} />
                    <View style={styles.row}>
                        <Text style={styles.label}>Total</Text>
                        <Text style={[styles.value, { color: COLORS.primary }]}>{formatCurrency(invoice.totalAmount)}</Text>
                    </View>
                </View>

                {/* Actions */}
                <TouchableOpacity style={styles.pdfButton} onPress={handleViewPDF}>
                    <Feather name="file-text" size={20} color={COLORS.background} />
                    <Text style={styles.pdfButtonText}>View / Download PDF</Text>
                </TouchableOpacity>

            </ScrollView>
            <BottomNavBar navigation={navigation} activeTab="projects" />
        </View>
    );
};

const getStatusColor = (status) => {
    switch (status) {
        case 'paid': return COLORS.success;
        case 'overdue': return COLORS.danger;
        case 'sent': return COLORS.primary;
        default: return COLORS.textMuted;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    card: {
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#333',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    label: {
        color: COLORS.textMuted,
        fontSize: 14,
    },
    value: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    sectionTitle: {
        color: COLORS.textMuted,
        marginBottom: 10,
        textTransform: 'uppercase',
        fontSize: 12,
        fontWeight: 'bold',
    },
    lineItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '500',
    },
    itemSubtitle: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    itemTotal: {
        color: COLORS.text,
        fontWeight: '600',
    },
    pdfButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
        gap: 8,
    },
    pdfButtonText: {
        color: COLORS.background,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default InvoiceDetailScreen;

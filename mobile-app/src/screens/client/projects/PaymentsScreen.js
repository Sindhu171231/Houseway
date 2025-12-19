import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { useNavigation, useRoute } from "@react-navigation/native";
import { purchaseOrdersAPI, filesAPI, projectsAPI, clientsAPI } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";



const PaymentPage = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { projectId } = route.params || {};
  const { user } = useAuth();

  const [payments, setPayments] = useState({ schedule: [], invoices: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState(null);

  // Fetch project payment data
  useEffect(() => {
    if (projectId) {
      loadProjectPayments();
    } else {
      setIsLoading(false);
      Alert.alert('Error', 'No project selected');
    }
  }, [projectId]);

  const loadProjectPayments = async () => {
    try {
      setIsLoading(true);

      const [projectResponse, poResponse] = await Promise.all([
        projectsAPI.getProjectById(projectId),
        purchaseOrdersAPI.getByProject(projectId),
      ]);

      let schedule = [];
      let invoices = [];

      if (projectResponse.success && projectResponse.data.project) {
        const projectData = projectResponse.data.project;
        setProject(projectData);

        // Use real payment schedule if available
        if (projectData.paymentSchedule && projectData.paymentSchedule.length > 0) {
          schedule = projectData.paymentSchedule.map(item => ({
            id: item.id || item._id || Math.random().toString(),
            type: item.name || 'Installation',
            amount: item.amount || 0,
            status: item.status || 'pending',
            dueDate: item.dueDate
          }));
        }

        // Load invoices from clientProjectInvoices if user is client
        if (user && user.role === 'client') {
          try {
            const invRes = await clientsAPI.getClientProjectInvoices(user._id, projectId);
            if (invRes.success) {
              invoices = (invRes.data.invoices || []).map((inv, index) => ({
                id: inv._id || `invoice-${index}`,
                project: projectData.title || 'Current Project',
                invoiceNo: inv.invoiceNumber || `INV-${index + 1}`,
                status: inv.status,
                fileUrl: inv.attachments?.[0]?.url || null,
                uploadedAt: inv.createdAt,
                total: inv.totalAmount,
              }));
            }
          } catch (e) {
            console.log("Error loading invoices for client:", e);
          }
        }
      }

      setPayments({ schedule, invoices });
    } catch (error) {
      console.error('Error loading project payments:', error);
      Alert.alert('Error', 'Failed to load payment information');
      setPayments({ schedule: [], invoices: [] });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle download functionality
  const handleInvoiceAction = async (invoice) => {
    try {
      if (!invoice.fileUrl) {
        Alert.alert("No Attachment", "This invoice has no file to download.");
        return;
      }
      const downloadResumable = FileSystem.createDownloadResumable(
        invoice.fileUrl,
        FileSystem.documentDirectory + `Invoice_${invoice.invoiceNo}.pdf`
      );

      const { uri } = await downloadResumable.downloadAsync();

      Alert.alert("Download Complete", `Saved to: ${uri}`);
      const updatedInvoices = payments.invoices.map((inv) =>
        inv.id === invoice.id ? { ...inv, status: "downloaded" } : inv
      );
      setPayments({ ...payments, invoices: updatedInvoices });
    } catch (error) {
      Alert.alert("Download Failed", "Unable to download invoice.");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1A3A5A" />
        <Text style={styles.loadingText}>Loading payment information...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A3A5A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Schedule</Text>
          {payments.schedule.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No payment schedule available</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {payments.schedule.map((item, index) => (
                <View key={item.id}>
                  <View style={styles.scheduleRow}>
                    <View>
                      <Text style={styles.textPrimary}>{item.type}</Text>
                      {item.dueDate && (
                        <Text style={styles.textSecondary}>
                          Due: {new Date(item.dueDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.textPrimary}>
                        ₹{(item.amount || 0).toLocaleString()}
                      </Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: item.status === 'paid' ? 'rgba(0,128,0,0.1)' : 'rgba(255,165,0,0.1)' }
                      ]}>
                        <Text style={[
                          styles.statusText,
                          { color: item.status === 'paid' ? COLORS.success : COLORS.warning }
                        ]}>
                          {item.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {index !== payments.schedule.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Invoices */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoices</Text>
          {payments.invoices.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyText}>No invoices available</Text>
            </View>
          ) : (
            <FlatList
              data={payments.invoices}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 12 }}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.invoiceCard}>
                  <View style={styles.invoiceLeft}>
                    <View style={styles.invoiceIcon}>
                      <Ionicons name="document-text-outline" size={24} color="#1A3A5A" />
                    </View>
                    <View>
                      <Text style={styles.textPrimary}>{item.project}</Text>
                      <Text style={styles.textSecondary}>Invoice #{item.invoiceNo}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.downloadBtn,
                      item.status === "downloaded" && { backgroundColor: "#BFA46F" },
                    ]}
                    onPress={() => handleInvoiceAction(item)}
                  >
                    <Ionicons
                      name={
                        item.status === "downloaded"
                          ? "checkmark-circle"
                          : "cloud-download-outline"
                      }
                      size={20}
                      color="white"
                    />
                    <Text style={[styles.btnText, { marginLeft: 6 }]}>
                      {item.status === "downloaded" ? "Downloaded" : "Download"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {/* Secure Payment Footer */}
      <TouchableOpacity style={styles.paymentBtn}>
        <Text style={styles.paymentBtnText}>Secure Payment</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default PaymentPage;

const COLORS = {
  primary: '#B8860B',        // Dark Golden Rod
  primaryLight: 'rgba(184, 134, 11, 0.15)',
  background: '#F5F5F0',     // Beige
  cardBg: '#FFFFFF',         // White
  cardBorder: 'rgba(184, 134, 11, 0.1)',
  text: '#1A1A1A',           // Dark text
  textMuted: '#666666',      // Muted text
  success: '#388E3C',
  warning: '#F57C00',
  danger: '#D32F2F',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 150,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  headerBtn: {
    padding: 8,
    borderRadius: 22,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  section: { marginVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, color: COLORS.text },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  scheduleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: 'center',
    marginVertical: 6
  },
  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 10 },
  invoiceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  invoiceLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  invoiceIcon: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadBtn: {
    flexDirection: "row",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  textPrimary: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  textSecondary: { fontSize: 14, color: COLORS.textMuted },
  btnText: { color: COLORS.cardBg, fontWeight: "700" },
  paymentBtn: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentBtnText: { color: COLORS.cardBg, fontSize: 18, fontWeight: "700", letterSpacing: 0.5 },
  centerContent: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textMuted },
  emptyText: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    paddingVertical: 20,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  }
});

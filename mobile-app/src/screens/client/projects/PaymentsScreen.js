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

      // Fetch project data and purchase orders
      const [projectResponse, poResponse, invoiceResponse] = await Promise.all([
        projectsAPI.getProjectById(projectId),
        purchaseOrdersAPI.getByProject(projectId),
        user ? clientsAPI.getClientProjectInvoices(user._id, projectId) : Promise.resolve({ success: false }),
      ]);

      let schedule = [];
      let invoices = [];

      // Process project data
      if (projectResponse.success && projectResponse.data.project) {
        setProject(projectResponse.data.project);
        
        // Create payment schedule from budget if available
        const projectData = projectResponse.data.project;
        if (projectData.budget?.estimated) {
          const totalBudget = projectData.budget.estimated;
          const actualSpent = projectData.budget?.actual || 0;
          const remaining = totalBudget - actualSpent;
          
          schedule = [
            { id: '1', type: 'Paid', amount: actualSpent },
            { id: '2', type: 'Remaining', amount: remaining > 0 ? remaining : 0 },
            { id: '3', type: 'Total Budget', amount: totalBudget },
          ];
        }
        
        // Extract invoice documents from project if available
        if (projectData.documents && projectData.documents.length > 0) {
          invoices = projectData.documents
            .filter(doc => doc.type === 'invoice')
            .map((doc, index) => ({
              id: doc._id || `invoice-${index}`,
              project: projectData.title || 'Current Project',
              invoiceNo: doc.name || `Invoice-${index + 1}`,
              status: null,
              fileUrl: doc.url || '',
              uploadedAt: doc.uploadedAt,
            }));
        }
      }

      // Process client invoices
      if (invoiceResponse?.success) {
        invoices = (invoiceResponse.data.invoices || []).map((inv, index) => ({
          id: inv._id || `invoice-${index}`,
          project: projectResponse?.data?.project?.title || 'Current Project',
          invoiceNo: inv.invoiceNumber || `INV-${index + 1}`,
          status: inv.status,
          fileUrl: inv.attachments?.[0]?.url || null,
          uploadedAt: inv.createdAt,
          total: inv.totalAmount,
        }));
      }

      // Process purchase orders for payment terms
      if (poResponse.success && poResponse.data.purchaseOrders?.length > 0) {
        poResponse.data.purchaseOrders.forEach(po => {
          if (po.paymentTerms?.advanceAmount) {
            schedule.push({
              id: `po-advance-${po._id}`,
              type: `Advance - PO#${po.orderNumber || 'N/A'}`,
              amount: po.paymentTerms.advanceAmount,
            });
          }
          if (po.paymentTerms?.balanceAmount) {
            schedule.push({
              id: `po-balance-${po._id}`,
              type: `Balance - PO#${po.orderNumber || 'N/A'}`,
              amount: po.paymentTerms.balanceAmount,
            });
          }
        });
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                    <Text style={styles.textSecondary}>{item.type}</Text>
                    <Text style={styles.textPrimary}>
                      ${item.amount.toLocaleString()}
                    </Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5DC" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F5F5DC",
  },
  headerBtn: { padding: 8, borderRadius: 999, backgroundColor: "#E0DACE" },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A3A5A",
    flex: 1,
    textAlign: "center",
  },
  section: { marginVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#1A3A5A" },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  scheduleRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  divider: { height: 1, backgroundColor: "#E0DACE", marginVertical: 8 },
  invoiceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  invoiceLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  invoiceIcon: {
    backgroundColor: "#E0DACE",
    borderRadius: 999,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadBtn: {
    flexDirection: "row",
    backgroundColor: "#1A3A5A",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  textPrimary: { fontSize: 16, fontWeight: "bold", color: "#1A3A5A" },
  textSecondary: { fontSize: 14, color: "#5C6B7A" },
  btnText: { color: "white", fontWeight: "600" },
  paymentBtn: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#1A3A5A",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
  },
  paymentBtnText: { color: "#F5F5DC", fontSize: 18, fontWeight: "600" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#1A3A5A" },
  emptyText: { fontSize: 14, color: "#999", textAlign: "center", paddingVertical: 8 },
});

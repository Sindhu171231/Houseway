import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { materialRequestsAPI, quotationsAPI } from "../../../utils/api";



const CatalogPage = () => {
  const route = useRoute();
  const { projectId } = route.params || {};
  
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch project catalog (material requests and quotations)
  useEffect(() => {
    if (projectId) {
      loadProjectCatalog();
    } else {
      setIsLoading(false);
      Alert.alert('Error', 'No project selected');
    }
  }, [projectId]);

  const loadProjectCatalog = async () => {
    try {
      setIsLoading(true);
      
      // Fetch material requests for this project
      const mrResponse = await materialRequestsAPI.getByProject(projectId);
      
      if (mrResponse.success && mrResponse.data.materialRequests?.length > 0) {
        // Group material requests by category
        const catalogSections = {};
        
        for (const mr of mrResponse.data.materialRequests) {
          const category = mr.category || 'General';
          
          if (!catalogSections[category]) {
            catalogSections[category] = {
              section: category,
              items: [],
            };
          }
          
          // Get quotations for this material request
          let vendorName = 'Pending';
          let quotationStatus = null;
          
          if (mr.assignedVendors && mr.assignedVendors.length > 0) {
            vendorName = mr.assignedVendors[0].vendor?.name || mr.assignedVendors[0].vendor?.companyName || 'Vendor Assigned';
          }
          
          // Map material request status to catalog status
          if (mr.status === 'approved') {
            quotationStatus = 'approved';
          } else if (mr.status === 'rejected') {
            quotationStatus = 'rejected';
          }
          
          catalogSections[category].items.push({
            id: mr._id,
            category: category,
            name: mr.title || 'Untitled Material',
            vendor: vendorName,
            image: mr.images?.[0]?.url || 'https://images.unsplash.com/photo-1616627981981-c22610e03c2f?auto=format&fit=crop&w=300&q=80',
            status: quotationStatus,
            description: mr.description || '',
          });
        }
        
        // Convert to array
        const catalogArray = Object.values(catalogSections);
        setCatalog(catalogArray);
      } else {
        setCatalog([]);
      }
    } catch (error) {
      console.error('Error loading project catalog:', error);
      Alert.alert('Error', 'Failed to load catalog');
      setCatalog([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update item status
  const handleStatusChange = (sectionIndex, itemIndex, status) => {
    const newCatalog = [...catalog];
    newCatalog[sectionIndex].items[itemIndex].status = status;
    setCatalog(newCatalog);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#0A2342" />
        <Text style={styles.loadingText}>Loading catalog...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#0A2342" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catalog</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {catalog.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>No catalog items available</Text>
            <Text style={styles.emptySubtext}>Items will appear here once material requests are created</Text>
          </View>
        ) : (
          catalog.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            {section.items.map((item, iIdx) => (
            <View key={item.id} style={styles.card}>
                <View style={styles.cardContent}>
                <View style={styles.cardText}>
                    <Text style={styles.cardCategory}>{item.category}</Text>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardVendor}>
                    Vendor: <Text style={styles.vendorLink}>{item.vendor}</Text>
                    </Text>
                </View>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                </View>

                <View style={styles.cardButtons}>
                {item.status === "approved" ? (
                    <View style={[styles.approveBtn, { backgroundColor: "#BFA46F" }]}>
                    <Ionicons name="checkmark-circle" size={18} color="white" />
                    <Text style={[styles.btnText, { color: "white", marginLeft: 6 }]}>
                        Approved
                    </Text>
                    </View>
                ) : item.status === "rejected" ? (
                    <View style={[styles.rejectBtn, { backgroundColor: "#FECACA" }]}>
                    <Ionicons name="close-circle" size={18} color="#0A2342" />
                    <Text style={[styles.btnText, { marginLeft: 6 }]}>Rejected</Text>
                    </View>
                ) : (
                    <>
                    <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleStatusChange(sIdx, iIdx, "approved")}
                    >
                        <Ionicons name="checkmark-circle" size={18} color="white" />
                        <Text style={[styles.btnText, { color: "white", marginLeft: 6 }]}>
                        Approve
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleStatusChange(sIdx, iIdx, "rejected")}
                    >
                        <Ionicons name="close-circle" size={18} color="#0A2342" />
                        <Text style={[styles.btnText, { marginLeft: 6 }]}>Reject</Text>
                    </TouchableOpacity>
                    </>
                )}
                </View>
            </View>
            ))}
          </View>
          ))
        )}
      </ScrollView>
      
    </View>
  );
};

export default CatalogPage;

// ------------------ Styles ------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F0E6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    backgroundColor: "#F5F0E6",
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#0A2342" },
  scrollContent: { padding: 16, paddingBottom: 80 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#0A2342", marginBottom: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    marginBottom: 16,
    padding: 16,
  },
  cardContent: { flexDirection: "row", gap: 16, alignItems: "center" },
  cardText: { flex: 1 },
  cardCategory: { fontSize: 12, color: "#5C6A7D", fontWeight: "500" },
  cardName: { fontSize: 16, fontWeight: "bold", color: "#0A2342" },
  cardVendor: { fontSize: 12, color: "#5C6A7D" },
  vendorLink: { textDecorationLine: "underline", color: "#D4AF7C" },
  cardImage: { width: 100, height: 100, borderRadius: 12 },
  cardButtons: { flexDirection: "row", marginTop: 12, gap: 8 },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#D4AF7C",
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#E6E6E6",
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
  },
  btnText: { fontWeight: "600", fontSize: 14 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#F5F0E6",
  },
  navItem: { alignItems: "center", gap: 2 },
  navText: { fontSize: 10, color: "#5C6A7D" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 16, fontSize: 16, color: "#0A2342" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#999", marginTop: 16 },
  emptySubtext: { fontSize: 14, color: "#666", marginTop: 8, textAlign: "center", paddingHorizontal: 32 },
});

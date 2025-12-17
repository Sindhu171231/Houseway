import React, { useEffect, useState } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Modal, Linking, Alert } from 'react-native';
import AppHeader from '../components/AppHeader';
import theme from '../../../styles/theme';
import { purchaseOrdersAPI } from '../../../utils/api';

export default function PaymentsInvoices({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    load(); 
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await purchaseOrdersAPI.getMyOrders();
      if (res.success) {
        setInvoices(res.data.purchaseOrders || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      Alert.alert('Error', 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading invoices...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor: theme.colors.background }}>
      <AppHeader title="Payments & Invoices" onMenu={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={{ backgroundColor: theme.colors.card, padding: 12, borderRadius: theme.radius, marginBottom: 12 }}>
          <Text style={{ color: theme.colors.text }}>Purchase orders are created by company employees.</Text>
        </View>

        {invoices.map(inv => (
          <View key={inv._id} style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>{inv.project?.title || 'Untitled Project'}</Text>
              <Text style={{ backgroundColor: theme.colors.warning, paddingHorizontal: 8, borderRadius: 12 }}>
                {inv.status}
              </Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight:'700', marginTop:8 }}>
              ${(inv.totalAmount || 0).toLocaleString()}
            </Text>
            <Text style={{ color: theme.colors.muted }}>
              {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Date not available'}
            </Text>
            <TouchableOpacity 
              style={{ marginTop: 12, backgroundColor: '#f0f0f0', padding:12, borderRadius: 10 }} 
              onPress={() => setSelected(inv)}
            >
              <Text style={{ textAlign:'center' }}>View Details</Text>
            </TouchableOpacity>
          </View>
        ))}
        {invoices.length === 0 && (
          <Text style={{ color: theme.colors.muted, textAlign: 'center', marginTop: 20 }}>
            No purchase orders found
          </Text>
        )}
      </ScrollView>

      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.4)' }}>
          <View style={{ width:'90%', backgroundColor:'#fff', borderRadius: 14, padding: 16 }}>
            <Text style={{ fontSize:18, fontWeight:'700' }}>Purchase Order Details</Text>
            <Text style={{ marginTop:12 }}>Project: {selected?.project?.title || 'Untitled Project'}</Text>
            <Text>Amount: ${(selected?.totalAmount || 0).toLocaleString()}</Text>
            <Text>Status: {selected?.status || 'Unknown'}</Text>
            <Text>Date: {selected?.createdAt ? new Date(selected.createdAt).toLocaleDateString() : 'Date not available'}</Text>
            <Text style={{ marginTop:12, color: theme.colors.muted }}>
              This is a read-only document. For any changes, contact admin.
            </Text>
            <TouchableOpacity 
              style={{ marginTop:16, backgroundColor: theme.colors.primary, padding:12, borderRadius:12 }} 
              onPress={() => {
                if (selected?.documentUrl) {
                  Linking.openURL(selected.documentUrl);
                } else {
                  Alert.alert('Error', 'Document not available');
                }
              }}
            >
              <Text style={{ color:'#fff', textAlign:'center' }}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ marginTop:8 }} 
              onPress={() => setSelected(null)}
            >
              <Text style={{ textAlign:'center', color: theme.colors.muted }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
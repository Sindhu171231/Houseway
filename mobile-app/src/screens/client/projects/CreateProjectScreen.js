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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
// Using a custom picker solution for better cross-platform compatibility
import { useAuth } from '../../../context/AuthContext';
import { projectsAPI, usersAPI } from '../../../utils/api';

const CreateProjectScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [executionTeam, setExecutionTeam] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectType: 'residential',
    designStyle: 'modern',
    priority: 'medium',
    client: '',
    assignedEmployee: '', // Execution team member
    budget: {
      estimated: '',
      currency: 'USD',
    },
    paymentDeadlines: {
      firstPayment: '',
      secondPayment: '',
      thirdPayment: '',
    },
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA',
    },
    specifications: {
      area: '',
      areaUnit: 'sqft',
      floors: '',
      bedrooms: '',
      bathrooms: '',
      parking: '',
    },
  });

  useEffect(() => {
    loadClientsAndTeam();
  }, []);

  const loadClientsAndTeam = async () => {
    try {
      // Load clients and employees in parallel
      const [clientsRes, employeesRes] = await Promise.all([
        usersAPI.getUsers({ role: 'client', limit: 100 }),
        usersAPI.getUsers({ role: 'employee', limit: 100 }),
      ]);

      if (clientsRes.success) {
        setClients(clientsRes.data.users || []);
      }

      if (employeesRes.success) {
        // Filter employees with executionTeam subRole
        const employees = employeesRes.data.users || [];
        const execTeam = employees.filter(e =>
          e.subRole === 'executionTeam' || !e.subRole // Include all employees if no subRole filter needed
        );
        setExecutionTeam(execTeam);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleInputChange = (field, value, nested = null) => {
    if (nested) {
      setFormData(prev => ({
        ...prev,
        [nested]: {
          ...prev[nested],
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Project title is required');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Project description is required');
      return false;
    }
    if (!formData.client) {
      Alert.alert('Validation Error', 'Please select a client');
      return false;
    }
    if (!formData.budget.estimated || isNaN(formData.budget.estimated)) {
      Alert.alert('Validation Error', 'Please enter a valid budget amount');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // Build assigned employees array
      const assignedEmployees = [user._id];
      if (formData.assignedEmployee) {
        assignedEmployees.push(formData.assignedEmployee);
      }

      const projectData = {
        ...formData,
        budget: {
          ...formData.budget,
          estimated: parseFloat(formData.budget.estimated),
          actual: 0,
        },
        specifications: {
          ...formData.specifications,
          area: formData.specifications.area ? parseInt(formData.specifications.area) : 0,
          floors: formData.specifications.floors ? parseInt(formData.specifications.floors) : 1,
          bedrooms: formData.specifications.bedrooms ? parseInt(formData.specifications.bedrooms) : 0,
          bathrooms: formData.specifications.bathrooms ? parseInt(formData.specifications.bathrooms) : 0,
          parking: formData.specifications.parking ? parseInt(formData.specifications.parking) : 0,
        },
        paymentDeadlines: {
          firstPayment: formData.paymentDeadlines.firstPayment ? new Date(formData.paymentDeadlines.firstPayment) : null,
          secondPayment: formData.paymentDeadlines.secondPayment ? new Date(formData.paymentDeadlines.secondPayment) : null,
          thirdPayment: formData.paymentDeadlines.thirdPayment ? new Date(formData.paymentDeadlines.thirdPayment) : null,
        },
        status: 'planning',
        progress: {
          percentage: 0,
          milestones: [],
        },
        assignedEmployees,
        createdBy: user._id,
      };

      const response = await projectsAPI.createProject(projectData);

      if (response.success) {
        const projectId = response.data?.project?._id || response.data?._id;

        if (Platform.OS === 'web') {
          const createInvoice = window.confirm('Project created successfully! Would you like to create an invoice for this project?');
          if (createInvoice && projectId) {
            navigation.replace('CreateInvoice', { projectId });
          } else {
            navigation.goBack();
          }
        } else {
          Alert.alert(
            '✅ Project Created!',
            'Would you like to create an invoice for this project?',
            [
              {
                text: 'Later',
                style: 'cancel',
                onPress: () => navigation.goBack(),
              },
              {
                text: 'Create Invoice',
                onPress: () => {
                  if (projectId) {
                    navigation.replace('CreateInvoice', { projectId });
                  } else {
                    navigation.goBack();
                  }
                },
              },
            ]
          );
        }
      } else {
        Alert.alert('Error', response.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Error', 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const FormSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={{ ...styles.input, ...(multiline && styles.multilineInput) }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );

  const PickerField = ({ label, selectedValue, onValueChange, items }) => {
    const [showPicker, setShowPicker] = useState(false);

    const selectedItem = items.find(item => item.value === selectedValue);

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={{ ...styles.pickerButtonText, ...(!selectedItem && styles.placeholderText) }}>
            {selectedItem ? selectedItem.label : 'Select an option'}
          </Text>
          <Text style={styles.pickerArrow}>▼</Text>
        </TouchableOpacity>

        {showPicker && (
          <View style={styles.pickerModal}>
            <View style={styles.pickerContent}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>{label}</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerOptions}>
                {items.map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={{
                      ...styles.pickerOption,
                      ...(selectedValue === item.value && styles.selectedOption)
                    }}
                    onPress={() => {
                      onValueChange(item.value);
                      setShowPicker(false);
                    }}
                  >
                    <Text style={{
                      ...styles.pickerOptionText,
                      ...(selectedValue === item.value && styles.selectedOptionText)
                    }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Feather name="arrow-left" size={24} color="#FFD700" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Create New Project</Text>
            <Text style={styles.headerSubtitle}>Fill in the project details</Text>
          </View>
        </View>

        <FormSection title="Basic Information">
          <InputField
            label="Project Title *"
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder="Enter project title"
          />

          <InputField
            label="Description *"
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder="Describe the project"
            multiline={true}
          />

          <PickerField
            label="Project Type"
            selectedValue={formData.projectType}
            onValueChange={(value) => handleInputChange('projectType', value)}
            items={[
              { label: 'Residential', value: 'residential' },
              { label: 'Commercial', value: 'commercial' },
              { label: 'Renovation', value: 'renovation' },
              { label: 'Interior Design', value: 'interior' },
            ]}
          />

          <PickerField
            label="Design Style"
            selectedValue={formData.designStyle}
            onValueChange={(value) => handleInputChange('designStyle', value)}
            items={[
              { label: 'Modern', value: 'modern' },
              { label: 'Contemporary', value: 'contemporary' },
              { label: 'Traditional', value: 'traditional' },
              { label: 'Minimalist', value: 'minimalist' },
              { label: 'Industrial', value: 'industrial' },
              { label: 'Rustic', value: 'rustic' },
            ]}
          />

          <PickerField
            label="Priority"
            selectedValue={formData.priority}
            onValueChange={(value) => handleInputChange('priority', value)}
            items={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
            ]}
          />

          <PickerField
            label="Client *"
            selectedValue={formData.client}
            onValueChange={(value) => handleInputChange('client', value)}
            items={[
              { label: 'Select a client', value: '' },
              ...clients.map(client => ({
                label: `${client.firstName} ${client.lastName}`,
                value: client._id,
              })),
            ]}
          />

          <PickerField
            label="Assign Execution Team Member"
            selectedValue={formData.assignedEmployee}
            onValueChange={(value) => handleInputChange('assignedEmployee', value)}
            items={[
              { label: 'No team member assigned', value: '' },
              ...executionTeam.map(emp => ({
                label: `${emp.firstName} ${emp.lastName} ${emp.subRole ? `(${emp.subRole})` : ''}`,
                value: emp._id,
              })),
            ]}
          />
        </FormSection>

        <FormSection title="Budget & Payment Schedule">
          <InputField
            label="Estimated Budget *"
            value={formData.budget.estimated}
            onChangeText={(value) => handleInputChange('estimated', value, 'budget')}
            placeholder="Enter budget amount"
            keyboardType="numeric"
          />

          <InputField
            label="1st Payment Deadline"
            value={formData.paymentDeadlines.firstPayment}
            onChangeText={(value) => handleInputChange('firstPayment', value, 'paymentDeadlines')}
            placeholder="YYYY-MM-DD"
          />

          <InputField
            label="2nd Payment Deadline"
            value={formData.paymentDeadlines.secondPayment}
            onChangeText={(value) => handleInputChange('secondPayment', value, 'paymentDeadlines')}
            placeholder="YYYY-MM-DD"
          />

          <InputField
            label="3rd Payment Deadline"
            value={formData.paymentDeadlines.thirdPayment}
            onChangeText={(value) => handleInputChange('thirdPayment', value, 'paymentDeadlines')}
            placeholder="YYYY-MM-DD"
          />
        </FormSection>

        <FormSection title="Location">
          <InputField
            label="Address"
            value={formData.location.address}
            onChangeText={(value) => handleInputChange('address', value, 'location')}
            placeholder="Street address"
          />

          <InputField
            label="City"
            value={formData.location.city}
            onChangeText={(value) => handleInputChange('city', value, 'location')}
            placeholder="City"
          />

          <InputField
            label="State"
            value={formData.location.state}
            onChangeText={(value) => handleInputChange('state', value, 'location')}
            placeholder="State"
          />

          <InputField
            label="ZIP Code"
            value={formData.location.zipCode}
            onChangeText={(value) => handleInputChange('zipCode', value, 'location')}
            placeholder="ZIP Code"
            keyboardType="numeric"
          />
        </FormSection>

        <FormSection title="Specifications">
          <InputField
            label="Total Area (sq ft)"
            value={formData.specifications.area}
            onChangeText={(value) => handleInputChange('area', value, 'specifications')}
            placeholder="Total area"
            keyboardType="numeric"
          />

          <InputField
            label="Number of Floors"
            value={formData.specifications.floors}
            onChangeText={(value) => handleInputChange('floors', value, 'specifications')}
            placeholder="Number of floors"
            keyboardType="numeric"
          />

          <InputField
            label="Bedrooms"
            value={formData.specifications.bedrooms}
            onChangeText={(value) => handleInputChange('bedrooms', value, 'specifications')}
            placeholder="Number of bedrooms"
            keyboardType="numeric"
          />

          <InputField
            label="Bathrooms"
            value={formData.specifications.bathrooms}
            onChangeText={(value) => handleInputChange('bathrooms', value, 'specifications')}
            placeholder="Number of bathrooms"
            keyboardType="numeric"
          />

          <InputField
            label="Parking Spaces"
            value={formData.specifications.parking}
            onChangeText={(value) => handleInputChange('parking', value, 'specifications')}
            placeholder="Number of parking spaces"
            keyboardType="numeric"
          />
        </FormSection>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ ...styles.submitButton, ...(isLoading && styles.disabledButton) }}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Project</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2d2d2d',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.2)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  backButton: {
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  section: {
    backgroundColor: '#2d2d2d',
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    backgroundColor: '#333',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 8,
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  placeholderText: {
    color: '#888',
  },
  pickerArrow: {
    fontSize: 12,
    color: '#FFD700',
  },
  pickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pickerContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,215,0,0.2)',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  pickerClose: {
    fontSize: 18,
    color: '#aaa',
    padding: 4,
  },
  pickerOptions: {
    maxHeight: 300,
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  selectedOption: {
    backgroundColor: 'rgba(255,215,0,0.2)',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#fff',
  },
  selectedOptionText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2d2d2d',
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#444',
    paddingVertical: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
});

export default CreateProjectScreen;

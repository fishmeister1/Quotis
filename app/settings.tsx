import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useInvoices } from '@/hooks/invoice-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { Database, AlertCircle, RefreshCw, Trash2, Download, Upload } from 'lucide-react-native';

export default function SettingsScreen() {
  const { invoices, clients, items, saveClient, addItem } = useInvoices();
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const checkAsyncStorage = async () => {
    try {
      setIsLoading(true);
      const keys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(keys);
      
      let info = '=== AsyncStorage Debug ===\n\n';
      
      for (const [key, value] of allData) {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            const itemCount = Array.isArray(parsed) ? parsed.length : 'N/A';
            info += `📦 ${key}:\n`;
            info += `  - Size: ${value.length} chars\n`;
            info += `  - Items: ${itemCount}\n`;
            info += `  - Valid JSON: ✅\n\n`;
          } catch (e) {
            info += `❌ ${key}:\n`;
            info += `  - Size: ${value.length} chars\n`;
            info += `  - Valid JSON: ❌ (corrupted)\n`;
            info += `  - Preview: ${value.substring(0, 50)}...\n\n`;
          }
        }
      }
      
      info += `\n=== Current State ===\n`;
      info += `Invoices: ${invoices.length}\n`;
      info += `Clients: ${clients.length}\n`;
      info += `Items: ${items.length}\n`;
      
      setDebugInfo(info);
      console.log(info);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo('Error reading AsyncStorage: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const attemptDataRecovery = async () => {
    Alert.alert(
      'Attempt Data Recovery',
      'This will try to recover any corrupted data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Recover',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Check each storage key
              const keys = ['clients', 'items', 'invoices'];
              let recoveryLog = '';
              
              for (const key of keys) {
                const raw = await AsyncStorage.getItem(key);
                
                if (raw && raw !== 'undefined' && raw !== 'null') {
                  try {
                    JSON.parse(raw);
                    recoveryLog += `✅ ${key}: Valid JSON, no recovery needed\n`;
                  } catch (e) {
                    recoveryLog += `⚠️ ${key}: Corrupted, attempting recovery...\n`;
                    
                    // Try to extract valid JSON arrays
                    const arrayMatch = raw.match(/\[.*\]/);
                    if (arrayMatch) {
                      try {
                        const recovered = JSON.parse(arrayMatch[0]);
                        await AsyncStorage.setItem(key, JSON.stringify(recovered));
                        recoveryLog += `✅ ${key}: Recovered ${recovered.length} items\n`;
                      } catch (e2) {
                        await AsyncStorage.setItem(key, '[]');
                        recoveryLog += `❌ ${key}: Could not recover, reset to empty\n`;
                      }
                    } else {
                      await AsyncStorage.setItem(key, '[]');
                      recoveryLog += `❌ ${key}: No valid data found, reset to empty\n`;
                    }
                  }
                } else {
                  await AsyncStorage.setItem(key, '[]');
                  recoveryLog += `ℹ️ ${key}: Was empty, initialized\n`;
                }
              }
              
              Alert.alert('Recovery Complete', recoveryLog);
              
              // Reload the app to refresh data
              setTimeout(() => {
                router.replace('/');
              }, 1000);
              
            } catch (error) {
              Alert.alert('Recovery Failed', 'Error: ' + error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const addSampleData = async () => {
    Alert.alert(
      'Add Sample Data',
      'This will add sample clients and items to help you get started. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Add sample clients
              const sampleClients = [
                {
                  id: 'client-1',
                  name: 'John Smith',
                  email: 'john@example.com',
                  phone: '+1 234 567 8900',
                  company: 'Tech Solutions Inc.',
                  address: '123 Main St, New York, NY 10001',
                },
                {
                  id: 'client-2',
                  name: 'Sarah Johnson',
                  email: 'sarah@example.com',
                  phone: '+1 234 567 8901',
                  company: 'Creative Agency',
                  address: '456 Oak Ave, Los Angeles, CA 90001',
                },
              ];
              
              for (const client of sampleClients) {
                await saveClient(client);
              }
              
              // Add sample items
              const sampleItems = [
                {
                  name: 'Web Development',
                  description: 'Custom website development',
                  price: 2500,
                  tax: 20,
                },
                {
                  name: 'Logo Design',
                  description: 'Professional logo design package',
                  price: 500,
                  tax: 20,
                },
                {
                  name: 'Consultation',
                  description: 'Hourly consultation rate',
                  price: 150,
                  tax: 20,
                },
              ];
              
              for (const item of sampleItems) {
                await addItem(item);
              }
              
              Alert.alert('Success', 'Sample data added successfully!');
              
              // Reload to show new data
              setTimeout(() => {
                router.replace('/');
              }, 1000);
              
            } catch (error) {
              Alert.alert('Error', 'Failed to add sample data: ' + error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all invoices, clients, and items. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await AsyncStorage.multiRemove(['invoices', 'clients', 'items', 'lastInvoiceNumber']);
              Alert.alert('Success', 'All data cleared');
              
              setTimeout(() => {
                router.replace('/');
              }, 1000);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data: ' + error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings & Debug</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Invoices:</Text>
            <Text style={styles.statusValue}>{invoices.length}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Clients:</Text>
            <Text style={styles.statusValue}>{clients.length}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Items:</Text>
            <Text style={styles.statusValue}>{items.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={checkAsyncStorage}
          disabled={isLoading}
        >
          <Database size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Check Storage Status</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={attemptDataRecovery}
          disabled={isLoading}
        >
          <RefreshCw size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Attempt Data Recovery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={addSampleData}
          disabled={isLoading}
        >
          <Upload size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Add Sample Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearAllData}
          disabled={isLoading}
        >
          <Trash2 size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {debugInfo ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Information</Text>
          <View style={styles.debugCard}>
            <ScrollView style={styles.debugScroll}>
              <Text style={styles.debugText}>{debugInfo}</Text>
            </ScrollView>
          </View>
        </View>
      ) : null}

      <View style={styles.infoSection}>
        <AlertCircle size={20} color={Colors.textSecondary} />
        <Text style={styles.infoText}>
          If your data has disappeared, try "Attempt Data Recovery" first. 
          If that doesn't work, you can add sample data to get started again.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  warningButton: {
    backgroundColor: Colors.warning,
  },
  successButton: {
    backgroundColor: Colors.success,
  },
  dangerButton: {
    backgroundColor: Colors.danger,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  debugCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
  },
  debugScroll: {
    maxHeight: 250,
  },
  debugText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
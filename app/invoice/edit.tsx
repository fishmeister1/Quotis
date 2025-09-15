import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useInvoices } from '@/hooks/invoice-store';
import { Invoice, InvoiceItem, Client, Item, Attachment } from '@/types/invoice';
import { AttachmentManager } from '@/components/AttachmentManager';
import Colors from '@/constants/colors';
import { Plus, Trash2, Calendar, ChevronDown, X, Check, Package } from 'lucide-react-native';

export default function InvoiceEditScreen() {
  const { id } = useLocalSearchParams();
  const { invoices, clients, items: savedItems, saveInvoice, getNextInvoiceNumber } = useInvoices();
  const existingInvoice = id ? invoices.find((inv) => inv.id === id) : null;

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = useState('10');
  const [notes, setNotes] = useState('');
  const [issueDate, setIssueDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    if (existingInvoice) {
      setInvoiceNumber(existingInvoice.invoiceNumber);
      setSelectedClient(existingInvoice.client);
      setItems(existingInvoice.items);
      setTaxRate(existingInvoice.taxRate.toString());
      setNotes(existingInvoice.notes || '');
      setIssueDate(new Date(existingInvoice.issueDate));
      setDueDate(new Date(existingInvoice.dueDate));
      setAttachments(existingInvoice.attachments || []);
    } else {
      initializeNewInvoice();
    }
  }, []);

  const initializeNewInvoice = async () => {
    const nextNumber = await getNextInvoiceNumber();
    setInvoiceNumber(nextNumber);
  };

  const addItem = () => {
    setShowItemPicker(true);
  };

  const addCustomItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    }]);
  };

  const handleSelectItems = () => {
    const newItems = selectedItemIds.map(itemId => {
      const savedItem = savedItems.find(item => item.id === itemId);
      if (savedItem) {
        return {
          id: Date.now().toString() + Math.random(),
          description: savedItem.name,
          quantity: 1,
          rate: savedItem.price,
          amount: savedItem.price,
        };
      }
      return null;
    }).filter(Boolean) as InvoiceItem[];

    setItems([...items, ...newItems]);
    setSelectedItemIds([]);
    setShowItemPicker(false);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const updated = [...items];
    const item = updated[index];
    
    if (field === 'description') {
      item.description = value;
    } else if (field === 'quantity' || field === 'rate') {
      const numValue = parseFloat(value) || 0;
      item[field] = numValue;
      item.amount = item.quantity * item.rate;
    }
    
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (parseFloat(taxRate) || 0) / 100;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSave = async () => {
    if (!selectedClient) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    if (items.length === 0 || items.every(item => !item.description)) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    const { subtotal, tax, total } = calculateTotals();

    const invoice: Invoice = {
      id: existingInvoice?.id || Date.now().toString(),
      invoiceNumber,
      client: selectedClient,
      items: items.filter(item => item.description),
      subtotal,
      tax,
      taxRate: parseFloat(taxRate) || 0,
      total,
      status: existingInvoice?.status || 'draft',
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      notes,
      attachments,
      createdAt: existingInvoice?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sentAt: existingInvoice?.sentAt,
      paidAt: existingInvoice?.paidAt,
    };

    await saveInvoice(invoice);
    router.back();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const { subtotal, tax, total } = calculateTotals();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        {/* Invoice Number */}
        <View style={styles.section}>
          <Text style={styles.label}>Invoice Number</Text>
          <TextInput
            style={styles.input}
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            placeholder="INV-0001"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        {/* Client Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Client</Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowClientPicker(!showClientPicker)}
          >
            <Text style={selectedClient ? styles.pickerText : styles.pickerPlaceholder}>
              {selectedClient ? selectedClient.name : 'Select a client'}
            </Text>
            <ChevronDown size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {showClientPicker && (
            <View style={styles.clientList}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientOption}
                  onPress={() => {
                    setSelectedClient(client);
                    setShowClientPicker(false);
                  }}
                >
                  <Text style={styles.clientOptionText}>{client.name}</Text>
                  {client.company && (
                    <Text style={styles.clientOptionCompany}>{client.company}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Dates */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Issue Date</Text>
            <TouchableOpacity style={styles.input}>
              <Text style={styles.dateText}>
                {issueDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Due Date</Text>
            <TouchableOpacity style={styles.input}>
              <Text style={styles.dateText}>
                {dueDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <TextInput
                style={[styles.input, styles.itemDescription]}
                value={item.description}
                onChangeText={(text) => updateItem(index, 'description', text)}
                placeholder="Item description"
                placeholderTextColor={Colors.textSecondary}
              />
              
              <View style={styles.itemRow}>
                <View style={styles.itemField}>
                  <Text style={styles.itemLabel}>Qty</Text>
                  <TextInput
                    style={[styles.input, styles.itemInput]}
                    value={item.quantity.toString()}
                    onChangeText={(text) => updateItem(index, 'quantity', text)}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                
                <View style={styles.itemField}>
                  <Text style={styles.itemLabel}>Rate</Text>
                  <TextInput
                    style={[styles.input, styles.itemInput]}
                    value={item.rate.toString()}
                    onChangeText={(text) => updateItem(index, 'rate', text)}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
                
                <View style={styles.itemField}>
                  <Text style={styles.itemLabel}>Amount</Text>
                  <Text style={styles.itemAmount}>
                    {formatCurrency(item.amount)}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeItem(index)}
                >
                  <Trash2 size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          <View style={styles.addButtonsContainer}>
            <TouchableOpacity style={styles.addButton} onPress={addItem}>
              <Package size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>Select from Items</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.addButton, styles.addCustomButton]} onPress={addCustomItem}>
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addButtonText}>Add Custom</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tax Rate */}
        <View style={styles.section}>
          <Text style={styles.label}>Tax Rate (%)</Text>
          <TextInput
            style={styles.input}
            value={taxRate}
            onChangeText={setTaxRate}
            keyboardType="numeric"
            placeholder="10"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <AttachmentManager
            attachments={attachments}
            onAddAttachment={async (attachment) => {
              setAttachments([...attachments, attachment]);
            }}
            onRemoveAttachment={async (attachmentId) => {
              setAttachments(attachments.filter(att => att.id !== attachmentId));
            }}
            editable={true}
          />
        </View>

        {/* Totals */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax</Text>
            <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {existingInvoice ? 'Update Invoice' : 'Create Invoice'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Item Selection Modal */}
      <Modal
        visible={showItemPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowItemPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Items</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowItemPicker(false);
                  setSelectedItemIds([]);
                }}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {savedItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateText}>No items available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create items in the Items tab first
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={savedItems}
                  keyExtractor={(item) => item.id}
                  style={styles.itemsList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.selectableItem,
                        selectedItemIds.includes(item.id) && styles.selectedItem
                      ]}
                      onPress={() => toggleItemSelection(item.id)}
                    >
                      <View style={styles.selectableItemContent}>
                        <Text style={styles.selectableItemName}>{item.name}</Text>
                        {item.description && (
                          <Text style={styles.selectableItemDescription}>
                            {item.description}
                          </Text>
                        )}
                        <Text style={styles.selectableItemPrice}>
                          {formatCurrency(item.price)}
                        </Text>
                      </View>
                      {selectedItemIds.includes(item.id) && (
                        <View style={styles.checkIcon}>
                          <Check size={20} color={Colors.card} />
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                />

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowItemPicker(false);
                      setSelectedItemIds([]);
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modalConfirmButton,
                      selectedItemIds.length === 0 && styles.modalConfirmButtonDisabled
                    ]}
                    onPress={handleSelectItems}
                    disabled={selectedItemIds.length === 0}
                  >
                    <Text style={styles.modalConfirmText}>
                      Add {selectedItemIds.length > 0 ? `(${selectedItemIds.length})` : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  halfWidth: {
    flex: 1,
    paddingHorizontal: 0,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text,
  },
  picker: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  clientList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clientOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clientOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  clientOptionCompany: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemDescription: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  itemField: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  itemInput: {
    padding: 8,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    padding: 8,
  },
  removeButton: {
    padding: 8,
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  addCustomButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  totalsCard: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.card,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  itemsList: {
    maxHeight: 400,
  },
  selectableItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedItem: {
    backgroundColor: Colors.primaryLight,
  },
  selectableItemContent: {
    flex: 1,
    marginRight: 12,
  },
  selectableItemName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  selectableItemDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  selectableItemPrice: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalConfirmButtonDisabled: {
    opacity: 0.5,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.card,
  },
});
import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import { useExpenses } from '@/hooks/expense-store';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { 
  Receipt, 
  X, 
  Camera, 
  Image as ImageIcon,
  Calendar,
  Tag,
  Trash2,
  ChevronDown,
} from 'lucide-react-native';
import { 
  ExpenseCategory, 
  PaymentMethod,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from '@/types/expense';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ExpensesScreen() {
  const { 
    expenses, 
    addExpense, 
    deleteExpense,
    totalExpenses,
    totalTax,
    currentMonthExpenses,
  } = useExpenses();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  
  const [formData, setFormData] = useState<{
    date: Date;
    merchant: string;
    category: ExpenseCategory;
    description: string;
    subtotal: string;
    tax: string;
    total: string;
    paymentMethod: PaymentMethod;
    notes: string;
    receiptUri?: string;
  }>({
    date: new Date(),
    merchant: '',
    category: 'other',
    description: '',
    subtotal: '',
    tax: '',
    total: '',
    paymentMethod: 'credit_card',
    notes: '',
  });

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [expenses]);

  const currentMonthTotal = useMemo(() => {
    return currentMonthExpenses.reduce((sum, expense) => sum + expense.total, 0);
  }, [currentMonthExpenses]);

  const resetForm = () => {
    setFormData({
      date: new Date(),
      merchant: '',
      category: 'other',
      description: '',
      subtotal: '',
      tax: '',
      total: '',
      paymentMethod: 'credit_card',
      notes: '',
      receiptUri: undefined,
    });
  };

  const processReceiptWithAI = async (base64Image: string) => {
    try {
      setIsProcessing(true);
      
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a receipt scanner. Extract the merchant name, subtotal, tax amount, and total from the receipt image. Return ONLY a JSON object with these fields: { "merchant": "string", "subtotal": number, "tax": number, "total": number }. If you cannot find a value, use null.',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please extract the receipt information from this image.',
                },
                {
                  type: 'image',
                  image: base64Image,
                },
              ],
            },
          ],
        }),
      });

      const result = await response.json();
      
      if (result.completion) {
        try {
          const cleanedJson = result.completion.replace(/```json\n?|\n?```/g, '').trim();
          const extracted = JSON.parse(cleanedJson);
          
          setFormData(prev => ({
            ...prev,
            merchant: extracted.merchant || prev.merchant,
            subtotal: extracted.subtotal ? extracted.subtotal.toString() : prev.subtotal,
            tax: extracted.tax ? extracted.tax.toString() : prev.tax,
            total: extracted.total ? extracted.total.toString() : prev.total,
          }));
          
          Alert.alert('Success', 'Receipt information extracted successfully!');
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          Alert.alert('Error', 'Could not parse the receipt data. Please enter manually.');
        }
      }
    } catch (error) {
      console.error('AI processing error:', error);
      Alert.alert('Error', 'Failed to process receipt. Please enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    const result = await (useCamera 
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        }));

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFormData(prev => ({ ...prev, receiptUri: asset.uri }));
      
      if (asset.base64) {
        await processReceiptWithAI(asset.base64);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.merchant || !formData.total) {
      Alert.alert('Error', 'Please enter at least merchant name and total amount');
      return;
    }

    const subtotal = parseFloat(formData.subtotal) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const total = parseFloat(formData.total) || 0;

    await addExpense({
      date: formData.date.toISOString(),
      merchant: formData.merchant,
      category: formData.category,
      description: formData.description,
      subtotal,
      tax,
      total,
      receiptUri: formData.receiptUri,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
    });

    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteExpense(id),
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Expenses' }} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Expenses</Text>
            <Text style={styles.statValue}>{formatCurrency(totalExpenses)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Tax</Text>
            <Text style={styles.statValue}>{formatCurrency(totalTax)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>This Month</Text>
            <Text style={styles.statValue}>{formatCurrency(currentMonthTotal)}</Text>
          </View>
        </View>

        <View style={styles.expensesList}>
          {sortedExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Receipt size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first expense
              </Text>
            </View>
          ) : (
            sortedExpenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                style={styles.expenseCard}
                onPress={() => router.push(`/expense/${expense.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.merchantName}>{expense.merchant}</Text>
                    <Text style={styles.expenseDate}>{formatDate(expense.date)}</Text>
                  </View>
                  <View style={styles.expenseAmountContainer}>
                    <Text style={styles.expenseAmount}>{formatCurrency(expense.total)}</Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(expense.id)}
                      style={styles.deleteButton}
                    >
                      <Trash2 size={18} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.expenseFooter}>
                  <View style={styles.categoryBadge}>
                    <Tag size={12} color={Colors.primary} />
                    <Text style={styles.categoryText}>
                      {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label}
                    </Text>
                  </View>
                  {expense.description && (
                    <Text style={styles.expenseDescription} numberOfLines={1}>
                      {expense.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <FloatingActionButton onPress={() => setModalVisible(true)} />

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.processingText}>Scanning receipt...</Text>
              </View>
            )}

            <View style={styles.receiptSection}>
              <Text style={styles.sectionTitle}>Receipt</Text>
              {formData.receiptUri ? (
                <View style={styles.receiptPreview}>
                  <Image source={{ uri: formData.receiptUri }} style={styles.receiptImage} />
                  <TouchableOpacity
                    style={styles.removeReceiptButton}
                    onPress={() => setFormData(prev => ({ ...prev, receiptUri: undefined }))}
                  >
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.receiptButtons}>
                  <TouchableOpacity
                    style={styles.receiptButton}
                    onPress={() => pickImage(true)}
                  >
                    <Camera size={24} color={Colors.primary} />
                    <Text style={styles.receiptButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.receiptButton}
                    onPress={() => pickImage(false)}
                  >
                    <ImageIcon size={24} color={Colors.primary} />
                    <Text style={styles.receiptButtonText}>Choose Photo</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.formSection}>
              <Text style={styles.inputLabel}>Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={Colors.textSecondary} />
                <Text style={styles.dateText}>
                  {formData.date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'android');
                    if (date) setFormData(prev => ({ ...prev, date }));
                  }}
                />
              )}

              <Text style={styles.inputLabel}>Merchant</Text>
              <TextInput
                style={styles.input}
                value={formData.merchant}
                onChangeText={(text) => setFormData(prev => ({ ...prev, merchant: text }))}
                placeholder="Enter merchant name"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={styles.pickerText}>
                  {EXPENSE_CATEGORIES.find(c => c.value === formData.category)?.label}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={styles.pickerOptions}>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={styles.pickerOption}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, category: cat.value }));
                        setShowCategoryPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter description (optional)"
                placeholderTextColor={Colors.textSecondary}
              />

              <View style={styles.amountRow}>
                <View style={styles.amountField}>
                  <Text style={styles.inputLabel}>Subtotal</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.subtotal}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, subtotal: text }))}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.amountField}>
                  <Text style={styles.inputLabel}>Tax</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.tax}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, tax: text }))}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Total</Text>
              <TextInput
                style={[styles.input, styles.totalInput]}
                value={formData.total}
                onChangeText={(text) => setFormData(prev => ({ ...prev, total: text }))}
                placeholder="0.00"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Payment Method</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowPaymentPicker(!showPaymentPicker)}
              >
                <Text style={styles.pickerText}>
                  {PAYMENT_METHODS.find(p => p.value === formData.paymentMethod)?.label}
                </Text>
                <ChevronDown size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              {showPaymentPicker && (
                <View style={styles.pickerOptions}>
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      style={styles.pickerOption}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, paymentMethod: method.value }));
                        setShowPaymentPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{method.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                placeholder="Add any notes (optional)"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isProcessing && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isProcessing}
            >
              <Text style={styles.saveButtonText}>Save Expense</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
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
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  expensesList: {
    padding: 20,
    paddingTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  expenseCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expenseInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  expenseAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  expenseFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.primary,
    marginLeft: 4,
  },
  expenseDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.text,
  },
  receiptSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  receiptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  receiptButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
  receiptPreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeReceiptButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.danger,
    borderRadius: 20,
    padding: 8,
  },
  formSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerOptions: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 12,
  },
  amountField: {
    flex: 1,
  },
  totalInput: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
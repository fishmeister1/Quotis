import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useExpenses } from '@/hooks/expense-store';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Receipt,
  Calendar,
  Tag,
  CreditCard,
  FileText,
} from 'lucide-react-native';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/types/expense';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getExpenseById, deleteExpense } = useExpenses();
  
  const expense = getExpenseById(id!);

  if (!expense) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Expense Not Found' }} />
        <View style={styles.notFound}>
          <Receipt size={48} color={Colors.textSecondary} />
          <Text style={styles.notFoundText}>Expense not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteExpense(expense.id);
            router.back();
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
    });
  };

  const categoryLabel = EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label;
  const paymentMethodLabel = PAYMENT_METHODS.find(p => p.value === expense.paymentMethod)?.label;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Expense Details',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {/* TODO: Navigate to edit */}}
              >
                <Edit3 size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleDelete}
              >
                <Trash2 size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {expense.receiptUri && (
          <View style={styles.receiptContainer}>
            <Image source={{ uri: expense.receiptUri }} style={styles.receiptImage} />
          </View>
        )}
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.merchantName}>{expense.merchant}</Text>
            <Text style={styles.totalAmount}>{formatCurrency(expense.total)}</Text>
          </View>
          
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDate(expense.date)}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Tag size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{categoryLabel}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <CreditCard size={20} color={Colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{paymentMethodLabel}</Text>
              </View>
            </View>
          </View>
          
          {expense.description && (
            <View style={styles.descriptionCard}>
              <View style={styles.cardHeader}>
                <FileText size={20} color={Colors.primary} />
                <Text style={styles.cardTitle}>Description</Text>
              </View>
              <Text style={styles.description}>{expense.description}</Text>
            </View>
          )}
          
          <View style={styles.amountBreakdown}>
            <Text style={styles.breakdownTitle}>Amount Breakdown</Text>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(expense.subtotal)}</Text>
            </View>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Tax</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(expense.tax)}</Text>
            </View>
            
            <View style={[styles.breakdownRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(expense.total)}</Text>
            </View>
          </View>
          
          {expense.notes && (
            <View style={styles.notesCard}>
              <Text style={styles.cardTitle}>Notes</Text>
              <Text style={styles.notes}>{expense.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  receiptContainer: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  receiptImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  header: {
    marginBottom: 24,
  },
  merchantName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  descriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  amountBreakdown: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  notesCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  notes: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginTop: 8,
  },
});
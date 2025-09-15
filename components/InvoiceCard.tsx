import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Invoice } from '@/types/invoice';
import { StatusBadge } from './StatusBadge';
import Colors from '@/constants/colors';
import { ChevronRight } from 'lucide-react-native';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
}

export function InvoiceCard({ invoice, onPress }: InvoiceCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <StatusBadge status={invoice.status} small />
        </View>
        <ChevronRight size={20} color={Colors.textSecondary} />
      </View>

      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{invoice.client.name}</Text>
        {invoice.client.company && (
          <Text style={styles.clientCompany}>{invoice.client.company}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>Due</Text>
          <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(invoice.total)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  clientInfo: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 2,
  },
  clientCompany: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateInfo: {
    gap: 2,
  },
  dateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dateValue: {
    fontSize: 14,
    color: Colors.text,
  },
  amount: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
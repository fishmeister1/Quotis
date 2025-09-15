import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useInvoices } from '@/hooks/invoice-store';
import { InvoiceCard } from '@/components/InvoiceCard';
import { StatCard } from '@/components/StatCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import Colors from '@/constants/colors';
import { Search, Filter, FileIcon } from 'lucide-react-native';
import { InvoiceStatus } from '@/types/invoice';

export default function InvoicesScreen() {
  const {
    invoices,
    isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    statistics,
  } = useInvoices();

  const filterOptions: Array<{ label: string; value: InvoiceStatus | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Draft', value: 'draft' },
    { label: 'Sent', value: 'sent' },
    { label: 'Paid', value: 'paid' },
    { label: 'Overdue', value: 'overdue' },
  ];

  const handleInvoicePress = (invoiceId: string) => {
    router.push(`/invoice/${invoiceId}`);
  };

  const handleCreatePress = () => {
    router.push('/invoice/edit');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => {}} />
        }
        ListHeaderComponent={
          <View>
            {/* Statistics */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.statsContainer}
              contentContainerStyle={styles.statsContent}
            >
              <StatCard
                label="Total Revenue"
                value={statistics.totalRevenue}
                color={Colors.success}
                isAmount
              />
              <StatCard
                label="Pending"
                value={statistics.pendingRevenue}
                color={Colors.warning}
                isAmount
              />
              <StatCard
                label="Total Invoices"
                value={statistics.total}
                color={Colors.primary}
              />
              <StatCard
                label="Overdue"
                value={statistics.overdue}
                color={Colors.danger}
              />
            </ScrollView>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color={Colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search invoices..."
                  placeholderTextColor={Colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
              contentContainerStyle={styles.filterContent}
            >
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterPill,
                    statusFilter === option.value && styles.filterPillActive,
                  ]}
                  onPress={() => setStatusFilter(option.value)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      statusFilter === option.value && styles.filterPillTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {invoices.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <FileIcon size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyStateTitle}>No invoices yet</Text>
                <Text style={styles.emptyStateText}>
                  Create your first invoice to get started
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            onPress={() => handleInvoicePress(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      <FloatingActionButton onPress={handleCreatePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsContainer: {
    marginTop: 16,
  },
  statsContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
  },
  filterPillText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  filterPillTextActive: {
    color: Colors.card,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
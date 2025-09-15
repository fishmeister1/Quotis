import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useInvoices } from '@/hooks/invoice-store';
import { Invoice } from '@/types/invoice';

type TimePeriod = 'week' | 'month' | 'quarter' | 'year' | 'all';

interface PeriodData {
  revenue: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  averageInvoiceValue: number;
  topClient: string | null;
  growth: number;
}



export default function StatisticsScreen() {
  const { invoices } = useInvoices();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  const periods: { label: string; value: TimePeriod }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Year', value: 'year' },
    { label: 'All Time', value: 'all' },
  ];

  const getDateRange = (period: TimePeriod): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    switch (period) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        start = new Date(0);
        break;
    }

    return { start, end };
  };

  const periodData = useMemo((): PeriodData => {
    const { start, end } = getDateRange(selectedPeriod);
    
    const filteredInvoices = invoices.filter((invoice: Invoice) => {
      const invoiceDate = new Date(invoice.issueDate);
      return invoiceDate >= start && invoiceDate <= end;
    });

    const paidInvoices = filteredInvoices.filter((inv: Invoice) => inv.status === 'paid');
    const pendingInvoices = filteredInvoices.filter((inv: Invoice) => inv.status === 'sent');
    const overdueInvoices = filteredInvoices.filter((inv: Invoice) => inv.status === 'overdue');

    const revenue = paidInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
    const averageInvoiceValue = paidInvoices.length > 0 
      ? revenue / paidInvoices.length 
      : 0;

    // Calculate top client
    const clientRevenue: Record<string, number> = {};
    paidInvoices.forEach((inv: Invoice) => {
      clientRevenue[inv.client.name] = (clientRevenue[inv.client.name] || 0) + inv.total;
    });
    const topClient = Object.keys(clientRevenue).length > 0
      ? Object.entries(clientRevenue).sort((a, b) => b[1] - a[1])[0][0]
      : null;

    // Calculate growth (compare with previous period)
    const prevRange = getDateRange(selectedPeriod);
    const periodLength = prevRange.end.getTime() - prevRange.start.getTime();
    const prevStart = new Date(prevRange.start.getTime() - periodLength);
    const prevEnd = new Date(prevRange.start);
    
    const prevPaidInvoices = invoices.filter((invoice: Invoice) => {
      const invoiceDate = new Date(invoice.issueDate);
      return invoiceDate >= prevStart && invoiceDate < prevEnd && invoice.status === 'paid';
    });
    
    const prevRevenue = prevPaidInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
    const growth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      revenue,
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      overdueCount: overdueInvoices.length,
      averageInvoiceValue,
      topClient,
      growth,
    };
  }, [invoices, selectedPeriod]);

  const monthlyRevenue = useMemo(() => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthInvoices = invoices.filter((invoice: Invoice) => {
        const invoiceDate = new Date(invoice.issueDate);
        return invoiceDate >= monthStart && invoiceDate <= monthEnd && invoice.status === 'paid';
      });
      
      const revenue = monthInvoices.reduce((sum: number, inv: Invoice) => sum + inv.total, 0);
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });
      
      last6Months.push({ month: monthName, revenue });
    }
    
    return last6Months;
  }, [invoices]);

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.value}
            style={[
              styles.periodButton,
              selectedPeriod === period.value && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.value)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.value && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.mainCard}>
        <View style={styles.revenueHeader}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          {periodData.growth !== 0 && (
            <View style={[styles.growthBadge, periodData.growth > 0 ? styles.growthPositive : styles.growthNegative]}>
              {periodData.growth > 0 ? (
                <TrendingUp size={14} color={Colors.success} />
              ) : (
                <TrendingDown size={14} color={Colors.danger} />
              )}
              <Text style={[styles.growthText, { color: periodData.growth > 0 ? Colors.success : Colors.danger }]}>
                {Math.abs(periodData.growth).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.revenueAmount}>£{periodData.revenue.toLocaleString()}</Text>
        <Text style={styles.revenueSubtext}>
          {periodData.paidCount} paid invoice{periodData.paidCount !== 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: Colors.primaryLight }]}>
          <Text style={styles.statValue}>£{Math.round(periodData.averageInvoiceValue).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Avg Invoice</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.warningLight }]}>
          <Text style={styles.statValue}>{periodData.pendingCount}</Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: Colors.dangerLight }]}>
          <Text style={styles.statValue}>{periodData.overdueCount}</Text>
          <Text style={styles.statLabel}>Overdue</Text>
        </View>
      </View>

      {periodData.topClient && (
        <View style={styles.topClientCard}>
          <Text style={styles.topClientLabel}>Top Client</Text>
          <Text style={styles.topClientName}>{periodData.topClient}</Text>
        </View>
      )}

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Trend (Last 6 Months)</Text>
        <View style={styles.chart}>
          {monthlyRevenue.map((data) => (
            <View key={data.month} style={styles.barContainer}>
              <View 
                style={[
                  styles.bar,
                  { 
                    height: (data.revenue / maxRevenue) * 120 || 2,
                    backgroundColor: data.revenue > 0 ? Colors.primary : Colors.border,
                  },
                ]}
              />
              <Text style={styles.barLabel}>{data.month}</Text>
              {data.revenue > 0 && (
                <Text style={styles.barValue}>£{(data.revenue / 1000).toFixed(1)}k</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.insightsCard}>
        <View style={styles.insightHeader}>
          <Calendar size={20} color={Colors.primary} />
          <Text style={styles.insightTitle}>Quick Insights</Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>Collection Rate</Text>
          <Text style={styles.insightValue}>
            {invoices.length > 0 
              ? Math.round((invoices.filter((i: Invoice) => i.status === 'paid').length / invoices.length) * 100)
              : 0}%
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>Active Clients</Text>
          <Text style={styles.insightValue}>
            {new Set(invoices.map((i: Invoice) => i.client.name)).size}
          </Text>
        </View>
        <View style={styles.insightItem}>
          <Text style={styles.insightLabel}>Total Invoices</Text>
          <Text style={styles.insightValue}>{invoices.length}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  mainCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  growthPositive: {
    backgroundColor: Colors.successLight,
  },
  growthNegative: {
    backgroundColor: Colors.dangerLight,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  revenueSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginVertical: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topClientCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  topClientLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  topClientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  chartCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '60%',
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  barValue: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '500' as const,
    position: 'absolute',
    bottom: '100%',
    marginBottom: 2,
  },
  insightsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  insightLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
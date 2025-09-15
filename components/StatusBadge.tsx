import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InvoiceStatus } from '@/types/invoice';
import Colors from '@/constants/colors';

interface StatusBadgeProps {
  status: InvoiceStatus;
  small?: boolean;
}

export function StatusBadge({ status, small = false }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'draft':
        return { bg: Colors.border, text: Colors.textSecondary };
      case 'sent':
        return { bg: Colors.primaryLight, text: Colors.primary };
      case 'paid':
        return { bg: Colors.successLight, text: Colors.success };
      case 'overdue':
        return { bg: Colors.dangerLight, text: Colors.danger };
      default:
        return { bg: Colors.border, text: Colors.textSecondary };
    }
  };

  const colors = getStatusColor();
  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <View style={[
      styles.badge,
      { backgroundColor: colors.bg },
      small && styles.smallBadge
    ]}>
      <Text style={[
        styles.text,
        { color: colors.text },
        small && styles.smallText
      ]}>
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  smallBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  smallText: {
    fontSize: 10,
  },
});
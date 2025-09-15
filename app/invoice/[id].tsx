import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useInvoices } from '@/hooks/invoice-store';
import { AttachmentManager } from '@/components/AttachmentManager';
import { StatusBadge } from '@/components/StatusBadge';
import Colors from '@/constants/colors';
import { Mail, Phone, MapPin, Calendar, Edit, Trash2, Send, CheckCircle, Download, Share2 } from 'lucide-react-native';
import { InvoiceStatus } from '@/types/invoice';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const { invoices, updateInvoiceStatus, deleteInvoice, addAttachment, removeAttachment } = useInvoices();
  const invoice = invoices.find((inv) => inv.id === id);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text>Invoice not found</Text>
      </View>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
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

  const handleStatusChange = async (status: InvoiceStatus) => {
    await updateInvoiceStatus(invoice.id, status);
    Alert.alert('Success', `Invoice marked as ${status}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteInvoice(invoice.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: '/invoice/edit',
      params: { id: invoice.id },
    });
  };

  const generatePDFHTML = () => {
    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.rate)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.amount)}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #1f2937;
              line-height: 1.6;
              margin: 0;
              padding: 40px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .invoice-title {
              font-size: 32px;
              font-weight: bold;
              color: #1f2937;
              margin: 0;
            }
            .invoice-number {
              font-size: 18px;
              color: #6b7280;
              margin-top: 8px;
            }
            .status {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              background: ${
                invoice.status === 'paid' ? '#10b981' :
                invoice.status === 'sent' ? '#3b82f6' :
                invoice.status === 'overdue' ? '#ef4444' :
                '#6b7280'
              };
              color: white;
            }
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .info-block {
              flex: 1;
            }
            .info-title {
              font-size: 14px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              margin-bottom: 12px;
            }
            .info-content {
              font-size: 16px;
              color: #1f2937;
              line-height: 1.8;
            }
            .company-name {
              font-weight: 600;
              font-size: 18px;
              margin-bottom: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            th {
              background: #f9fafb;
              padding: 12px;
              text-align: left;
              font-weight: 600;
              color: #6b7280;
              border-bottom: 2px solid #e5e7eb;
            }
            .totals {
              display: flex;
              justify-content: flex-end;
              margin-top: 20px;
            }
            .totals-table {
              width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
            }
            .total-label {
              color: #6b7280;
            }
            .total-value {
              font-weight: 600;
            }
            .grand-total {
              border-top: 2px solid #e5e7eb;
              margin-top: 8px;
              padding-top: 12px;
            }
            .grand-total .total-label {
              font-size: 18px;
              font-weight: 600;
              color: #1f2937;
            }
            .grand-total .total-value {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
            }
            .notes {
              margin-top: 40px;
              padding: 20px;
              background: #f9fafb;
              border-radius: 8px;
            }
            .notes-title {
              font-weight: 600;
              margin-bottom: 8px;
            }
            .footer {
              margin-top: 60px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="invoice-title">INVOICE</h1>
              <div class="invoice-number">${invoice.invoiceNumber}</div>
            </div>
            <div style="text-align: right;">
              <div class="status">${invoice.status}</div>
            </div>
          </div>

          <div class="info-section">
            <div class="info-block">
              <div class="info-title">Bill To</div>
              <div class="info-content">
                <div class="company-name">${invoice.client.name}</div>
                ${invoice.client.company ? `<div>${invoice.client.company}</div>` : ''}
                ${invoice.client.email ? `<div>${invoice.client.email}</div>` : ''}
                ${invoice.client.phone ? `<div>${invoice.client.phone}</div>` : ''}
                ${invoice.client.address ? `<div>${invoice.client.address}</div>` : ''}
              </div>
            </div>
            <div class="info-block" style="text-align: right;">
              <div class="info-title">Invoice Details</div>
              <div class="info-content">
                <div><strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}</div>
                <div><strong>Due Date:</strong> ${formatDate(invoice.dueDate)}</div>
                ${invoice.sentAt ? `<div><strong>Sent:</strong> ${formatDate(invoice.sentAt)}</div>` : ''}
                ${invoice.paidAt ? `<div><strong>Paid:</strong> ${formatDate(invoice.paidAt)}</div>` : ''}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Description</th>
                <th style="text-align: center;">Quantity</th>
                <th style="text-align: right;">Rate</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-table">
              <div class="total-row">
                <div class="total-label">Subtotal</div>
                <div class="total-value">${formatCurrency(invoice.subtotal)}</div>
              </div>
              <div class="total-row">
                <div class="total-label">Tax (${invoice.taxRate}%)</div>
                <div class="total-value">${formatCurrency(invoice.tax)}</div>
              </div>
              <div class="total-row grand-total">
                <div class="total-label">Total</div>
                <div class="total-value">${formatCurrency(invoice.total)}</div>
              </div>
            </div>
          </div>

          ${invoice.notes ? `
            <div class="notes">
              <div class="notes-title">Notes</div>
              <div>${invoice.notes}</div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      
      const html = generatePDFHTML();
      const { uri } = await Print.printToFileAsync({ html });
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            UTI: '.pdf',
            mimeType: 'application/pdf',
            dialogTitle: `Invoice ${invoice.invoiceNumber}`,
          });
        } else {
          Alert.alert('Success', 'PDF generated successfully!');
        }
      } else {
        const fileName = `invoice_${invoice.invoiceNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        const a = document.createElement('a');
        a.href = uri;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        Alert.alert('Success', 'PDF downloaded successfully!');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <StatusBadge status={invoice.status} />
        </View>
        <Text style={styles.totalAmount}>{formatCurrency(invoice.total)}</Text>
      </View>

      {/* Client Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill To</Text>
        <View style={styles.card}>
          <Text style={styles.clientName}>{invoice.client.name}</Text>
          {invoice.client.company && (
            <Text style={styles.clientCompany}>{invoice.client.company}</Text>
          )}
          
          {invoice.client.email && (
            <View style={styles.contactRow}>
              <Mail size={14} color={Colors.textSecondary} />
              <Text style={styles.contactText}>{invoice.client.email}</Text>
            </View>
          )}
          
          {invoice.client.phone && (
            <View style={styles.contactRow}>
              <Phone size={14} color={Colors.textSecondary} />
              <Text style={styles.contactText}>{invoice.client.phone}</Text>
            </View>
          )}
          
          {invoice.client.address && (
            <View style={styles.contactRow}>
              <MapPin size={14} color={Colors.textSecondary} />
              <Text style={styles.contactText}>{invoice.client.address}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Issue Date</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Due Date</Text>
            <Text style={styles.dateValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
          {invoice.sentAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Sent</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.sentAt)}</Text>
            </View>
          )}
          {invoice.paidAt && (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Paid</Text>
              <Text style={styles.dateValue}>{formatDate(invoice.paidAt)}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.card}>
          {invoice.items.map((item, index) => (
            <View key={item.id} style={[styles.item, index > 0 && styles.itemBorder]}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
              </View>
              <Text style={styles.itemDetails}>
                {item.quantity} × {formatCurrency(item.rate)}
              </Text>
            </View>
          ))}
          
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.tax)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Notes */}
      {invoice.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            <Text style={styles.notes}>{invoice.notes}</Text>
          </View>
        </View>
      )}

      {/* Attachments */}
      <View style={styles.section}>
        <AttachmentManager
          attachments={invoice.attachments || []}
          onAddAttachment={(attachment) => addAttachment(invoice.id, attachment)}
          onRemoveAttachment={(attachmentId) => removeAttachment(invoice.id, attachmentId)}
          editable={invoice.status === 'draft'}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.pdfButton]}
          onPress={handleGeneratePDF}
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? (
            <ActivityIndicator size="small" color={Colors.card} />
          ) : (
            <>
              <Download size={20} color={Colors.card} />
              <Text style={styles.actionButtonText}>Generate PDF</Text>
            </>
          )}
        </TouchableOpacity>
        {invoice.status === 'draft' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.sendButton]}
            onPress={() => handleStatusChange('sent')}
          >
            <Send size={20} color={Colors.card} />
            <Text style={styles.actionButtonText}>Send Invoice</Text>
          </TouchableOpacity>
        )}
        
        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
          <TouchableOpacity
            style={[styles.actionButton, styles.paidButton]}
            onPress={() => handleStatusChange('paid')}
          >
            <CheckCircle size={20} color={Colors.card} />
            <Text style={styles.actionButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <Edit size={20} color={Colors.primary} />
          <Text style={[styles.actionButtonText, { color: Colors.primary }]}>
            Edit Invoice
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Trash2 size={20} color={Colors.danger} />
          <Text style={[styles.actionButtonText, { color: Colors.danger }]}>
            Delete Invoice
          </Text>
        </TouchableOpacity>
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
    backgroundColor: Colors.card,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 32,
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  clientCompany: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  item: {
    paddingVertical: 12,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  itemDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totals: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 12,
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
    paddingTop: 8,
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
  notes: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButton: {
    backgroundColor: Colors.primary,
  },
  paidButton: {
    backgroundColor: Colors.success,
  },
  pdfButton: {
    backgroundColor: Colors.accent,
  },
  editButton: {
    backgroundColor: Colors.primaryLight,
  },
  deleteButton: {
    backgroundColor: Colors.dangerLight,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.card,
  },
});
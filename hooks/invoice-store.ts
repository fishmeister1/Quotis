import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Invoice, Client, InvoiceStatus, Item, Attachment } from '@/types/invoice';

const STORAGE_KEYS = {
  INVOICES: 'invoices',
  CLIENTS: 'clients',
  ITEMS: 'items',
  LAST_INVOICE_NUMBER: 'lastInvoiceNumber',
};

export const [InvoiceProvider, useInvoices] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  // Load invoices from storage
  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
        if (!stored || stored === 'undefined' || stored === 'null') {
          return [];
        }
        
        const invoices = JSON.parse(stored);
        if (!Array.isArray(invoices)) {
          console.error('Invalid invoices data, resetting to empty array');
          await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify([]));
          return [];
        }
        
        // Check for overdue invoices
        const now = new Date();
        const updated = invoices.map((inv: Invoice) => {
          if (inv.status === 'sent' && new Date(inv.dueDate) < now) {
            return { ...inv, status: 'overdue' as InvoiceStatus };
          }
          return inv;
        });
        
        if (JSON.stringify(updated) !== stored) {
          await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
        }
        
        return updated;
      } catch (error) {
        console.error('Error loading invoices:', error);
        await AsyncStorage.removeItem(STORAGE_KEYS.INVOICES);
        return [];
      }
    },
  });

  // Load clients from storage
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.CLIENTS);
        console.log('Loading clients, stored value:', stored?.substring(0, 100));
        
        if (!stored || stored === 'undefined' || stored === 'null' || stored.trim() === '') {
          console.log('No clients data found, returning empty array');
          return [];
        }
        
        try {
          const clients = JSON.parse(stored);
          if (!Array.isArray(clients)) {
            console.error('Invalid clients data (not an array), resetting to empty array');
            await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
            return [];
          }
          
          console.log(`Successfully loaded ${clients.length} clients`);
          return clients;
        } catch (parseError) {
          console.error('JSON parse error for clients:', parseError);
          console.error('Stored value that failed to parse:', stored);
          // Try to recover by resetting
          await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
          return [];
        }
      } catch (error) {
        console.error('Error loading clients from AsyncStorage:', error);
        // Don't remove the item, just return empty array
        return [];
      }
    },
  });

  // Load items from storage
  const itemsQuery = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
        console.log('Loading items, stored value:', stored?.substring(0, 100));
        
        if (!stored || stored === 'undefined' || stored === 'null' || stored.trim() === '') {
          console.log('No items data found, returning empty array');
          return [];
        }
        
        try {
          const items = JSON.parse(stored);
          if (!Array.isArray(items)) {
            console.error('Invalid items data (not an array), resetting to empty array');
            await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
            return [];
          }
          
          console.log(`Successfully loaded ${items.length} items`);
          return items;
        } catch (parseError) {
          console.error('JSON parse error for items:', parseError);
          console.error('Stored value that failed to parse:', stored);
          // Try to recover by resetting
          await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify([]));
          return [];
        }
      } catch (error) {
        console.error('Error loading items from AsyncStorage:', error);
        // Don't remove the item, just return empty array
        return [];
      }
    },
  });

  // Save invoice mutation
  const saveInvoiceMutation = useMutation({
    mutationFn: async (invoice: Invoice) => {
      const invoices = invoicesQuery.data || [];
      const index = invoices.findIndex((inv: Invoice) => inv.id === invoice.id);
      
      let updated;
      if (index >= 0) {
        updated = [...invoices];
        updated[index] = invoice;
      } else {
        updated = [...invoices, invoice];
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Delete invoice mutation
  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const invoices = invoicesQuery.data || [];
      const updated = invoices.filter((inv: Invoice) => inv.id !== invoiceId);
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  // Save client mutation
  const saveClientMutation = useMutation({
    mutationFn: async (client: Client) => {
      const clients = clientsQuery.data || [];
      const index = clients.findIndex((c: Client) => c.id === client.id);
      
      let updated;
      if (index >= 0) {
        updated = [...clients];
        updated[index] = client;
      } else {
        updated = [...clients, client];
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });

  // Add item
  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<Item, 'id'>) => {
      const items = itemsQuery.data || [];
      const newItem: Item = {
        ...item,
        id: Date.now().toString(),
      };
      const updated = [...items, newItem];
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Update item
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: Omit<Item, 'id'> }) => {
      const items = itemsQuery.data || [];
      const index = items.findIndex((i: Item) => i.id === id);
      
      if (index >= 0) {
        const updated = [...items];
        updated[index] = { ...item, id };
        await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updated));
        return updated;
      }
      return items;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Delete item
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const items = itemsQuery.data || [];
      const updated = items.filter((i: Item) => i.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });

  // Get next invoice number
  const getNextInvoiceNumber = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_INVOICE_NUMBER);
      const lastNumber = stored && !isNaN(parseInt(stored, 10)) ? parseInt(stored, 10) : 0;
      const nextNumber = lastNumber + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_INVOICE_NUMBER, nextNumber.toString());
      return `INV-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error getting next invoice number:', error);
      return `INV-${Date.now().toString().slice(-4)}`;
    }
  };

  // Update invoice status
  const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    const invoices = invoicesQuery.data || [];
    const invoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
    
    if (invoice) {
      const updated = {
        ...invoice,
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'sent' && !invoice.sentAt ? { sentAt: new Date().toISOString() } : {}),
        ...(status === 'paid' ? { paidAt: new Date().toISOString() } : {}),
      };
      
      await saveInvoiceMutation.mutateAsync(updated);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoicesQuery.data || [];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((inv: Invoice) => inv.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((inv: Invoice) => 
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.client.name.toLowerCase().includes(query) ||
        inv.client.company?.toLowerCase().includes(query)
      );
    }
    
    // Sort by date (newest first)
    return filtered.sort((a: Invoice, b: Invoice) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [invoicesQuery.data, statusFilter, searchQuery]);

  // Statistics
  const statistics = useMemo(() => {
    const invoices = invoicesQuery.data || [];
    return {
      total: invoices.length,
      draft: invoices.filter((inv: Invoice) => inv.status === 'draft').length,
      sent: invoices.filter((inv: Invoice) => inv.status === 'sent').length,
      paid: invoices.filter((inv: Invoice) => inv.status === 'paid').length,
      overdue: invoices.filter((inv: Invoice) => inv.status === 'overdue').length,
      totalRevenue: invoices
        .filter((inv: Invoice) => inv.status === 'paid')
        .reduce((sum: number, inv: Invoice) => sum + inv.total, 0),
      pendingRevenue: invoices
        .filter((inv: Invoice) => inv.status === 'sent' || inv.status === 'overdue')
        .reduce((sum: number, inv: Invoice) => sum + inv.total, 0),
    };
  }, [invoicesQuery.data]);

  // Add attachment to invoice
  const addAttachment = async (invoiceId: string, attachment: Attachment) => {
    const invoices = invoicesQuery.data || [];
    const invoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
    
    if (invoice) {
      const updated = {
        ...invoice,
        attachments: [...(invoice.attachments || []), attachment],
        updatedAt: new Date().toISOString(),
      };
      
      await saveInvoiceMutation.mutateAsync(updated);
    }
  };

  // Remove attachment from invoice
  const removeAttachment = async (invoiceId: string, attachmentId: string) => {
    const invoices = invoicesQuery.data || [];
    const invoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
    
    if (invoice && invoice.attachments) {
      const updated = {
        ...invoice,
        attachments: invoice.attachments.filter((att: Attachment) => att.id !== attachmentId),
        updatedAt: new Date().toISOString(),
      };
      
      await saveInvoiceMutation.mutateAsync(updated);
    }
  };

  return {
    invoices: filteredInvoices,
    clients: clientsQuery.data || [],
    items: itemsQuery.data || [],
    isLoading: invoicesQuery.isLoading || clientsQuery.isLoading || itemsQuery.isLoading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    statistics,
    saveInvoice: saveInvoiceMutation.mutateAsync,
    deleteInvoice: deleteInvoiceMutation.mutateAsync,
    updateInvoiceStatus,
    saveClient: saveClientMutation.mutateAsync,
    addItem: addItemMutation.mutateAsync,
    updateItem: (id: string, item: Omit<Item, 'id'>) => updateItemMutation.mutateAsync({ id, item }),
    deleteItem: deleteItemMutation.mutateAsync,
    getNextInvoiceNumber,
    addAttachment,
    removeAttachment,
  };
});

export const useClients = () => {
  const { clients } = useInvoices();
  return { clients };
};
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Expense, ExpenseCategory } from '@/types/expense';

const STORAGE_KEY = 'expenses';

export const [ExpenseProvider, useExpenses] = createContextHook(() => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpenses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveExpenses = async (newExpenses: Expense[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
      setExpenses(newExpenses);
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  };

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...expenses, newExpense];
    await saveExpenses(updated);
    return newExpense;
  }, [expenses]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    const updated = expenses.map(expense =>
      expense.id === id
        ? { ...expense, ...updates, updatedAt: new Date().toISOString() }
        : expense
    );
    await saveExpenses(updated);
  }, [expenses]);

  const deleteExpense = useCallback(async (id: string) => {
    const updated = expenses.filter(expense => expense.id !== id);
    await saveExpenses(updated);
  }, [expenses]);

  const getExpenseById = useCallback((id: string) => {
    return expenses.find(expense => expense.id === id);
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.total, 0);
  }, [expenses]);

  const totalTax = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.tax, 0);
  }, [expenses]);

  const expensesByCategory = useMemo(() => {
    const grouped: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
    expenses.forEach(expense => {
      if (!grouped[expense.category]) {
        grouped[expense.category] = 0;
      }
      grouped[expense.category] += expense.total;
    });
    return grouped;
  }, [expenses]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });
  }, [expenses]);

  return useMemo(() => ({
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    totalExpenses,
    totalTax,
    expensesByCategory,
    currentMonthExpenses,
  }), [
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseById,
    totalExpenses,
    totalTax,
    expensesByCategory,
    currentMonthExpenses,
  ]);
});
import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Booking } from '@/types/booking';

const BOOKINGS_STORAGE_KEY = 'bookings';

export const [BookingProvider, useBookings] = createContextHook(() => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const stored = await AsyncStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (stored) {
        setBookings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBookings = async (updatedBookings: Booking[]) => {
    if (!updatedBookings || !Array.isArray(updatedBookings)) return;
    try {
      await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updatedBookings));
      setBookings(updatedBookings);
    } catch (error) {
      console.error('Error saving bookings:', error);
    }
  };

  const addBooking = useCallback(async (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updatedBookings = [...bookings, newBooking];
    await saveBookings(updatedBookings);
    return newBooking;
  }, [bookings]);

  const updateBooking = useCallback(async (id: string, updates: Partial<Booking>) => {
    const updatedBookings = bookings.map(booking =>
      booking.id === id
        ? { ...booking, ...updates, updatedAt: new Date().toISOString() }
        : booking
    );
    await saveBookings(updatedBookings);
  }, [bookings]);

  const deleteBooking = useCallback(async (id: string) => {
    const updatedBookings = bookings.filter(booking => booking.id !== id);
    await saveBookings(updatedBookings);
  }, [bookings]);

  const getBookingsByDate = useCallback((date: string) => {
    return bookings.filter(booking => booking.date === date);
  }, [bookings]);

  const getUpcomingBookings = useCallback(() => {
    const now = new Date();
    return bookings
      .filter(booking => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= now && booking.status === 'scheduled';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings]);

  return useMemo(() => ({
    bookings,
    isLoading,
    addBooking,
    updateBooking,
    deleteBooking,
    getBookingsByDate,
    getUpcomingBookings,
  }), [bookings, isLoading, addBooking, updateBooking, deleteBooking, getBookingsByDate, getUpcomingBookings]);
});

export function useBookingsByMonth(year: number, month: number) {
  const { bookings } = useBookings();
  
  return useMemo(() => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.getFullYear() === year && bookingDate.getMonth() === month;
    });
  }, [bookings, year, month]);
}
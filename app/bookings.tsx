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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react-native';
import { useBookings, useBookingsByMonth } from '@/hooks/booking-store';
import { useClients, useInvoices } from '@/hooks/invoice-store';
import { Booking } from '@/types/booking';
import { Client } from '@/types/invoice';
import { FloatingActionButton } from '@/components/FloatingActionButton';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function BookingsScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    clientId: '',
    clientName: '',
    date: '',
    time: '',
    duration: 60,
    service: '',
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedBookingDate, setSelectedBookingDate] = useState(new Date());
  const [selectedBookingTime, setSelectedBookingTime] = useState(new Date());

  const { addBooking, getBookingsByDate, updateBooking, deleteBooking } = useBookings();
  const { clients } = useClients();
  const { items } = useInvoices();
  const monthBookings = useBookingsByMonth(currentDate.getFullYear(), currentDate.getMonth());

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDatePress = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(dateString);
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (date: Date): string => {
    return date.toTimeString().slice(0, 5);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedBookingDate(selectedDate);
      const formattedDate = formatDate(selectedDate);
      setNewBooking({ ...newBooking, date: formattedDate });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedBookingTime(selectedTime);
      const formattedTime = formatTime(selectedTime);
      setNewBooking({ ...newBooking, time: formattedTime });
    }
  };

  const handleAddBooking = async () => {
    if (!newBooking.clientId || !newBooking.date || !newBooking.time || !newBooking.service) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const client = clients.find((c: Client) => c.id === newBooking.clientId);
    if (!client) {
      Alert.alert('Error', 'Selected client not found');
      return;
    }

    console.log('Booking date:', newBooking.date, 'Booking time:', newBooking.time);

    await addBooking({
      clientId: newBooking.clientId,
      clientName: client.name,
      date: newBooking.date,
      time: newBooking.time,
      duration: newBooking.duration,
      service: newBooking.service,
      notes: newBooking.notes,
      status: 'scheduled',
    });

    setShowAddModal(false);
    setNewBooking({
      clientId: '',
      clientName: '',
      date: '',
      time: '',
      duration: 60,
      service: '',
      notes: '',
    });
    setSelectedBookingDate(new Date());
    setSelectedBookingTime(new Date());
  };

  const handleStatusChange = async (booking: Booking, status: 'scheduled' | 'completed' | 'cancelled') => {
    await updateBooking(booking.id, { status });
  };

  const handleDeleteBooking = async (bookingId: string) => {
    Alert.alert(
      'Delete Booking',
      'Are you sure you want to delete this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBooking(bookingId);
          },
        },
      ]
    );
  };

  const getBookingsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return monthBookings.filter(booking => booking.date === dateString);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Bookings' }} />
      
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={handlePreviousMonth} style={styles.monthButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} style={styles.monthButton}>
          <ChevronRight size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map(day => (
          <Text key={day} style={styles.weekdayText}>{day}</Text>
        ))}
      </View>

      <ScrollView style={styles.calendarContainer}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => {
            const bookings = getBookingsForDate(date);
            const dateString = date.toISOString().split('T')[0];
            const isSelected = selectedDate === dateString;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !isCurrentMonth(date) && styles.otherMonthDay,
                  isToday(date) && styles.todayDay,
                  isSelected && styles.selectedDay,
                ]}
                onPress={() => handleDatePress(date)}
              >
                <Text style={[
                  styles.dayNumber,
                  !isCurrentMonth(date) && styles.otherMonthText,
                  isToday(date) && styles.todayText,
                  isSelected && styles.selectedText,
                ]}>
                  {date.getDate()}
                </Text>
                {bookings.length > 0 && (
                  <View style={styles.bookingIndicator}>
                    <Text style={styles.bookingCount}>{bookings.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedDate && (
          <View style={styles.selectedDateBookings}>
            <Text style={styles.selectedDateTitle}>
              Bookings for {new Date(selectedDate).toLocaleDateString()}
            </Text>
            {getBookingsByDate(selectedDate).length === 0 ? (
              <Text style={styles.noBookingsText}>No bookings for this date</Text>
            ) : (
              getBookingsByDate(selectedDate).map(booking => (
                <View key={booking.id} style={styles.bookingCard}>
                  <View style={styles.bookingHeader}>
                    <Text style={styles.bookingTime}>
                      <Clock size={14} color={Colors.textSecondary} /> {booking.time}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteBooking(booking.id)}
                      style={styles.deleteButton}
                    >
                      <X size={20} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.bookingClient}>{booking.clientName}</Text>
                  <Text style={styles.bookingService}>{booking.service}</Text>
                  {booking.notes && (
                    <Text style={styles.bookingNotes}>{booking.notes}</Text>
                  )}
                  <View style={styles.statusButtons}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        booking.status === 'scheduled' && styles.statusButtonActive,
                      ]}
                      onPress={() => handleStatusChange(booking, 'scheduled')}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        booking.status === 'scheduled' && styles.statusButtonTextActive,
                      ]}>Scheduled</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        booking.status === 'completed' && styles.statusButtonActive,
                      ]}
                      onPress={() => handleStatusChange(booking, 'completed')}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        booking.status === 'completed' && styles.statusButtonTextActive,
                      ]}>Completed</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        booking.status === 'cancelled' && styles.statusButtonActive,
                      ]}
                      onPress={() => handleStatusChange(booking, 'cancelled')}
                    >
                      <Text style={[
                        styles.statusButtonText,
                        booking.status === 'cancelled' && styles.statusButtonTextActive,
                      ]}>Cancelled</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <FloatingActionButton onPress={() => setShowAddModal(true)} />

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Booking</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Client *</Text>
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.clientPicker} nestedScrollEnabled>
                  {clients.map((client: Client) => (
                    <TouchableOpacity
                      key={client.id}
                      style={[
                        styles.clientOption,
                        newBooking.clientId === client.id && styles.clientOptionSelected,
                      ]}
                      onPress={() => setNewBooking({ ...newBooking, clientId: client.id })}
                    >
                      <Text style={[
                        styles.clientOptionText,
                        newBooking.clientId === client.id && styles.clientOptionTextSelected,
                      ]}>
                        {client.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.inputLabel}>Date *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={[
                  styles.dateTimeButtonText,
                  !newBooking.date && styles.placeholderText
                ]}>
                  {newBooking.date ? selectedBookingDate.toLocaleDateString() : 'Select Date'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedBookingDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.inputLabel}>Time *</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[
                  styles.dateTimeButtonText,
                  !newBooking.time && styles.placeholderText
                ]}>
                  {newBooking.time || 'Select Time'}
                </Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={selectedBookingTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              )}

              <Text style={styles.inputLabel}>Service *</Text>
              <View style={styles.pickerContainer}>
                <ScrollView style={styles.servicePicker} nestedScrollEnabled>
                  {items.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.serviceOption,
                        newBooking.service === item.name && styles.serviceOptionSelected,
                      ]}
                      onPress={() => setNewBooking({ ...newBooking, service: item.name })}
                    >
                      <View style={styles.serviceOptionContent}>
                        <Text style={[
                          styles.serviceOptionText,
                          newBooking.service === item.name && styles.serviceOptionTextSelected,
                        ]}>
                          {item.name}
                        </Text>
                        <Text style={[
                          styles.serviceOptionPrice,
                          newBooking.service === item.name && styles.serviceOptionPriceSelected,
                        ]}>
                          ${item.price.toFixed(2)}
                        </Text>
                      </View>
                      {item.description && (
                        <Text style={[
                          styles.serviceOptionDescription,
                          newBooking.service === item.name && styles.serviceOptionDescriptionSelected,
                        ]}>
                          {item.description}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                  {items.length === 0 && (
                    <View style={styles.noItemsContainer}>
                      <Text style={styles.noItemsText}>No services available. Add items in the Items tab first.</Text>
                    </View>
                  )}
                </ScrollView>
              </View>

              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={newBooking.duration.toString()}
                onChangeText={(text) => setNewBooking({ ...newBooking, duration: parseInt(text) || 60 })}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={Colors.textSecondary}
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newBooking.notes}
                onChangeText={(text) => setNewBooking({ ...newBooking, notes: text })}
                placeholder="Additional notes..."
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddBooking}
              >
                <Text style={styles.saveButtonText}>Add Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  calendarContainer: {
    flex: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  todayDay: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 16,
    color: Colors.text,
  },
  otherMonthText: {
    color: Colors.textSecondary,
  },
  todayText: {
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  bookingIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCount: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  selectedDateBookings: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 20,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  noBookingsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bookingCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingTime: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  bookingClient: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
  },
  bookingNotes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusButtonText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  clientPicker: {
    maxHeight: 120,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clientOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clientOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  clientOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  clientOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  servicePicker: {
    maxHeight: 200,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serviceOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  serviceOptionSelected: {
    backgroundColor: Colors.primaryLight,
  },
  serviceOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceOptionText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  serviceOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  serviceOptionPrice: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  serviceOptionPriceSelected: {
    color: Colors.primary,
  },
  serviceOptionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  serviceOptionDescriptionSelected: {
    color: Colors.primary,
  },
  noItemsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  dateTimeButton: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: Colors.text,
  },
  placeholderText: {
    color: Colors.textSecondary,
  },
});
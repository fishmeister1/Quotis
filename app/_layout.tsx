import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { InvoiceProvider } from "@/hooks/invoice-store";
import { BookingProvider } from "@/hooks/booking-store";
import { ExpenseProvider } from "@/hooks/expense-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="invoice/[id]" 
        options={{ 
          title: "Invoice Details",
          presentation: "modal",
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }} 
      />
      <Stack.Screen 
        name="invoice/edit" 
        options={{ 
          title: "New Invoice",
          presentation: "modal",
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }} 
      />
      <Stack.Screen 
        name="settings" 
        options={{ 
          title: "Settings & Debug",
          presentation: "modal",
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }} 
      />
      <Stack.Screen 
        name="bookings" 
        options={{ 
          title: "Bookings",
          presentation: "modal",
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }} 
      />
      <Stack.Screen 
        name="expenses" 
        options={{ 
          title: "Expenses",
          presentation: "modal",
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <InvoiceProvider>
        <BookingProvider>
          <ExpenseProvider>
            <GestureHandlerRootView>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </ExpenseProvider>
        </BookingProvider>
      </InvoiceProvider>
    </QueryClientProvider>
  );
}
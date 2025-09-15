import React, { useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { FileText, Users, Calendar, Package } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Polygon } from 'react-native-svg';

export default function CreateScreen() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f0f4ff', '#e8efff', '#f5f8ff']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Geometric shapes */}
      <View style={styles.geometricContainer}>
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFillObject}
          viewBox="0 0 400 800"
        >
          {/* Large triangle in top left */}
          <Path
            d="M0 0 L200 0 L0 250 Z"
            fill="rgba(99, 102, 241, 0.05)"
          />
          
          {/* Diamond shape in top right */}
          <Polygon
            points="350,50 380,100 350,150 320,100"
            fill="rgba(99, 102, 241, 0.03)"
          />
          
          {/* Hexagon in middle right */}
          <Path
            d="M380 300 L360 320 L360 350 L380 370 L400 350 L400 320 Z"
            fill="rgba(139, 92, 246, 0.04)"
          />
          
          {/* Triangle in bottom left */}
          <Path
            d="M0 600 L0 800 L150 800 Z"
            fill="rgba(99, 102, 241, 0.03)"
          />
          
          {/* Small diamond in middle left */}
          <Polygon
            points="50,400 80,430 50,460 20,430"
            fill="rgba(139, 92, 246, 0.05)"
          />
          
          {/* Parallelogram in bottom right */}
          <Path
            d="M300 700 L380 700 L400 750 L320 750 Z"
            fill="rgba(99, 102, 241, 0.04)"
          />
        </Svg>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.title}>What would you like to do now?</Text>
      
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/invoice/edit')}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <FileText size={32} color={Colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>New Invoice</Text>
          <Text style={styles.cardDescription}>
            Create a new invoice for your clients
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/clients')}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Users size={32} color={Colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>New Client</Text>
          <Text style={styles.cardDescription}>
            Add a new client to your database
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/items')}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Package size={32} color={Colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>New Item</Text>
          <Text style={styles.cardDescription}>
            Add products or services to your catalog
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/bookings')}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Calendar size={32} color={Colors.primary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Bookings</Text>
          <Text style={styles.cardDescription}>
            Manage your appointments and schedule
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push('/expenses')}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.poundIcon}>£</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Expenses</Text>
          <Text style={styles.cardDescription}>
            Track and categorize your business expenses
          </Text>
        </View>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  geometricContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.7,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.08)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  poundIcon: {
    fontSize: 32,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
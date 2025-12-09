import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import MyBarberScreen from '../screens/MyBarberScreen';
import MyReservationsScreen from '../screens/MyReservationsScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [initialRoute, setInitialRoute] = useState('Browse');
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(true);

  // Check for favorite barber on mount and set initial route
  useEffect(() => {
    const checkFavoriteBarber = async () => {
      try {
        // Only check for customer users
        if (user && user.role === 'user') {
          const favoriteBarberId = await AsyncStorage.getItem('@berberi_selected_barber_id');
          if (favoriteBarberId) {
            setInitialRoute('MyBarber');
          } else {
            setInitialRoute('Browse');
          }
        } else {
          // For barbers or if no user, default to Browse
          setInitialRoute('Browse');
        }
      } catch (error) {
        console.error('Error checking favorite barber:', error);
        setInitialRoute('Browse');
      } finally {
        setIsCheckingFavorite(false);
      }
    };

    checkFavoriteBarber();
  }, [user]);

  // Don't render until we've checked for favorite barber
  if (isCheckingFavorite) {
    return null; // Or a loading indicator
  }
  
  return (
    <Tab.Navigator
      initialRouteName={initialRoute}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Browse') {
            iconName = focused ? 'globe' : 'globe-outline';
          } else if (route.name === 'MyBarber') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'MyReservations') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopWidth: 2,
          borderTopColor: 'rgba(255, 215, 0, 0.2)',
          height: 70 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Poppins_600SemiBold',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      })}
    >
      <Tab.Screen
        name="Browse"
        component={HomeScreen}
        options={{
          tabBarLabel: t('navigation.browse'),
        }}
      />
      <Tab.Screen
        name="MyBarber"
        component={MyBarberScreen}
        options={{
          tabBarLabel: t('navigation.myBarber'),
        }}
      />
      <Tab.Screen
        name="MyReservations"
        component={MyReservationsScreen}
        options={{
          tabBarLabel: t('navigation.myProfile'),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;


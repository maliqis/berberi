import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BarberAdminTab1Screen from '../screens/BarberAdminTab1Screen';
import BarberAdminTab2Screen from '../screens/BarberAdminTab2Screen';
import BarberAdminTab3Screen from '../screens/BarberAdminTab3Screen';

const Tab = createBottomTabNavigator();

const BarberAdminTabNavigator = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      initialRouteName="Tab1"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Tab1') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Tab2') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Tab3') {
            iconName = focused ? 'settings' : 'settings-outline';
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
        name="Tab1"
        component={BarberAdminTab1Screen}
        options={{
          tabBarLabel: 'Tab 1',
        }}
      />
      <Tab.Screen
        name="Tab2"
        component={BarberAdminTab2Screen}
        options={{
          tabBarLabel: t('barberAdmin.schedules'),
        }}
      />
      <Tab.Screen
        name="Tab3"
        component={BarberAdminTab3Screen}
        options={{
          tabBarLabel: t('settings.title'),
        }}
      />
    </Tab.Navigator>
  );
};

export default BarberAdminTabNavigator;


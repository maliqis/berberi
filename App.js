import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as ScreenOrientation from 'expo-screen-orientation';
import './i18n';
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  GreatVibes_400Regular,
} from '@expo-google-fonts/great-vibes';
import { AuthProvider, useAuth } from './context/AuthContext';
import TabNavigator from './navigation/TabNavigator';
import BarberAdminTabNavigator from './navigation/BarberAdminTabNavigator';
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  const { user, login, signup, loading } = useAuth();
  const navigationRef = React.useRef(null);

  // Handle navigation based on auth state
  React.useEffect(() => {
    if (!loading && navigationRef.current?.isReady()) {
      const currentRoute = navigationRef.current.getCurrentRoute();
      
      if (user) {
        // User is logged in - navigate to MainTabs if not already there
        if (currentRoute?.name !== 'MainTabs') {
          navigationRef.current.replace('MainTabs');
        }
      } else {
        // User is logged out - navigate to Landing if on protected route
        if (currentRoute?.name === 'MainTabs') {
          navigationRef.current.replace('Landing');
        }
      }
    }
  }, [user, loading]);

  // Show nothing while loading user from storage
  if (loading) {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
        }}
        initialRouteName={user ? 'MainTabs' : 'Landing'}
      >
        {/* LandingScreen is always accessible */}
        <Stack.Screen name="Landing">
          {({ navigation }) => (
            <LandingScreen
              onNavigateToLogin={() => navigation.navigate('Login')}
              onNavigateToSignup={() => navigation.navigate('Signup')}
            />
          )}
        </Stack.Screen>

        {/* Auth screens - always in stack */}
        <Stack.Screen name="Login">
          {({ navigation }) => (
            <LoginScreen
              onNavigateToSignup={() => navigation.navigate('Signup')}
              onNavigateToForgotPassword={() => navigation.navigate('ForgotPassword')}
              onGoBack={() => navigation.replace('Landing')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="ForgotPassword">
          {({ navigation }) => (
            <ForgotPasswordScreen
              onNavigateToLogin={() => navigation.replace('Login')}
              onGoBack={() => navigation.replace('Landing')}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="Signup">
          {({ navigation }) => (
            <SignupScreen
              onNavigateToLogin={() => navigation.navigate('Login')}
              onGoBack={() => navigation.replace('Landing')}
            />
          )}
        </Stack.Screen>

        {/* Main app tabs - always in stack, protected by useEffect */}
        <Stack.Screen 
          name="MainTabs"
          options={{
            // Prevent navigation to MainTabs if not logged in
            gestureEnabled: false,
          }}
        >
          {() => {
            // Conditionally render based on user role
            if (user?.role === 'barber') {
              return <BarberAdminTabNavigator />;
            }
            return <TabNavigator />;
          }}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    GreatVibes_400Regular, // Only for logo
  });

  // Lock to portrait on app start
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  if (!fontsLoaded) {
    return null; // Or a loading screen
  }

  return (
    <AuthProvider>
      <AuthNavigator />
    </AuthProvider>
  );
}

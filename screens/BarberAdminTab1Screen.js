import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import NavBar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';

const BarberAdminTab1Screen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogoPress = () => {
    // Replace with Landing screen in parent stack navigator
    const parent = navigation.getParent();
    if (parent) {
      parent.replace('Landing');
    } else {
      navigation.replace('Landing');
    }
  };

  const handleLogout = () => {
    logout();
    // Navigate to Landing screen after logout
    const parent = navigation.getParent();
    if (parent) {
      parent.replace('Landing');
    } else {
      navigation.replace('Landing');
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.__container}
    >
      <StatusBar style="light" />
      <NavBar onLogoPress={handleLogoPress} onLogout={handleLogout} />
      
      <ScrollView
        style={styles.__scroll_view}
        contentContainerStyle={[
          styles.__content_container,
          { 
            paddingTop: insets.top + 20, 
            paddingBottom: insets.bottom + 20,
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          }
        ]}
      >
        <View style={styles.__content}>
          <Text style={styles.__title}>Barber Admin - Tab 1</Text>
          <Text style={styles.__subtitle}>This is the first tab for barber admin dashboard</Text>
          <Text style={styles.__info}>User: {user?.email || 'N/A'}</Text>
          <Text style={styles.__info}>Role: {user?.role || 'N/A'}</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  __container: {
    flex: 1,
  },
  __scroll_view: {
    flex: 1,
  },
  __content_container: {
    // Horizontal padding handled by dynamic insets
  },
  __content: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  __title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 12,
    textAlign: 'center',
  },
  __subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    textAlign: 'center',
  },
  __info: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
});

export default BarberAdminTab1Screen;


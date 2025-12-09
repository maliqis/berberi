import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import NavBar from '../components/NavBar';
import ScheduleTimeline from '../components/ScheduleTimeline';
import { useAuth } from '../context/AuthContext';

const BarberAdminTab2Screen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  const isLandscape = dimensions.width > dimensions.height;
  // Add extra padding in landscape mode for Samsung controls
  const extraLandscapePadding = isLandscape ? 20 : 0;

  // Allow all orientations when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Allow all orientations when screen is focused
      ScreenOrientation.unlockAsync();
      
      return () => {
        // Lock to portrait when leaving the screen
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      };
    }, [])
  );

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
      
      <View
        style={[
          styles.__content_container,
          { 
            paddingBottom: 0, // Remove bottom padding to eliminate empty space
            paddingLeft: Math.max(insets.left, 20) + extraLandscapePadding,
            paddingRight: Math.max(insets.right, 20) + extraLandscapePadding,
            flex: 1,
          }
        ]}
      >
        <ScheduleTimeline />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  __container: {
    flex: 1,
  },
  __content_container: {
    flex: 1,
  },
});

export default BarberAdminTab2Screen;


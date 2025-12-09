import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const NavBar = ({ onLogoPress, onLogout, style }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
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
  
  return (
    <View style={[
      styles.__navbar, 
      { 
        paddingLeft: Math.max(insets.left, 20) + extraLandscapePadding, 
        paddingRight: Math.max(insets.right, 20) + extraLandscapePadding 
      },
      style
    ]}>
      <Logo variant="navbar" onPress={onLogoPress || undefined} />
      {user && onLogout && (
        <TouchableOpacity
          style={styles.__logout_button}
          onPress={onLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#FFD700" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  __navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    zIndex: 10,
  },
  __logout_button: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
});

export default NavBar;


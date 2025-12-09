import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const Logo = ({ variant = 'home', onPress, style }) => {
  const isHome = variant === 'home';
  const isNavbar = variant === 'navbar';

  if (isNavbar) {
    const Container = onPress ? TouchableOpacity : View;
    const containerProps = onPress ? { onPress, activeOpacity: 0.7 } : {};
    
    return (
      <Container
        style={[styles.__navbar_container, style]}
        {...containerProps}
      >
        <View style={styles.__navbar_logo_container}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.__navbar_logo_gradient}
          >
            <Ionicons name="cut" size={24} color="#1a1a2e" />
          </LinearGradient>
          <View style={styles.__navbar_logo_glow} />
        </View>
        <Text style={styles.__navbar_title}>Berberi</Text>
      </Container>
    );
  }

  // Home variant (default)
  return (
    <View style={[styles.__home_container, style]}>
      <View style={styles.__home_logo_container}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.__home_logo_gradient}
        >
          <Ionicons name="cut" size={50} color="#1a1a2e" />
        </LinearGradient>
        <View style={styles.__home_logo_glow} />
      </View>
      <Text style={styles.__home_title}>Berberi</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  // Home variant styles
  __home_container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  __home_logo_container: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  __home_logo_gradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __home_logo_glow: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 57.5,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    zIndex: -1,
  },
  __home_title: {
    fontSize: 72,
    fontFamily: 'GreatVibes_400Regular',
    color: '#FFD700',
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  // Navbar variant styles
  __navbar_container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  __navbar_logo_container: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  __navbar_logo_gradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __navbar_logo_glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    zIndex: -1,
  },
  __navbar_title: {
    fontSize: 28,
    fontFamily: 'GreatVibes_400Regular',
    color: '#FFD700',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default Logo;


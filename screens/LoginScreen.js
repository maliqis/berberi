import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';

const LoginScreen = ({ onLogin, onNavigateToSignup, onNavigateToForgotPassword, onGoBack }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (email && password) {
      // Dummy users for testing
      // Customer: customer@test.com
      // Barber Admin: admin@test.com
      let role = 'user';
      let name = 'Customer User';
      
      if (email.toLowerCase() === 'admin@test.com' || email.toLowerCase() === 'barber@test.com') {
        role = 'barber';
        name = 'Barber Admin';
      } else if (email.toLowerCase() === 'customer@test.com' || email.toLowerCase() === 'user@test.com') {
        role = 'user';
        name = 'Customer User';
      }
      
      onLogin({ email, role, name });
    }
  };
  
  const handleQuickLogin = (userType) => {
    if (userType === 'customer') {
      setEmail('customer@test.com');
      setPassword('password123');
      // Auto login after setting credentials
      setTimeout(() => {
        onLogin({ email: 'customer@test.com', role: 'user', name: 'Customer User' });
      }, 100);
    } else if (userType === 'barber') {
      setEmail('admin@test.com');
      setPassword('password123');
      // Auto login after setting credentials
      setTimeout(() => {
        onLogin({ email: 'admin@test.com', role: 'barber', name: 'Barber Admin' });
      }, 100);
    }
  };

  return (
    <LinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.__container}
    >
      <StatusBar style="light" />
      
      {/* Decorative Elements */}
      <View style={styles.__decorative_circle_1} />
      <View style={styles.__decorative_circle_2} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.__keyboard_view}
      >
        {/* NavBar */}
        <NavBar onLogoPress={onGoBack} />

        {/* Body */}
        <View style={styles.__body}>
          {/* Header */}
          <View style={styles.__header}>
            <Text style={styles.__title}>{t('login.title')}</Text>
            <Text style={styles.__subtitle}>{t('login.subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.__form_container}>
            <View style={styles.__input_container}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.__input_icon} />
              <TextInput
                style={styles.__input}
                placeholder={t('login.email')}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.__input_container}>
              <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.__input_icon} />
              <TextInput
                style={styles.__input}
                placeholder={t('login.password')}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.__eye_icon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#FFD700"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.__login_button}
              onPress={handleLogin}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.__button_gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.__login_button_text}>{t('login.loginButton')}</Text>
              </LinearGradient>
              <View style={styles.__button_shadow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.__forgot_password_link}
              onPress={onNavigateToForgotPassword}
            >
              <Text style={styles.__forgot_password_text}>
                {t('login.forgotPassword') || 'Forgot Password?'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.__signup_link}
              onPress={onNavigateToSignup}
            >
              <Text style={styles.__signup_link_text}>
                {t('login.signupLink')} <Text style={styles.__signup_link_bold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>

            {/* Quick Login Buttons for Testing */}
            <View style={styles.__quick_login_container}>
              <Text style={styles.__quick_login_label}>Quick Login (Testing):</Text>
              <View style={styles.__quick_login_buttons}>
                <TouchableOpacity
                  style={[styles.__quick_login_button, styles.__quick_login_customer]}
                  onPress={() => handleQuickLogin('customer')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.__quick_login_button_text}>Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.__quick_login_button, styles.__quick_login_barber]}
                  onPress={() => handleQuickLogin('barber')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.__quick_login_button_text}>Barber Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  __container: {
    flex: 1,
    position: 'relative',
  },
  __decorative_circle_1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    top: -80,
    right: -80,
  },
  __decorative_circle_2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
    bottom: 50,
    left: -40,
  },
  __keyboard_view: {
    flex: 1,
    zIndex: 1,
  },
  __body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  __header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  __title: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  __subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  __form_container: {
    marginTop: 0,
  },
  __input_container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  __input_icon: {
    marginRight: 10,
    color: '#FFD700',
  },
  __input: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  __eye_icon: {
    padding: 4,
  },
  __login_button: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 10,
    position: 'relative',
  },
  __button_gradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  __button_shadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 22,
    top: 2,
    zIndex: 0,
  },
  __login_button_text: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  __forgot_password_link: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  __forgot_password_text: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __signup_link: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  __signup_link_text: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  __signup_link_bold: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __quick_login_container: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  __quick_login_label: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
    textAlign: 'center',
  },
  __quick_login_buttons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  __quick_login_button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  __quick_login_customer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  __quick_login_barber: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  __quick_login_button_text: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
});

export default LoginScreen;


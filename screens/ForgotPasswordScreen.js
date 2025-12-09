import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import NavBar from '../components/NavBar';

const ForgotPasswordScreen = ({ onGoBack, onNavigateToLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        t('forgotPassword.errorTitle') || 'Error',
        t('forgotPassword.emailRequired') || 'Please enter your email address'
      );
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        t('forgotPassword.errorTitle') || 'Error',
        t('forgotPassword.invalidEmail') || 'Please enter a valid email address'
      );
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        t('forgotPassword.successTitle') || 'Success',
        t('forgotPassword.successMessage') || 'Password reset instructions have been sent to your email.',
        [
          {
            text: t('forgotPassword.ok') || 'OK',
            onPress: () => onNavigateToLogin(),
          },
        ]
      );
    }, 1500);
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
            <View style={styles.__icon_container}>
              <Ionicons name="lock-closed" size={48} color="#FFD700" />
            </View>
            <Text style={styles.__title}>{t('forgotPassword.title')}</Text>
            <Text style={styles.__subtitle}>{t('forgotPassword.subtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.__form_container}>
            <View style={styles.__input_container}>
              <Ionicons name="mail-outline" size={20} color="#FFD700" style={styles.__input_icon} />
              <TextInput
                style={styles.__input}
                placeholder={t('forgotPassword.emailPlaceholder')}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity
              style={[styles.__reset_button, isSubmitting && styles.__reset_button_disabled]}
              onPress={handleResetPassword}
              activeOpacity={0.9}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? ['#9CA3AF', '#6B7280'] : ['#FFD700', '#FFA500']}
                style={styles.__button_gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.__reset_button_text}>
                  {isSubmitting 
                    ? t('forgotPassword.sending') || 'Sending...'
                    : t('forgotPassword.resetButton') || 'Send Reset Link'}
                </Text>
              </LinearGradient>
              {!isSubmitting && <View style={styles.__button_shadow} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.__back_link}
              onPress={onNavigateToLogin}
            >
              <Ionicons name="arrow-back" size={16} color="#FFD700" />
              <Text style={styles.__back_link_text}>
                {t('forgotPassword.backToLogin') || 'Back to Login'}
              </Text>
            </TouchableOpacity>
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
    marginBottom: 32,
    alignItems: 'center',
  },
  __icon_container: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __title: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  __subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
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
    marginBottom: 20,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  __input_icon: {
    marginRight: 10,
  },
  __input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  __reset_button: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 16,
    position: 'relative',
  },
  __reset_button_disabled: {
    opacity: 0.7,
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
  __reset_button_text: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  __back_link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  __back_link_text: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    marginLeft: 6,
  },
});

export default ForgotPasswordScreen;



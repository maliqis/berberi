import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { saveLanguage } from '../i18n';
import Logo from '../components/Logo';

const LandingScreen = ({ onNavigateToLogin, onNavigateToSignup }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const changeLanguage = async (lng) => {
    await saveLanguage(lng);
    setShowLanguagePicker(false);
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
      <View style={styles.__decorative_circle_3} />
      
      <View style={styles.__content}>
        {/* Header Section */}
        <View style={styles.__header}>
          <Logo variant="home" />
          
          <View style={styles.__tagline_container}>
            <View style={styles.__tagline_line} />
            <Text style={styles.__app_tagline}>{t('landing.tagline')}</Text>
            <View style={styles.__tagline_line} />
          </View>
          
          <Text style={styles.__app_subtitle}>
            {t('landing.subtitle')}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.__actions_container}>
          {user ? (
            // Logged in - show Browse and My Barber buttons
            <>
              <TouchableOpacity
                style={styles.__primary_button}
                onPress={() => navigation?.replace('MainTabs', { screen: 'Browse' })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.__button_gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="globe" size={22} color="#1a1a2e" />
                  <Text style={styles.__primary_button_text}>{t('navigation.browse')}</Text>
                  <Ionicons name="arrow-forward" size={22} color="#1a1a2e" />
                </LinearGradient>
                <View style={styles.__button_shadow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.__secondary_button}
                onPress={() => navigation?.replace('MainTabs', { screen: 'MyBarber' })}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 165, 0, 0.2)']}
                  style={styles.__button_gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="heart" size={22} color="#FFD700" />
                  <Text style={styles.__secondary_button_text}>{t('navigation.myBarber')}</Text>
                  <Ionicons name="arrow-forward" size={22} color="#FFD700" />
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            // Not logged in - show Get Started and Login
            <>
              <TouchableOpacity
                style={styles.__primary_button}
                onPress={onNavigateToSignup}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.__button_gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.__primary_button_text}>{t('landing.getStarted')}</Text>
                  <Ionicons name="arrow-forward" size={22} color="#1a1a2e" />
                </LinearGradient>
                <View style={styles.__button_shadow} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.__login_link}
                onPress={onNavigateToLogin}
                activeOpacity={0.7}
              >
                <Text style={styles.__login_link_text}>{t('landing.login')}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Language Picker */}
          <TouchableOpacity
            style={styles.__language_button}
            onPress={() => setShowLanguagePicker(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="language" size={20} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.__language_text}>
              {i18n.language === 'al' ? 'Shqip' : i18n.language === 'sr' ? 'Српски' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Language Picker Modal */}
        <Modal
          visible={showLanguagePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLanguagePicker(false)}
        >
          <TouchableOpacity
            style={styles.__modal_overlay}
            activeOpacity={1}
            onPress={() => setShowLanguagePicker(false)}
          >
            <View style={styles.__language_modal}>
              <Text style={styles.__language_modal_title}>{t('landing.selectLanguage')}</Text>
              
              <TouchableOpacity
                style={[
                  styles.__language_option,
                  i18n.language === 'al' && styles.__language_option_active,
                ]}
                onPress={() => changeLanguage('al')}
              >
                <Text
                  style={[
                    styles.__language_option_text,
                    i18n.language === 'al' && styles.__language_option_text_active,
                  ]}
                >
                  Shqip
                </Text>
                {i18n.language === 'al' && (
                  <Ionicons name="checkmark" size={20} color="#FFD700" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.__language_option,
                  i18n.language === 'en' && styles.__language_option_active,
                ]}
                onPress={() => changeLanguage('en')}
              >
                <Text
                  style={[
                    styles.__language_option_text,
                    i18n.language === 'en' && styles.__language_option_text_active,
                  ]}
                >
                  English
                </Text>
                {i18n.language === 'en' && (
                  <Ionicons name="checkmark" size={20} color="#FFD700" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.__language_option,
                  i18n.language === 'sr' && styles.__language_option_active,
                ]}
                onPress={() => changeLanguage('sr')}
              >
                <Text
                  style={[
                    styles.__language_option_text,
                    i18n.language === 'sr' && styles.__language_option_text_active,
                  ]}
                >
                  Српски
                </Text>
                {i18n.language === 'sr' && (
                  <Ionicons name="checkmark" size={20} color="#FFD700" />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
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
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    top: -100,
    right: -100,
  },
  __decorative_circle_2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
    bottom: 100,
    left: -50,
  },
  __decorative_circle_3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
    top: '40%',
    right: -30,
  },
  __content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingBottom: 50,
    zIndex: 1,
  },
  __header: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  __logo_container: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  __logo_gradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __logo_glow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    zIndex: -1,
  },
  __app_title: {
    fontSize: 72,
    fontFamily: 'GreatVibes_400Regular',
    color: '#FFD700',
    marginBottom: 16,
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  __tagline_container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    maxWidth: 280,
  },
  __tagline_line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  __app_tagline: {
    fontSize: 14,
    color: '#FFD700',
    marginHorizontal: 12,
    letterSpacing: 2,
    fontWeight: '300',
  },
  __app_subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '300',
    letterSpacing: 1,
  },
  __actions_container: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  __primary_button: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
    position: 'relative',
  },
  __button_gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
    zIndex: 1,
  },
  __button_shadow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 30,
    top: 4,
    zIndex: 0,
  },
  __primary_button_text: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
    marginLeft: 10,
    marginRight: 10,
    letterSpacing: 1,
  },
  __login_link: {
    paddingVertical: 14,
  },
  __login_link_text: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  __secondary_button: {
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __secondary_button_text: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginLeft: 10,
    marginRight: 10,
    letterSpacing: 1,
  },
  __language_button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  __language_text: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 8,
    fontWeight: '400',
  },
  __modal_overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  __language_modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    width: '100%',
    maxWidth: 300,
    padding: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __language_modal_title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  __language_option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  __language_option_active: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  __language_option_text: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  __language_option_text_active: {
    color: '#FFD700',
    fontWeight: '700',
  },
});

export default LandingScreen;


import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import NavBar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';

const SignupScreen = ({ onNavigateToLogin, onGoBack }) => {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user' or 'barber'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Barber-specific fields
  const [shopName, setShopName] = useState('');
  const [logo, setLogo] = useState(null);
  const [workingDays, setWorkingDays] = useState([]); // Array of day indices: 0=Sunday, 1=Monday, etc.
  const [shiftStart, setShiftStart] = useState(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const [shiftEnd, setShiftEnd] = useState(() => {
    const date = new Date();
    date.setHours(17, 0, 0, 0);
    return date;
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [slotLengthMinutes, setSlotLengthMinutes] = useState(30);

  const daysOfWeek = [
    { key: 1, label: t('signup.monday') || 'Mon' },
    { key: 2, label: t('signup.tuesday') || 'Tue' },
    { key: 3, label: t('signup.wednesday') || 'Wed' },
    { key: 4, label: t('signup.thursday') || 'Thu' },
    { key: 5, label: t('signup.friday') || 'Fri' },
    { key: 6, label: t('signup.saturday') || 'Sat' },
    { key: 0, label: t('signup.sunday') || 'Sun' },
  ];

  const toggleWorkingDay = (dayKey) => {
    setWorkingDays(prev => 
      prev.includes(dayKey) 
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('signup.permissionDenied') || 'Permission Denied',
        t('signup.imagePermissionMessage') || 'Sorry, we need camera roll permissions to upload a logo!'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLogo(result.assets[0].uri);
    }
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSignup = async () => {
    // Basic validation
    if (!firstName || !lastName || !phoneNumber || !email || !password) {
      Alert.alert(
        t('signup.errorTitle') || 'Error',
        t('signup.fillAllFields') || 'Please fill in all required fields'
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        t('signup.errorTitle') || 'Error',
        t('signup.passwordsDontMatch') || 'Passwords do not match'
      );
      return;
    }

    // Barber-specific validation
    if (role === 'barber' || role === 'barberAdmin') {
      if (!shopName.trim()) {
        Alert.alert(
          t('signup.errorTitle') || 'Error',
          t('signup.shopNameRequired') || 'Shop name is required'
        );
        return;
      }
      if (workingDays.length === 0) {
        Alert.alert(
          t('signup.errorTitle') || 'Error',
          t('signup.workingDaysRequired') || 'Please select at least one working day'
        );
        return;
      }
      const slotLength = slotLengthMinutes;
      if (slotLength < 10 || slotLength > 60) {
        Alert.alert(
          t('signup.errorTitle') || 'Error',
          t('signup.slotLengthInvalid') || 'Slot length must be between 10 and 60 minutes'
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      const userData = {
        firstName,
        lastName,
        phoneNumber,
        email,
        password,
        role: role === 'barber' ? 'barberAdmin' : 'user', // Backend expects 'barberAdmin'
      };

      if (role === 'barber' || role === 'barberAdmin') {
        userData.shopName = shopName.trim();
        userData.logo = logo;
        userData.workingDays = workingDays.sort();
        userData.shiftStart = formatTime(shiftStart);
        userData.shiftEnd = formatTime(shiftEnd);
        userData.slotLengthMinutes = slotLengthMinutes;
      }

      await signup(userData);
      // Navigation will be handled by App.js based on user role
    } catch (error) {
      Alert.alert(
        t('signup.errorTitle') || 'Signup Failed',
        error.message || t('signup.signupError') || 'Failed to create account. Please try again.'
      );
    } finally {
      setIsLoading(false);
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
        <ScrollView 
          style={styles.__body}
          contentContainerStyle={styles.__body_content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.__header}>
            <Text style={styles.__title}>{t('signup.title')}</Text>
            <Text style={styles.__subtitle}>{t('signup.subtitle')}</Text>
          </View>

          {/* Role Selection */}
          <View style={styles.__role_container}>
            <Text style={styles.__role_label}>{t('signup.iam')}</Text>
            <View style={styles.__role_buttons}>
              <TouchableOpacity
                style={[
                  styles.__role_button,
                  role === 'user' && styles.__role_button_active,
                ]}
                onPress={() => setRole('user')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={role === 'user' ? '#FFFFFF' : '#FFD700'}
                />
                <Text
                  style={[
                    styles.__role_button_text,
                    role === 'user' && styles.__role_button_text_active,
                  ]}
                >
                  {t('signup.customer')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.__role_button,
                  role === 'barber' && styles.__role_button_active,
                ]}
                onPress={() => setRole('barber')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="cut-outline"
                  size={20}
                  color={role === 'barber' ? '#FFFFFF' : '#FFD700'}
                />
                <Text
                  style={[
                    styles.__role_button_text,
                    role === 'barber' && styles.__role_button_text_active,
                  ]}
                >
                  {t('signup.barber')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form */}
          <View style={styles.__form_container}>
            <View style={styles.__input_row}>
              <View style={styles.__input_container_half}>
                <Ionicons name="person-outline" size={20} color="#FFD700" style={styles.__input_icon} />
                <TextInput
                  style={styles.__input}
                  placeholder={t('signup.firstName')}
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.__input_container_half}>
                <Ionicons name="person-outline" size={20} color="#FFD700" style={styles.__input_icon} />
                <TextInput
                  style={styles.__input}
                  placeholder={t('signup.lastName')}
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.__input_container}>
              <Ionicons name="call-outline" size={20} color="#FFD700" style={styles.__input_icon} />
              <TextInput
                style={styles.__input}
                placeholder={t('signup.phoneNumber')}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.__input_container}>
              <Ionicons name="mail-outline" size={20} color="#FFD700" style={styles.__input_icon} />
              <TextInput
                style={styles.__input}
                placeholder={t('signup.email')}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.__input_container}>
              <Ionicons name="lock-closed-outline" size={20} color="#FFD700" style={styles.__input_icon} />
              <TextInput
                style={styles.__input}
                placeholder={t('signup.password')}
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

            <View style={styles.__input_container}>
              <Ionicons name="lock-closed-outline" size={20} color="#FFD700" style={styles.__input_icon} />
              <TextInput
                style={styles.__input}
                placeholder={t('signup.confirmPassword')}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.__eye_icon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#FFD700"
                />
              </TouchableOpacity>
            </View>

            {/* Barber-specific fields */}
            {role === 'barber' && (
              <>
                <View style={styles.__section_divider} />
                <Text style={styles.__section_title}>{t('signup.barberShopInfo') || 'Barber Shop Information'}</Text>
                
                <View style={styles.__input_container}>
                  <Ionicons name="storefront-outline" size={20} color="#FFD700" style={styles.__input_icon} />
                  <TextInput
                    style={styles.__input}
                    placeholder={t('signup.shopName') || 'Shop Name'}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={shopName}
                    onChangeText={setShopName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.__logo_upload_container}>
                  <TouchableOpacity
                    style={styles.__logo_upload_button}
                    onPress={pickImage}
                    activeOpacity={0.7}
                  >
                    {logo ? (
                      <Image source={{ uri: logo }} style={styles.__logo_preview} />
                    ) : (
                      <View style={styles.__logo_placeholder}>
                        <Ionicons name="image-outline" size={40} color="#FFD700" />
                        <Text style={styles.__logo_placeholder_text}>
                          {t('signup.uploadLogo') || 'Upload Logo'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.__working_days_container}>
                  <Text style={styles.__working_days_label}>{t('signup.workingDays') || 'Working Days'}</Text>
                  <View style={styles.__working_days_buttons}>
                    {daysOfWeek.map((day) => (
                      <TouchableOpacity
                        key={day.key}
                        style={[
                          styles.__day_button,
                          workingDays.includes(day.key) && styles.__day_button_selected,
                          day.key === 0 && styles.__day_button_sunday,
                        ]}
                        onPress={() => toggleWorkingDay(day.key)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.__day_button_text,
                            workingDays.includes(day.key) && styles.__day_button_text_selected,
                            day.key === 0 && styles.__day_button_text_sunday,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.__time_row}>
                  <View style={styles.__time_container}>
                    <Text style={styles.__time_label}>{t('signup.shiftStart') || 'Shift Start'}</Text>
                    <TouchableOpacity
                      style={styles.__time_picker_button}
                      onPress={() => setShowStartTimePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="time-outline" size={20} color="#FFD700" />
                      <Text style={styles.__time_picker_text}>{formatTime(shiftStart)}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.__time_container}>
                    <Text style={styles.__time_label}>{t('signup.shiftEnd') || 'Shift End'}</Text>
                    <TouchableOpacity
                      style={styles.__time_picker_button}
                      onPress={() => setShowEndTimePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="time-outline" size={20} color="#FFD700" />
                      <Text style={styles.__time_picker_text}>{formatTime(shiftEnd)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {showStartTimePicker && (
                  <DateTimePicker
                    value={shiftStart}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedTime) => {
                      setShowStartTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setShiftStart(selectedTime);
                      }
                    }}
                  />
                )}

                {showEndTimePicker && (
                  <DateTimePicker
                    value={shiftEnd}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedTime) => {
                      setShowEndTimePicker(Platform.OS === 'ios');
                      if (selectedTime) {
                        setShiftEnd(selectedTime);
                      }
                    }}
                  />
                )}

                <View style={styles.__slot_length_container}>
                  <Text style={styles.__working_days_label}>{t('signup.slotLength') || 'Slot Length (minutes)'}</Text>
                  <View style={styles.__slot_length_controls}>
                    <TouchableOpacity
                      style={[
                        styles.__slot_length_button,
                        slotLengthMinutes <= 10 && styles.__slot_length_button_disabled,
                      ]}
                      onPress={() => {
                        if (slotLengthMinutes > 10) {
                          setSlotLengthMinutes(slotLengthMinutes - 5);
                        }
                      }}
                      disabled={slotLengthMinutes <= 10}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="remove" size={18} color={slotLengthMinutes <= 10 ? 'rgba(255, 215, 0, 0.3)' : '#FFD700'} />
                    </TouchableOpacity>
                    <Text style={styles.__slot_length_display}>{slotLengthMinutes} min</Text>
                    <TouchableOpacity
                      style={[
                        styles.__slot_length_button,
                        slotLengthMinutes >= 60 && styles.__slot_length_button_disabled,
                      ]}
                      onPress={() => {
                        if (slotLengthMinutes < 60) {
                          setSlotLengthMinutes(slotLengthMinutes + 5);
                        }
                      }}
                      disabled={slotLengthMinutes >= 60}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="add" size={18} color={slotLengthMinutes >= 60 ? 'rgba(255, 215, 0, 0.3)' : '#FFD700'} />
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.__signup_button, isLoading && styles.__signup_button_disabled]}
              onPress={handleSignup}
              activeOpacity={0.9}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.__button_gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#1a1a2e" />
                ) : (
                  <Text style={styles.__signup_button_text}>{t('signup.signupButton')}</Text>
                )}
              </LinearGradient>
              <View style={styles.__button_shadow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.__login_link}
              onPress={onNavigateToLogin}
            >
              <Text style={styles.__login_link_text}>
                {t('signup.loginLink')} <Text style={styles.__login_link_bold}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
  __body_content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  __header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  __logo_container: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  __logo_gradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __logo_glow: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 57.5,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    zIndex: -1,
  },
  __app_title: {
    fontSize: 56,
    fontFamily: 'GreatVibes_400Regular',
    color: '#FFD700',
    marginBottom: 16,
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
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
  __role_container: {
    marginBottom: 12,
  },
  __role_label: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 6,
  },
  __role_buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  __role_button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  __role_button_active: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  __role_button_text: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
  },
  __role_button_text_active: {
    color: '#FFD700',
  },
  __form_container: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  __input_row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  __input_container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  __input_container_half: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
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
    color: '#FFFFFF',
  },
  __eye_icon: {
    padding: 4,
  },
  __signup_button: {
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
  __signup_button_text: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
    letterSpacing: 0.5,
  },
  __signup_button_disabled: {
    opacity: 0.6,
  },
  __login_link: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  __login_link_text: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  __login_link_bold: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __section_divider: {
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginVertical: 20,
  },
  __section_title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  __logo_upload_container: {
    marginBottom: 16,
  },
  __logo_upload_container: {
    marginBottom: 16,
    alignItems: 'center',
  },
  __logo_upload_button: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  __logo_preview: {
    width: '100%',
    height: '100%',
  },
  __logo_placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  __logo_placeholder_text: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 215, 0, 0.7)',
  },
  __working_days_container: {
    marginBottom: 16,
  },
  __working_days_label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    marginBottom: 12,
  },
  __working_days_buttons: {
    flexDirection: 'row',
    gap: 2,
    justifyContent: 'space-between',
  },
  __day_button: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  __day_button_selected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  __day_button_sunday: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  __day_button_text: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 215, 0, 0.6)',
  },
  __day_button_text_selected: {
    color: '#FFD700',
  },
  __day_button_text_sunday: {
    color: 'rgba(239, 68, 68, 0.8)',
  },
  __time_row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  __time_container: {
    flex: 1,
  },
  __time_label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    marginBottom: 8,
  },
  __time_picker_button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 8,
  },
  __time_picker_text: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
    flex: 1,
  },
  __slot_length_container: {
    marginBottom: 16,
  },
  __slot_length_controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  __slot_length_button: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  __slot_length_button_disabled: {
    opacity: 0.5,
  },
  __slot_length_display: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    minWidth: 50,
    textAlign: 'center',
  },
});

export default SignupScreen;


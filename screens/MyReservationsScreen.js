import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import NavBar from '../components/NavBar';
import reservationService from '../services/reservationService';
import api from '../services/api';

// Barber Avatar Component with placeholder
const BarberAvatar = ({ imageUri, style }) => {
  const [imageError, setImageError] = useState(false);
  
  if (!imageUri || imageError) {
    return (
      <View style={[style, styles.__table_barber_avatar_placeholder]}>
        <Ionicons name="person" size={24} color="#FFD700" />
      </View>
    );
  }
  
  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      onError={() => setImageError(true)}
    />
  );
};


const MyReservationsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState(user?.firstName || user?.name?.split(' ')[0] || '');
  const [profileLastName, setProfileLastName] = useState(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load reservations on mount and when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadReservations();
    }, [])
  );

  // Update profile fields when user changes
  useEffect(() => {
    if (user) {
      setProfileFirstName(user.firstName || user.name?.split(' ')[0] || '');
      setProfileLastName(user.lastName || user.name?.split(' ').slice(1).join(' ') || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!profileFirstName.trim() || !profileLastName.trim()) {
      Alert.alert(
        t('profile.errorTitle') || 'Error',
        t('profile.nameRequired') || 'First name and last name are required'
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        name: `${profileFirstName.trim()} ${profileLastName.trim()}`, // Keep for backward compatibility
      });
      setIsEditingProfile(false);
      Alert.alert(
        t('profile.successTitle') || 'Success',
        t('profile.successMessage') || 'Profile updated successfully'
      );
    } catch (error) {
      Alert.alert(
        t('profile.errorTitle') || 'Error',
        t('profile.updateError') || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset to original user values
    setProfileFirstName(user?.firstName || user?.name?.split(' ')[0] || '');
    setProfileLastName(user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '');
    setIsEditingProfile(false);
  };

  const handleDeactivateUser = () => {
    Alert.alert(
      t('profile.deactivateTitle') || 'Deactivate Account',
      t('profile.deactivateMessage') || 'Are you sure you want to deactivate your account? This action cannot be undone.',
      [
        {
          text: t('profile.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('profile.deactivate') || 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              // API contract: DELETE /me deactivates account (returns 204 No Content)
              await api.delete('/me');
              Alert.alert(
                t('profile.deactivateSuccessTitle') || 'Account Deactivated',
                t('profile.deactivateSuccessMessage') || 'Your account has been deactivated. You will be logged out.',
                [
                  {
                    text: t('profile.ok') || 'OK',
                    onPress: () => {
                      logout();
                      const parent = navigation.getParent();
                      if (parent) {
                        parent.replace('Landing');
                      } else {
                        navigation.replace('Landing');
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                t('profile.errorTitle') || 'Error',
                error.message || t('profile.deactivateError') || 'Failed to deactivate account. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const loadReservations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const reservationsData = await reservationService.getReservations();
      
      // Transform API response to match UI expectations
      const transformedReservations = reservationsData.map(reservation => ({
        id: reservation.id,
        barberName: reservation.barberId ? `Barber ${reservation.barberId}` : t('myBarber.autoSelect') || 'Auto Select',
        shopName: reservation.shopName || 'Barbershop',
        barberImage: reservation.barberImage || null,
        date: reservation.date,
        time: reservation.time,
        barberId: reservation.barberId,
        firstName: reservation.firstName,
        lastName: reservation.lastName,
        comment: reservation.comment,
        status: reservation.status,
        createdAt: reservation.createdAt,
        updatedAt: reservation.updatedAt,
      }));

      setReservations(transformedReservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
      Alert.alert(
        t('reservations.errorTitle') || 'Error',
        error.message || t('reservations.loadError') || 'Failed to load reservations. Please try again.'
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleLogoPress = () => {
    const parent = navigation.getParent();
    if (parent) {
      parent.replace('Landing');
    } else {
      navigation.replace('Landing');
    }
  };

  const handleLogout = () => {
    logout();
    const parent = navigation.getParent();
    if (parent) {
      parent.replace('Landing');
    } else {
      navigation.replace('Landing');
    }
  };

  // Handle cancel reservation
  const handleCancelReservation = async (reservationId) => {
    Alert.alert(
      t('reservations.cancelTitle') || 'Cancel Reservation',
      t('reservations.cancelMessage') || 'Are you sure you want to cancel this reservation?',
      [
        {
          text: t('reservations.no') || 'No',
          style: 'cancel',
        },
        {
          text: t('reservations.yes') || 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await reservationService.cancelReservation(reservationId);
              // Reload reservations
              await loadReservations();
              Alert.alert(
                t('reservations.cancelSuccessTitle') || 'Reservation Canceled',
                t('reservations.cancelSuccessMessage') || 'Your reservation has been canceled successfully.'
              );
            } catch (error) {
              Alert.alert(
                t('reservations.errorTitle') || 'Error',
                error.message || t('reservations.cancelError') || 'Failed to cancel reservation. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return t('myBarber.today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('myBarber.tomorrow');
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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

      {/* NavBar */}
      <NavBar onLogoPress={handleLogoPress} onLogout={handleLogout} />

      {/* Body */}
      <View style={[styles.__body, { paddingLeft: Math.max(insets.left, 20), paddingRight: Math.max(insets.right, 20) }]}>
        <View style={styles.__header}>
          <Text style={styles.__header_title}>{t('profile.title') || 'My Profile'}</Text>
          <Text style={styles.__header_subtitle}>{t('profile.subtitle') || 'Manage your profile and reservations'}</Text>
        </View>

        <ScrollView
          style={styles.__content}
          contentContainerStyle={styles.__content_container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadReservations(true)}
              tintColor="#FFD700"
            />
          }
        >
          {/* Profile Section */}
          <View style={styles.__profile_section}>
            <View style={styles.__profile_header}>
              {!isEditingProfile && (
                <TouchableOpacity
                  style={styles.__edit_button}
                  onPress={() => setIsEditingProfile(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={18} color="#FFD700" />
                  <Text style={styles.__edit_button_text}>{t('profile.editProfile') || 'Edit Profile'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.__profile_form}>
              <View style={styles.__profile_input_row}>
                <View style={styles.__profile_input_container_half}>
                  <Ionicons name="person-outline" size={20} color="#FFD700" style={styles.__profile_input_icon} />
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.__profile_input}
                      placeholder={t('profile.firstNamePlaceholder') || 'First Name'}
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={profileFirstName}
                      onChangeText={setProfileFirstName}
                      editable={!isSaving}
                      multiline={false}
                    />
                  ) : (
                    <Text style={styles.__profile_text} numberOfLines={1} ellipsizeMode="tail">
                      {user?.firstName || user?.name?.split(' ')[0] || '-'}
                    </Text>
                  )}
                </View>
                
                <View style={styles.__profile_input_container_half}>
                  <Ionicons name="person-outline" size={20} color="#FFD700" style={styles.__profile_input_icon} />
                  {isEditingProfile ? (
                    <TextInput
                      style={styles.__profile_input}
                      placeholder={t('profile.lastNamePlaceholder') || 'Last Name'}
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      value={profileLastName}
                      onChangeText={setProfileLastName}
                      editable={!isSaving}
                      multiline={false}
                    />
                  ) : (
                    <Text style={styles.__profile_text} numberOfLines={1} ellipsizeMode="tail">
                      {user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '-'}
                    </Text>
                  )}
                </View>
              </View>

              {isEditingProfile && (
                <View style={styles.__edit_actions}>
                  <TouchableOpacity
                    style={styles.__cancel_button}
                    onPress={handleCancelEdit}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.__cancel_button_text}>{t('profile.cancel') || 'Cancel'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.__save_button, isSaving && styles.__save_button_disabled]}
                    onPress={handleSaveProfile}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.__save_button_text}>
                      {isSaving ? t('profile.saving') || 'Saving...' : t('profile.save') || 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {!isEditingProfile && (
                <TouchableOpacity
                  style={styles.__deactivate_button}
                  onPress={handleDeactivateUser}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  <Text style={styles.__deactivate_button_text}>
                    {t('profile.deactivate') || 'Deactivate Account'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Reservations Section */}
          <View style={styles.__reservations_section}>
            <Text style={styles.__reservations_section_title}>{t('reservations.title')}</Text>
            {reservations.length === 0 ? (
              <View style={styles.__empty_state}>
                <Ionicons name="calendar-outline" size={64} color="rgba(255, 215, 0, 0.5)" />
                <Text style={styles.__empty_state_text}>{t('reservations.noReservations')}</Text>
              </View>
            ) : (
              <View style={styles.__table_container}>
              {/* Table Header */}
              <View style={styles.__table_header}>
                <Text style={[styles.__table_header_text, styles.__table_header_text_barber]}>{t('reservations.tableBarber')}</Text>
                <Text style={[styles.__table_header_text, styles.__table_header_text_center]}>{t('reservations.tableDate')}</Text>
                <Text style={[styles.__table_header_text, styles.__table_header_text_center]}>{t('reservations.tableTime')}</Text>
              </View>

              {/* Table Rows */}
              {reservations.map((reservation, index) => (
                <View
                  key={index}
                  style={[
                    styles.__table_row,
                    index < reservations.length - 1 && styles.__table_row_border,
                  ]}
                >
                  <View style={styles.__table_cell_barber}>
                    <BarberAvatar
                      imageUri={reservation.barberImage}
                      style={styles.__table_barber_image}
                    />
                    <View style={styles.__table_barber_info}>
                      <Text style={styles.__table_barber_name} numberOfLines={1}>
                        {reservation.barberName}
                      </Text>
                      <Text style={styles.__table_shop_name} numberOfLines={1}>
                        {reservation.shopName}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.__table_cell}>
                    <Text style={styles.__table_cell_text} numberOfLines={2}>
                      {formatDate(reservation.date)}
                    </Text>
                  </View>
                  <View style={styles.__table_cell}>
                    <Text style={styles.__table_cell_text}>{reservation.time}</Text>
                  </View>
                  <View style={styles.__table_cell}>
                    {reservation.status !== 'canceled' && (
                      <TouchableOpacity
                        style={styles.__cancel_reservation_button}
                        onPress={() => handleCancelReservation(reservation.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                        <Text style={styles.__cancel_reservation_text}>
                          {t('reservations.cancel') || 'Cancel'}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {reservation.status === 'canceled' && (
                      <Text style={styles.__canceled_status}>
                        {t('reservations.canceled') || 'Canceled'}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
              </View>
            )}
          </View>
        </ScrollView>
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
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    top: -80,
    right: -80,
    zIndex: 0,
  },
  __decorative_circle_2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 165, 0, 0.05)',
    bottom: 100,
    left: -40,
    zIndex: 0,
  },
  __body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  __header: {
    paddingBottom: 16,
    alignItems: 'center',
    zIndex: 1,
  },
  __header_title: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  __header_subtitle: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  __content: {
    flex: 1,
    zIndex: 1,
  },
  __content_container: {
    paddingBottom: 30,
  },
  __profile_section: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  __profile_header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  __edit_button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  __edit_button_text: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    marginLeft: 6,
  },
  __edit_actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  __cancel_button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  __cancel_button_text: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  __save_button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  __save_button_disabled: {
    opacity: 0.5,
  },
  __save_button_text: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  __profile_form: {
    gap: 12,
  },
  __profile_input_row: {
    flexDirection: 'row',
    gap: 12,
  },
  __profile_input_container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    minWidth: 0,
  },
  __profile_input_container_half: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    minWidth: 0,
  },
  __profile_input_icon: {
    marginRight: 10,
    flexShrink: 0,
  },
  __profile_input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    minWidth: 0,
  },
  __profile_text: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    minWidth: 0,
  },
  __deactivate_button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 8,
  },
  __deactivate_button_text: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#EF4444',
    marginLeft: 6,
  },
  __reservations_section: {
    marginTop: 8,
  },
  __reservations_section_title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 16,
  },
  __empty_state: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  __empty_state_text: {
    fontSize: 18,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
  },
  __table_container: {
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  __table_header: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  __table_header_text: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  __table_header_text_barber: {
    flex: 2,
    textAlign: 'left',
  },
  __table_header_text_center: {
    textAlign: 'center',
  },
  __table_row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
  },
  __table_row_border: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.15)',
  },
  __table_cell_barber: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  __table_cell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  __table_barber_image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    marginRight: 10,
  },
  __table_barber_avatar_placeholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    marginRight: 10,
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  __table_barber_info: {
    flex: 1,
  },
  __table_barber_name: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 2,
  },
  __table_shop_name: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  __table_cell_text: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
});

export default MyReservationsScreen;


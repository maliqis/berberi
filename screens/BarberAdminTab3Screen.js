import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import NavBar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';

const BarberAdminTab3Screen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();

  // Shop settings state
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [logo, setLogo] = useState(user?.logo || null);
  const [workingDays, setWorkingDays] = useState(user?.workingDays || []);
  const [shiftStart, setShiftStart] = useState(() => {
    if (user?.shiftStart) {
      const [hours, minutes] = user.shiftStart.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date;
    }
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const [shiftEnd, setShiftEnd] = useState(() => {
    if (user?.shiftEnd) {
      const [hours, minutes] = user.shiftEnd.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date;
    }
    const date = new Date();
    date.setHours(17, 0, 0, 0);
    return date;
  });
  const [slotLengthMinutes, setSlotLengthMinutes] = useState(user?.slotLengthMinutes || 30);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Employees state
  const [employees, setEmployees] = useState(user?.employees || []);
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  // Plan limit (mock - in real app, this would come from user subscription)
  const getPlanLimit = () => {
    // Mock plan: determine based on user subscription/plan
    // In real app, this would come from user.plan or user.subscription
    const currentEmployeeCount = employees.length;
    
    // Determine plan based on current count or user data
    // For demo: if user has a plan field, use it; otherwise infer from employee count
    if (user?.plan === 'basic' || (!user?.plan && currentEmployeeCount === 0)) {
      return { min: 1, max: 1, label: '1' };
    } else if (user?.plan === 'standard' || (!user?.plan && currentEmployeeCount >= 1 && currentEmployeeCount <= 4)) {
      return { min: 2, max: 4, label: '2-4' };
    } else {
      return { min: 5, max: 999, label: '5+' };
    }
  };

  const planLimit = getPlanLimit();
  const canAddEmployee = employees.length < planLimit.max;

  const daysOfWeek = [
    { key: 1, label: t('signup.monday') || 'Mon' },
    { key: 2, label: t('signup.tuesday') || 'Tue' },
    { key: 3, label: t('signup.wednesday') || 'Wed' },
    { key: 4, label: t('signup.thursday') || 'Thu' },
    { key: 5, label: t('signup.friday') || 'Fri' },
    { key: 6, label: t('signup.saturday') || 'Sat' },
    { key: 0, label: t('signup.sunday') || 'Sun' },
  ];

  useEffect(() => {
    if (user) {
      setShopName(user.shopName || '');
      setLogo(user.logo || null);
      setWorkingDays(user.workingDays || []);
      setSlotLengthMinutes(user.slotLengthMinutes || 30);
      setEmployees(user.employees || []);
    }
  }, [user]);

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('signup.permissionDenied') || 'Permission Denied',
        t('signup.imagePermissionMessage') || 'Sorry, we need camera roll permissions!'
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

  const toggleWorkingDay = (dayKey) => {
    setWorkingDays(prev => 
      prev.includes(dayKey) 
        ? prev.filter(d => d !== dayKey)
        : [...prev, dayKey]
    );
  };

  const formatTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSaveSettings = async () => {
    if (!shopName.trim()) {
      Alert.alert(
        t('settings.errorTitle') || 'Error',
        t('settings.shopNameRequired') || 'Shop name is required'
      );
      return;
    }
    if (workingDays.length === 0) {
      Alert.alert(
        t('settings.errorTitle') || 'Error',
        t('settings.workingDaysRequired') || 'Please select at least one working day'
      );
      return;
    }
    const slotLength = slotLengthMinutes;
    if (slotLength < 10 || slotLength > 60) {
      Alert.alert(
        t('settings.errorTitle') || 'Error',
        t('settings.slotLengthInvalid') || 'Slot length must be between 10 and 60 minutes'
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateUser({
        shopName: shopName.trim(),
        logo,
        workingDays: workingDays.sort(),
        shiftStart: formatTime(shiftStart),
        shiftEnd: formatTime(shiftEnd),
        slotLengthMinutes: slotLength,
        employees,
      });
      Alert.alert(
        t('settings.successTitle') || 'Success',
        t('settings.savedSuccessfully') || 'Settings saved successfully'
      );
    } catch (error) {
      Alert.alert(
        t('settings.errorTitle') || 'Error',
        t('settings.saveError') || 'Failed to save settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmployee = () => {
    if (!newEmployeeName.trim()) {
      Alert.alert(
        t('settings.errorTitle') || 'Error',
        t('settings.employeeNameRequired') || 'Employee name is required'
      );
      return;
    }
    if (employees.length >= planLimit.max) {
      Alert.alert(
        t('settings.errorTitle') || 'Error',
        t('settings.planLimitReached') || 'Plan limit reached'
      );
      return;
    }

    const newEmployee = {
      id: `emp_${Date.now()}`,
      name: newEmployeeName.trim(),
      shiftStart: formatTime(shiftStart),
      shiftEnd: formatTime(shiftEnd),
      slotLengthMinutes: parseInt(slotLengthMinutes),
    };

    setEmployees([...employees, newEmployee]);
    setNewEmployeeName('');
    setShowAddEmployee(false);
  };

  const handleRemoveEmployee = (employeeId) => {
    Alert.alert(
      t('settings.removeEmployee') || 'Remove Employee',
      t('settings.removeEmployeeConfirm') || 'Are you sure you want to remove this employee?',
      [
        { text: t('settings.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('settings.remove') || 'Remove',
          style: 'destructive',
          onPress: () => {
            setEmployees(employees.filter(emp => emp.id !== employeeId));
          },
        },
      ]
    );
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
            paddingBottom: insets.bottom + 20,
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.__title}>{t('settings.title') || 'Settings'}</Text>

        {/* Plan Limit Info */}
        <View style={styles.__plan_info}>
          <Ionicons name="information-circle-outline" size={14} color="rgba(255, 215, 0, 0.7)" />
          <Text style={styles.__plan_info_text}>
            {t('settings.planLimit') || 'Plan'}: {planLimit.label} {t('settings.employees') || 'employees'}
            {' '}({employees.length}/{planLimit.max})
          </Text>
        </View>

        {/* Shop Settings */}
        <View style={styles.__section}>
          <Text style={styles.__section_title}>{t('settings.shopSettings') || 'Shop Settings'}</Text>
          
          <View style={styles.__input_container}>
            <Ionicons name="storefront-outline" size={18} color="#FFD700" style={styles.__input_icon} />
            <TextInput
              style={styles.__input}
              placeholder={t('signup.shopName') || 'Shop Name'}
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={shopName}
              onChangeText={setShopName}
            />
          </View>

          <View style={styles.__logo_container}>
            <TouchableOpacity style={styles.__logo_button} onPress={pickImage} activeOpacity={0.7}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.__logo_preview} />
              ) : (
                <View style={styles.__logo_placeholder}>
                  <Ionicons name="image-outline" size={40} color="#FFD700" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.__working_days_container}>
            <Text style={styles.__label}>{t('signup.workingDays') || 'Working Days'}</Text>
            <View style={styles.__days_row}>
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
                      styles.__day_text,
                      workingDays.includes(day.key) && styles.__day_text_selected,
                      day.key === 0 && styles.__day_text_sunday,
                    ]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.__schedule_container}>
            <View style={styles.__schedule_row}>
              <View style={styles.__schedule_item}>
                <Text style={styles.__label}>{t('signup.shiftStart') || 'Start'}</Text>
                <TouchableOpacity
                  style={styles.__time_button}
                  onPress={() => setShowStartTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.__time_text}>{formatTime(shiftStart)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.__schedule_item}>
                <Text style={styles.__label}>{t('signup.shiftEnd') || 'End'}</Text>
                <TouchableOpacity
                  style={styles.__time_button}
                  onPress={() => setShowEndTimePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.__time_text}>{formatTime(shiftEnd)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.__schedule_item_full}>
              <Text style={styles.__label}>{t('signup.slotLength') || 'Slot Length (minutes)'}</Text>
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
          </View>

          {showStartTimePicker && (
            <DateTimePicker
              value={shiftStart}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowStartTimePicker(Platform.OS === 'ios');
                if (selectedTime) setShiftStart(selectedTime);
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
                if (selectedTime) setShiftEnd(selectedTime);
              }}
            />
          )}
        </View>

        {/* Employees Section */}
        <View style={styles.__section}>
          <View style={styles.__section_header}>
            <Text style={styles.__section_title}>{t('settings.employees') || 'Employees'}</Text>
            {canAddEmployee && (
              <TouchableOpacity
                style={styles.__add_button}
                onPress={() => setShowAddEmployee(!showAddEmployee)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color="#FFD700" />
              </TouchableOpacity>
            )}
          </View>

          {showAddEmployee && (
            <View style={styles.__add_employee_container}>
              <TextInput
                style={styles.__employee_input}
                placeholder={t('settings.employeeName') || 'Employee Name'}
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={newEmployeeName}
                onChangeText={setNewEmployeeName}
              />
              <TouchableOpacity
                style={styles.__add_employee_button}
                onPress={handleAddEmployee}
                activeOpacity={0.7}
              >
                <Text style={styles.__add_employee_text}>{t('settings.add') || 'Add'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {employees.length === 0 ? (
            <Text style={styles.__empty_text}>{t('settings.noEmployees') || 'No employees yet'}</Text>
          ) : (
            employees.map((employee) => (
              <View key={employee.id} style={styles.__employee_item}>
                <Text style={styles.__employee_name}>{employee.name}</Text>
                <TouchableOpacity
                  style={styles.__remove_button}
                  onPress={() => handleRemoveEmployee(employee.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.__save_button, isSaving && styles.__save_button_disabled]}
          onPress={handleSaveSettings}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.__save_button_gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.__save_button_text}>
              {isSaving ? t('settings.saving') || 'Saving...' : t('settings.save') || 'Save Settings'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingTop: 12,
  },
  __title: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  __plan_info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  __plan_info_text: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255, 215, 0, 0.8)',
  },
  __section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  __section_header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  __section_title: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#FFD700',
    marginBottom: 12,
  },
  __input_container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  __input_icon: {
    marginRight: 8,
  },
  __input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  __label: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
    marginBottom: 6,
  },
  __logo_container: {
    marginBottom: 10,
    alignItems: 'center',
  },
  __logo_button: {
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
  },
  __working_days_container: {
    marginBottom: 10,
  },
  __days_row: {
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
  __day_text: {
    fontSize: 11,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255, 215, 0, 0.6)',
  },
  __day_text_selected: {
    color: '#FFD700',
  },
  __day_button_sunday: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  __day_text_sunday: {
    color: 'rgba(239, 68, 68, 0.8)',
  },
  __schedule_container: {
    marginBottom: 10,
  },
  __schedule_row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  __schedule_item: {
    flex: 1,
  },
  __schedule_item_full: {
    width: '100%',
  },
  __time_button: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  __time_text: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
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
  __add_button: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  __add_employee_container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  __employee_input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
  },
  __add_employee_button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
    justifyContent: 'center',
  },
  __add_employee_text: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  __employee_item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.1)',
  },
  __employee_name: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#FFFFFF',
    flex: 1,
  },
  __remove_button: {
    padding: 4,
  },
  __empty_text: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    paddingVertical: 12,
  },
  __save_button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  __save_button_disabled: {
    opacity: 0.6,
  },
  __save_button_gradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  __save_button_text: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#1a1a2e',
  },
});

export default BarberAdminTab3Screen;


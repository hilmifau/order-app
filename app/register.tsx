import { useTheme } from '@/hooks/use-theme';
import { clearError, registerAsync } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function RegisterScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Redirect to tabs when authenticated (auto-login after register)
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Colors based on theme
  const containerBg = isDark ? '#1a1a1a' : '#ffffff';
  const cardBg = isDark ? '#242424' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryText = isDark ? '#999' : '#666';
  const accentColor = isDark ? '#FFD700' : '#FF9800';
  const inputBg = isDark ? '#333' : '#ececec';
  const inputBorder = isDark ? '#444' : '#ddd';

  const handleRegister = async () => {
    // Validasi input
    if (!name.trim()) {
      Alert.alert('Validasi', 'Nama wajib diisi.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Validasi', 'Email wajib diisi.');
      return;
    }
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Validasi', 'Format email tidak valid.');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Validasi', 'Password wajib diisi.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validasi', 'Password minimal 6 karakter.');
      return;
    }
    if (password !== passwordConfirmation) {
      Alert.alert('Validasi', 'Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    try {
      await dispatch(
        registerAsync({
          name: name.trim(),
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
        })
      ).unwrap();

      Alert.alert('Berhasil', 'Registrasi berhasil!');
    } catch (err: any) {
      Alert.alert('Registrasi Gagal', typeof err === 'string' ? err : 'Terjadi kesalahan saat registrasi.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>Daftar Akun</Text>
              <Text style={[styles.subtitle, { color: secondaryText }]}>
                Buat akun baru untuk mulai memesan
              </Text>
            </View>

            {/* Register Card */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Nama Lengkap</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: textColor,
                    },
                  ]}
                  placeholder="Masukkan nama lengkap"
                  placeholderTextColor={secondaryText}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                  autoCapitalize="words"
                />
              </View>

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: textColor,
                    },
                  ]}
                  placeholder="Masukkan email"
                  placeholderTextColor={secondaryText}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Password</Text>
                <View style={[styles.passwordInputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        color: textColor,
                      },
                    ]}
                    placeholder="Masukkan password (min. 6 karakter)"
                    placeholderTextColor={secondaryText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.togglePasswordButton}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <Text style={[styles.togglePasswordIcon, { color: accentColor }]}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: textColor }]}>Konfirmasi Password</Text>
                <View style={[styles.passwordInputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                  <TextInput
                    style={[
                      styles.passwordInput,
                      {
                        color: textColor,
                      },
                    ]}
                    placeholder="Ulangi password"
                    placeholderTextColor={secondaryText}
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    secureTextEntry={!showPasswordConfirm}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.togglePasswordButton}
                    onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    disabled={loading}
                  >
                    <Text style={[styles.togglePasswordIcon, { color: accentColor }]}>
                      {showPasswordConfirm ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Error Message */}
              {error && (
                <View style={[styles.errorBox, { backgroundColor: isDark ? '#5c3333' : '#ffebee' }]}>
                  <Text style={[styles.errorText, { color: isDark ? '#ffb3b3' : '#c62828' }]}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Register Button */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  { backgroundColor: accentColor, opacity: loading ? 0.6 : 1 },
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={isDark ? '#000' : '#fff'} />
                ) : (
                  <Text
                    style={[
                      styles.registerButtonText,
                      { color: isDark ? '#000' : '#fff', fontWeight: '600' },
                    ]}
                  >
                    Daftar
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Back to Login */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: secondaryText }]}>
                Sudah punya akun?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                <Text style={[styles.footerLink, { color: accentColor }]}>Masuk di sini</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 0,
  },
  togglePasswordButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  togglePasswordIcon: {
    fontSize: 18,
  },
  errorBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  registerButton: {
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

import { useTheme } from '@/hooks/use-theme';
import { clearError, loginAsync } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

export default function LoginScreen() {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Redirect to tabs when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState<string | null>(null);

  // Colors based on theme
  const containerBg = isDark ? '#1a1a1a' : '#ffffff';
  const cardBg = isDark ? '#242424' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryText = isDark ? '#999' : '#666';
  const accentColor = isDark ? '#FFD700' : '#FF9800';
  const inputBg = isDark ? '#333' : '#ececec';
  const inputBorder = isDark ? '#444' : '#ddd';

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginStatus('Validasi gagal: Email dan Password wajib diisi.');
      Alert.alert('Validasi', 'Email dan Password wajib diisi.');
      return;
    }
    setLoginStatus('Mengirim login...');

    try {
      const result = await dispatch(
        loginAsync({ email: email.trim(), password })
      ).unwrap();
      setLoginStatus('Login berhasil.');
    } catch (err: any) {
      setLoginStatus('Login gagal.');
      Alert.alert('Login Gagal', typeof err === 'string' ? err : 'Login gagal. Silakan coba lagi.');
    }
  };

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/po_nari_pda_logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: textColor }]}>PO NARI PDA</Text>
            <Text style={[styles.subtitle, { color: secondaryText }]}>Selamat Datang</Text>
          </View>

          {/* Login Card */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
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
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[
                    styles.passwordInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: inputBorder,
                      color: textColor,
                    },
                  ]}
                  placeholder="Masukkan password"
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


            {/* Error Message */}
            {error && (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#5c3333' : '#ffebee' }]}>
                <Text style={[styles.errorText, { color: isDark ? '#ffb3b3' : '#c62828' }]}>
                  {error}
                </Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: accentColor, opacity: loading ? 0.6 : 1 },
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? '#000' : '#fff'} />
              ) : (
                <Text
                  style={[
                    styles.loginButtonText,
                    { color: isDark ? '#000' : '#fff', fontWeight: '600' },
                  ]}
                >
                  Masuk
                </Text>
              )}
            </TouchableOpacity>

            {loginStatus && (
              <View style={[styles.statusBox, { backgroundColor: isDark ? '#2f2f2f' : '#f7f7f7' }]}> 
                <Text style={[styles.statusText, { color: textColor }]}>{loginStatus}</Text>
              </View>
            )}

            {/* Info Login */}
            <View style={[styles.demoSection, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]}>
              <Text style={[styles.demoTitle, { color: textColor }]}>Info Login:</Text>
              <Text style={[styles.demoInfo, { color: secondaryText }]}>
                Masukkan email dan password yang telah didaftarkan.
              </Text>
            </View>
          </View>

          {/* Footer - Register Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: secondaryText }]}>
              Belum punya akun?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')} disabled={loading}>
              <Text style={[styles.footerLink, { color: accentColor }]}>Daftar Akun Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
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
  loginButton: {
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBox: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  demoSection: {
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  demoInfo: {
    fontSize: 12,
    lineHeight: 18,
  },
  demoBut: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  demoButText: {
    fontSize: 13,
    fontWeight: '500',
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

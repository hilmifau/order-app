import { useTheme } from '@/hooks/use-theme';
import { fetchCurrentUserAsync, logoutAsync, User } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// No more mock data

export default function ProfileScreen() {
  const { colorScheme, toggleTheme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const isDark = colorScheme === 'dark';
  const containerBg = isDark ? '#1a1a1a' : '#ffffff';
  const cardBg = isDark ? '#242424' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const borderColor = isDark ? '#333' : '#ddd';
  const accentColor = isDark ? '#FFD700' : '#FF9800';
  const dangerColor = isDark ? '#ff6b6b' : '#d32f2f';
  const [isFetching, setIsFetching] = useState(false);

  // Fetch user data if it's missing but we are supposedly authenticated
  useEffect(() => {
    if (!user && !isFetching && isAuthenticated) {
      setIsFetching(true);
      dispatch(fetchCurrentUserAsync())
        .unwrap()
        .then((data) => {
          console.log('--- Profil --- User data fetched successfully:', data);
        })
        .catch((err) => {
          console.warn('--- Profil --- Failed to fetch user data:', err);
        })
        .finally(() => setIsFetching(false));
    }
  }, [user, isFetching, isAuthenticated, dispatch]);

  // Use user data dari Redux jika available, otherwise use empty object with User type
  const displayProfile: Partial<User> = user || {};


  const handleLogout = async () => {
    console.log('handleLogout called!');

    // Use window.confirm for web, Alert.alert for native
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Apakah Anda yakin ingin keluar?')
      : await new Promise<boolean>((resolve) => {
        Alert.alert('Konfirmasi Logout', 'Apakah Anda yakin ingin keluar?', [
          { text: 'Batal', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Logout', onPress: () => resolve(true), style: 'destructive' },
        ]);
      });

    if (!confirmed) {
      console.log('Logout cancelled');
      return;
    }

    try {
      console.log('Logging out via API...');
      await dispatch(logoutAsync()).unwrap();
      console.log('Logout complete, redirecting...');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback redirect jika terjadi kesalahan serius
      router.replace('/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Profil Saya</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={[styles.profileHeaderCard, { backgroundColor: cardBg }]}>
          <View style={[styles.avatarContainer, { backgroundColor: isDark ? '#333' : '#e5e5e5' }]}>
            <Text style={styles.avatarText}>{displayProfile?.name?.charAt(0) || '👤'}</Text>
          </View>
          <View style={styles.profileHeaderInfo}>
            <Text style={[styles.profileName, { color: textColor }]}>{displayProfile?.name || 'User'}</Text>
            <Text style={[styles.storeName, { color: accentColor }]}>{displayProfile?.storeName || 'Toko Pelanggan'}</Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Informasi Akun</Text>
          <View style={[styles.infoList, { backgroundColor: cardBg }]}>
            {/* Kode Pelanggan */}
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <Text style={[styles.infoIcon]}>🆔</Text>
                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Kode Pelanggan</Text>
              </View>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile?.kd_cus || '-'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Alamat */}
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <Text style={[styles.infoIcon]}>📍</Text>
                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Alamat</Text>
              </View>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile?.address || 'Alamat belum diatur'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Telepon */}
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <Text style={[styles.infoIcon]}>📞</Text>
                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Telepon</Text>
              </View>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile?.phone || '-'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Email */}
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <Text style={[styles.infoIcon]}>✉️</Text>
                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Email</Text>
              </View>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile?.email}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            {/* Member Since */}
            <View style={styles.infoItem}>
              <View style={styles.infoLabelContainer}>
                <Text style={[styles.infoIcon]}>🗓️</Text>
                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Anggota Sejak</Text>
              </View>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile?.memberSince || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Aktivitas</Text>
          <View style={[styles.actionList, { backgroundColor: cardBg }]}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => router.push('/history')}
            >
              <View style={styles.actionInfo}>
                <Ionicons name="receipt-outline" size={20} color={accentColor} style={styles.actionIcon} />
                <Text style={[styles.actionLabel, { color: textColor }]}>Riwayat Pesanan</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={secondaryTextColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Pengaturan</Text>
          <View style={[styles.settingList, { backgroundColor: cardBg }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: textColor }]}>Mode Gelap</Text>
                <Text style={[styles.settingDesc, { color: secondaryTextColor }]}>
                  {isDark ? 'Tampilan gelap aktif' : 'Tampilan terang aktif'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#ccc', true: accentColor }}
                thumbColor={isDark ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Logout Section */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: isDark ? '#331111' : '#fff0f0', borderColor: dangerColor }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutBtnText, { color: dangerColor }]}>🚪 Keluar dari Akun</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: secondaryTextColor }]}>Order App v1.0.0</Text>
          <Text style={[styles.footerText, { color: secondaryTextColor }]}>© 2026 Hilmi Fauzi</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    marginTop: 10
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    margin: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  profileHeaderInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 1,
  },
  storeName: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    marginHorizontal: 14,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  infoList: {
    marginHorizontal: 10,
    borderRadius: 12,
    paddingVertical: 2,
  },
  infoItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    paddingLeft: 18,
  },
  divider: {
    height: 1,
    marginHorizontal: 14,
  },
  settingList: {
    marginHorizontal: 10,
    borderRadius: 12,
    padding: 14,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  logoutBtn: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 32,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionList: {
    marginHorizontal: 10,
    borderRadius: 12,
    paddingVertical: 2,
  },
  actionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 12,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 9,
    opacity: 0.5,
  },
});

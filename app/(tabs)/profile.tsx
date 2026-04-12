import { useTheme } from '@/hooks/use-theme';
import { removeAuthToken } from '@/services/storageService';
import { logout } from '@/store/authSlice';
import { AppDispatch, RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

interface ProfileData {
  name: string;
  storeName: string;
  kd_cus: string;
  address: string;
  phone: string;
  email: string;
  memberSince: string;
}

const DEFAULT_PROFILE: ProfileData = {
  name: 'John Doe',
  storeName: 'Toko Sentosa',
  kd_cus: '- ',
  address: 'Jl. Gatot Subroto No. 123, Jakarta Selatan',
  phone: '081234567890',
  email: 'john@tokosentosa.com',
  memberSince: 'Januari 2024',
};

export default function ProfileScreen() {
  const { colorScheme, toggleTheme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [profile] = useState<ProfileData>(DEFAULT_PROFILE);
  
  const isDark = colorScheme === 'dark';
  const containerBg = isDark ? '#1a1a1a' : '#ffffff';
  const cardBg = isDark ? '#242424' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const borderColor = isDark ? '#333' : '#ddd';
  const accentColor = isDark ? '#FFD700' : '#FF9800';
  const dangerColor = isDark ? '#ff6b6b' : '#d32f2f';

  // Use user data dari Redux jika available, otherwise use default
  const displayProfile = user || profile;

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
      console.log('Logging out...');
      await removeAuthToken();
      dispatch(logout());
      console.log('Logout complete, redirecting...');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Profil</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={[styles.profileName, { color: textColor }]}>{displayProfile.name}</Text>
          <Text style={[styles.storeName, { color: accentColor }]}>{displayProfile.storeName}</Text>
        </View>

        {/* Profile Details Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Informasi Toko</Text>
          
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Kode Pelanggan</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile.kd_cus || '-'}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Alamat</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile.address}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Telepon</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile.phone}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Email</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile.email}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Anggota Sejak</Text>
              <Text style={[styles.infoValue, { color: textColor }]}>{displayProfile.memberSince}</Text>
            </View>
          </View>
        </View>

        {/* Theme Toggle Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Pengaturan</Text>
          
          <View style={[styles.settingCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.settingRow}>
              <View>
                <Text style={[styles.settingLabel, { color: textColor }]}>Mode Gelap</Text>
                <Text style={[styles.settingDescription, { color: secondaryTextColor }]}>
                  {isDark ? 'Mode gelap aktif' : 'Mode terang aktif'}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#ccc', true: '#0066FF' }}
                thumbColor={isDark ? '#FFD700' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: dangerColor }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>🚪 Keluar (Logout)</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: secondaryTextColor }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.footerText, { color: secondaryTextColor }]}>
            © 2024 Toko Order App
          </Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  spacer: {
    width: 40,
  },
  profileCard: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
  },
  settingCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  logoutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    marginBottom: 4,
  },
});

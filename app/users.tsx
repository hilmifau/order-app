import { useTheme } from '@/hooks/use-theme';
import { listUsersApi, updateUserRoleSafe, ApiUser } from '@/services/usersApi';
import { RootState } from '@/store/store';
import { isAdmin, ROLE_ADMIN, ROLE_CUSTOMER, roleLabel, UserRole } from '@/utils/roles';
import { getFriendlyErrorMessage } from '@/utils/apiError';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function UsersScreen() {
  const { colorScheme } = useTheme();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const isDark = colorScheme === 'dark';
  const containerBg = isDark ? '#1a1a1a' : '#ffffff';
  const cardBg = isDark ? '#242424' : '#f5f5f5';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const borderColor = isDark ? '#333' : '#ddd';
  const accentColor = isDark ? '#FFD700' : '#FF9800';

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listUsersApi();
      setUsers(data);
    } catch (error) {
      Alert.alert(
        'Gagal Memuat Pengguna',
        getFriendlyErrorMessage(error, { fallback: 'Hanya admin yang dapat melihat daftar pengguna.' })
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isAdmin(user)) {
        router.replace('/(tabs)/profile');
        return;
      }
      loadUsers();
    }, [user, loadUsers, router])
  );

  const handleChangeRole = (item: ApiUser) => {
    if (String(item.id) === String(user?.id)) {
      Alert.alert('Tidak diizinkan', 'Ubah role akun sendiri lewat perintah server: php artisan user:set-role');
      return;
    }

    const nextRole: UserRole = item.role === ROLE_ADMIN ? ROLE_CUSTOMER : ROLE_ADMIN;
    Alert.alert(
      'Ubah Role',
      `Jadikan ${item.name || item.email} sebagai ${roleLabel(nextRole)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ubah',
          onPress: async () => {
            setUpdatingId(item.id);
            const result = await updateUserRoleSafe(item.id, nextRole);
            setUpdatingId(null);
            if (!result.success) {
              Alert.alert('Gagal', result.message || 'Gagal mengubah role.');
              return;
            }
            setUsers((prev) =>
              prev.map((row) => (String(row.id) === String(item.id) ? { ...row, role: nextRole } : row))
            );
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Kembali">
          <Ionicons name="chevron-back" size={24} color={accentColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Kelola Pengguna</Text>
        <TouchableOpacity onPress={loadUsers} style={styles.refreshBtn} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Ionicons name="refresh" size={22} color={accentColor} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <Text style={[styles.empty, { color: secondaryTextColor }]}>Belum ada pengguna.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: textColor }]}>{item.name || '-'}</Text>
                <Text style={[styles.email, { color: secondaryTextColor }]}>{item.email}</Text>
                {item.kd_cus ? (
                  <Text style={[styles.kd, { color: secondaryTextColor }]}>Kode: {item.kd_cus}</Text>
                ) : null}
              </View>
              <View style={[styles.roleBadge, item.role === ROLE_ADMIN ? styles.roleAdmin : styles.roleCustomer]}>
                <Text style={styles.roleBadgeText}>{roleLabel(item.role)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.changeBtn, { borderColor: accentColor }]}
              onPress={() => handleChangeRole(item)}
              disabled={updatingId === item.id}
            >
              {updatingId === item.id ? (
                <ActivityIndicator size="small" color={accentColor} />
              ) : (
                <Text style={[styles.changeBtnText, { color: accentColor }]}>
                  Ubah ke {roleLabel(item.role === ROLE_ADMIN ? ROLE_CUSTOMER : ROLE_ADMIN)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    height: 50,
  },
  backBtn: { position: 'absolute', left: 8, padding: 8, zIndex: 1 },
  refreshBtn: { position: 'absolute', right: 8, padding: 8, zIndex: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  list: { padding: 12, gap: 10 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  card: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  name: { fontSize: 15, fontWeight: '700' },
  email: { fontSize: 12, marginTop: 2 },
  kd: { fontSize: 11, marginTop: 2 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleAdmin: { backgroundColor: '#E3F2FD' },
  roleCustomer: { backgroundColor: '#E8F5E9' },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: '#333' },
  changeBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeBtnText: { fontSize: 12, fontWeight: '700' },
});

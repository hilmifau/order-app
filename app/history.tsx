import { Redirect } from 'expo-router';

/** Route lama `/history` (dari Profil) dialihkan ke tab bawah Riwayat. */
export default function HistoryRedirect() {
  return <Redirect href="/(tabs)/history" />;
}

import { useTheme } from '@/hooks/use-theme';
import {
  Gudang as ApiGudang,
  Barang,
  getBarangsWithPagination,
  getGudangs,
  normalizeBarangKetHarga,
} from '@/services/menuApi';
import { createOpname, getOpnameDetails, getOpnames, OpnameDetail, OpnameHeader } from '@/services/opnameApi';
import { getOpnameCart, saveOpnameCart } from '@/services/storageService';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addToOpnameCart,
  clearOpnameCart,
  loadOpnameCartFromStorage,
  OpnameCartItem,
  removeFromOpnameCart,
  updateOpnameQuantity,
} from '@/store/opnameCartSlice';
import { getFriendlyErrorMessage } from '@/utils/apiError';
import { formatDateDdMmYyyy, formatNowDdMmYyyy } from '@/utils/dateDisplay';
import { isAdmin } from '@/utils/roles';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PLACEHOLDER_IMAGE = require('@/assets/images/product_placeholder.jpg');
const ITEMS_PER_PAGE = 20;

type OpnameTab = 'barang' | 'draft' | 'riwayat';

function unitPrice(barang: Barang): number {
  const raw = barang as Barang & { hpp?: string | number };
  return (
    parseFloat(String(barang.h_anggota ?? '')) ||
    parseFloat(String(raw.hpp ?? barang.HPP ?? '')) ||
    0
  );
}

function getBarangIdentityKey(barang: Barang): string {
  const kdBr = (barang.kd_br || '').trim();
  const kd = (barang.kd || '').trim();
  const nama = (barang.nama || '').trim().toLowerCase();
  return [kdBr, kd, nama].join('|');
}

function dedupeBarangs(barangList: Barang[]): Barang[] {
  const seen = new Set<string>();
  const unique: Barang[] = [];
  for (const barang of barangList) {
    const identityKey = getBarangIdentityKey(barang);
    if (seen.has(identityKey)) continue;
    seen.add(identityKey);
    unique.push(barang);
  }
  return unique;
}

interface GudangRow {
  kd: string;
  name: string;
  count: number;
  colorIndex: number;
}

const OpnameItemRow = React.memo(function OpnameItemRow({
  item,
  isDark,
  cardBg,
  textColor,
  secondaryTextColor,
}: {
  item: OpnameCartItem;
  isDark: boolean;
  cardBg: string;
  textColor: string;
  secondaryTextColor: string;
}) {
  const dispatch = useAppDispatch();
  const price = unitPrice(item.barang);
  const itemTotal = price * item.quantity;
  const [inputValue, setInputValue] = useState(item.quantity.toString());
  const qtyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(item.quantity.toString());
  }, [item.quantity]);

  useEffect(() => {
    return () => {
      if (qtyTimerRef.current) clearTimeout(qtyTimerRef.current);
    };
  }, []);

  const handleUpdateQuantity = (quantity: number) => {
    if (quantity <= 0) {
      dispatch(removeFromOpnameCart(item.kd_br));
    } else {
      dispatch(updateOpnameQuantity({ kd_br: item.kd_br, quantity }));
    }
  };

  const handleQuantityChange = (text: string) => {
    setInputValue(text);
    const num = parseInt(text, 10);
    if (!isNaN(num) && num >= 0) {
      if (qtyTimerRef.current) clearTimeout(qtyTimerRef.current);
      qtyTimerRef.current = setTimeout(() => handleUpdateQuantity(num), 400);
    }
  };

  const handleBlur = () => {
    if (qtyTimerRef.current) clearTimeout(qtyTimerRef.current);
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < 0) {
      setInputValue('1');
      handleUpdateQuantity(1);
    } else if (num === 0) {
      dispatch(removeFromOpnameCart(item.kd_br));
    } else if (num !== item.quantity) {
      handleUpdateQuantity(num);
    }
  };

  return (
    <View style={[styles.cartItemCard, { backgroundColor: cardBg }]}>
      <View style={styles.cartItemTop}>
        <View style={[styles.iconContainer, { backgroundColor: isDark ? '#333' : '#e5e5e5' }]}>
          <Text style={styles.cartItemIcon}>📦</Text>
        </View>
        <View style={styles.cartItemInfo}>
          <Text style={[styles.cartItemName, { color: textColor }]} numberOfLines={2}>
            {item.barang.nama}
          </Text>
          <Text style={[styles.cartItemCode, { color: isDark ? '#FFD700' : '#FF9800' }]}>
            Kode: {item.barang.kd_br}
          </Text>
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#eee' }]} />
      <View style={styles.cartItemBottom}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: secondaryTextColor }]}>Harga Satuan</Text>
          <Text style={[styles.cartItemPrice, { color: textColor }]}>
            Rp {price.toLocaleString('id-ID')}
          </Text>
        </View>
        <View style={styles.controlsContainer}>
          <View style={[styles.quantityControl, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#444' : '#ddd' }]}>
            <TouchableOpacity style={styles.quantityButton} onPress={() => handleUpdateQuantity(item.quantity - 1)}>
              <Text style={[styles.quantityButtonText, { color: isDark ? '#FFD700' : '#FF9800' }]}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.quantityInput, { color: textColor }]}
              value={inputValue}
              onChangeText={handleQuantityChange}
              onBlur={handleBlur}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.quantityButton} onPress={() => handleUpdateQuantity(item.quantity + 1)}>
              <Text style={[styles.quantityButtonText, { color: isDark ? '#FFD700' : '#FF9800' }]}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.totalContainer}>
            <Text style={[styles.totalLabelSmall, { color: secondaryTextColor }]}>Subtotal</Text>
            <Text style={[styles.cartItemTotal, { color: textColor }]}>
              Rp {itemTotal.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

const OpnameBarangCard = React.memo(function OpnameBarangCard({
  barang,
  quantity,
  onAdd,
  theme,
}: {
  barang: Barang;
  quantity: number;
  onAdd: (barang: Barang) => void;
  theme: { isDark: boolean; cardBg: string; textColor: string };
}) {
  const price = unitPrice(barang);
  const ketRaw = (barang.ket || '').trim();
  const ketNorm = normalizeBarangKetHarga(barang.ket);
  const ketLabel = ketRaw.toUpperCase() || '-';
  let iconName: any = 'remove';
  let iconColor = '#AAAAAA';
  if (ketNorm === 'NAIK') {
    iconName = 'trending-up';
    iconColor = '#FF5252';
  } else if (ketNorm === 'TURUN') {
    iconName = 'trending-down';
    iconColor = '#4CAF50';
  } else if (ketNorm === 'SAMA') {
    iconName = 'arrow-forward';
    iconColor = theme.isDark ? '#FFFFFF' : '#888888';
  } else if (ketNorm === 'BARU') {
    iconName = 'sparkles';
    iconColor = theme.isDark ? '#FFD700' : '#E65100';
  }

  return (
    <View style={[styles.barangCard, { backgroundColor: theme.cardBg }]}>
      <View style={styles.barangCardImageContainer}>
        <Image
          source={barang.gambar ? { uri: barang.gambar } : PLACEHOLDER_IMAGE}
          style={styles.barangImage}
          contentFit="cover"
          cachePolicy="disk"
          recyclingKey={barang.kd_br}
        />
        {quantity > 0 && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityBadgeText}>{quantity}</Text>
          </View>
        )}
      </View>
      <View style={styles.barangCardContent}>
        <Text style={[styles.barangName, { color: theme.textColor }]}>{barang.nama}</Text>
        <View style={styles.ketContainer}>
          <Text style={[styles.barangKode, { color: theme.isDark ? '#FFD700' : '#FF9800' }]}>Harga: </Text>
          <View style={styles.ketWrapper}>
            <Ionicons name={iconName} size={14} color={iconColor} style={{ marginRight: 4 }} />
            <Text style={[styles.barangKode, { color: iconColor, fontWeight: 'bold' }]}>{ketLabel}</Text>
          </View>
        </View>
      </View>
      <View style={styles.barangCardContent}>
        <Text style={[styles.barangPrice, { color: theme.textColor }]}>Rp {price.toLocaleString('id-ID')}</Text>
        <Text style={[styles.barangSatuan, { color: theme.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }]}>
          {barang.satuan}
        </Text>
      </View>
      <TouchableOpacity style={[styles.addButton, quantity > 0 && styles.addButtonActive]} onPress={() => onAdd(barang)}>
        <Text style={styles.addButtonText}>{quantity > 0 ? 'Tambah Lagi' : 'Tambah'}</Text>
      </TouchableOpacity>
    </View>
  );
});

export default function OpnameScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { colorScheme } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const opnameItems = useAppSelector((state) => state.opnameCart.items);
  const reduxGudangs = useAppSelector((state) => state.inventory.gudangs);

  const admin = isAdmin(user);
  const isDark = colorScheme === 'dark';
  const containerBg = isDark ? '#1a1a1a' : '#ffffff';
  const headerBg = isDark ? '#242424' : '#f5f5f5';
  const cardBg = isDark ? '#242424' : '#f5f5f5';
  const headerBorder = isDark ? '#333' : '#ddd';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#aaa' : '#666';
  const accentColor = isDark ? '#FFD700' : '#FF9800';

  const [tab, setTab] = useState<OpnameTab>('barang');
  const [gudangs, setGudangs] = useState<GudangRow[]>([]);
  const [selectedGudang, setSelectedGudang] = useState<string | null>(null);
  const [displayedBarangs, setDisplayedBarangs] = useState<Barang[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingBarang, setLoadingBarang] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showGudangModal, setShowGudangModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);
  const [qtyInput, setQtyInput] = useState('1');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [noBuku, setNoBuku] = useState('');
  const [penulis, setPenulis] = useState('');
  const [penghitung, setPenghitung] = useState('');
  const [pengawas, setPengawas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [opnames, setOpnames] = useState<OpnameHeader[]>([]);
  const [isLoadingOpnames, setIsLoadingOpnames] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOpname, setSelectedOpname] = useState<OpnameHeader | null>(null);
  const [opnameDetails, setOpnameDetails] = useState<OpnameDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const isTablet = screenDimensions.width >= 768;
  const gudangColumns = isTablet ? 3 : 2;
  const barangColumns = isTablet ? 3 : 2;

  const loadMoreGuardRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!admin) {
      router.replace('/(tabs)');
    }
  }, [admin, router]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;
    getOpnameCart().then((items) => {
      if (cancelled) return;
      if (Array.isArray(items) && items.length > 0) {
        dispatch(loadOpnameCartFromStorage(items));
      }
      hydratedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    saveOpnameCart(opnameItems);
  }, [opnameItems]);

  const processGudangs = (gudangList: ApiGudang[]) => {
    setGudangs(
      gudangList
        .map((item, index) => ({
          kd: item.kd,
          name: item.nama || item.kd || 'Undefined',
          count: Number(item.barang_count ?? 0),
          colorIndex: index,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const fetchBarangs = async (
    page: number = 1,
    searchQuery: string = search,
    gudangFilter: string | null = selectedGudang
  ) => {
    try {
      if (page === 1) setLoadingBarang(true);
      else setLoadingMore(true);

      const result = await getBarangsWithPagination(page, ITEMS_PER_PAGE, searchQuery, gudangFilter || undefined);
      const uniqueIncoming = dedupeBarangs(result.data);

      if (page === 1) {
        setDisplayedBarangs(uniqueIncoming);
        setTotalItems(result.total);
        setTotalPages(result.totalPages);
      } else {
        setDisplayedBarangs((prev) => dedupeBarangs([...prev, ...uniqueIncoming]));
        if (result.total > 0) setTotalItems(result.total);
        setTotalPages((prev) => (uniqueIncoming.length < ITEMS_PER_PAGE ? page : Math.max(prev, result.totalPages)));
      }
      setCurrentPage(page);
    } catch (error) {
      console.error('Opname fetch barang:', error);
      Alert.alert('Gagal Memuat', getFriendlyErrorMessage(error, { fallback: 'Gagal memuat daftar barang.' }));
    } finally {
      setLoadingBarang(false);
      setLoadingMore(false);
    }
  };

  const loadInitial = async () => {
    try {
      const gudangList = reduxGudangs.length > 0 ? reduxGudangs : await getGudangs();
      processGudangs(gudangList);
      await fetchBarangs(1, '', null);
    } catch (error) {
      console.error('Opname load initial:', error);
    }
  };

  useEffect(() => {
    if (admin) loadInitial();
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [admin]);

  const loadOpnameHistory = useCallback(async () => {
    try {
      setIsLoadingOpnames(true);
      const data = await getOpnames();
      setOpnames(data);
    } catch (error) {
      console.error('Failed to load opnames:', error);
      Alert.alert('Gagal Memuat', getFriendlyErrorMessage(error, { fallback: 'Gagal memuat daftar stok opname.' }));
    } finally {
      setIsLoadingOpnames(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (admin && tab === 'riwayat') {
        loadOpnameHistory();
      }
    }, [admin, tab, loadOpnameHistory])
  );

  const handleSearch = (query: string) => {
    setSearch(query);
    setCurrentPage(1);
    loadMoreGuardRef.current = false;
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchBarangs(1, query, selectedGudang), 400);
  };

  const handleLoadMore = () => {
    if (loadingMore || loadMoreGuardRef.current || currentPage >= totalPages) return;
    loadMoreGuardRef.current = true;
    fetchBarangs(currentPage + 1, search, selectedGudang).finally(() => {
      loadMoreGuardRef.current = false;
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSelectedGudang(null);
    setSearch('');
    await loadInitial();
    setRefreshing(false);
  };

  const handleGudangSelect = (kd: string) => {
    const newGudang = !kd ? null : selectedGudang === kd ? null : kd;
    setSelectedGudang(newGudang);
    setCurrentPage(1);
    setShowGudangModal(false);
    fetchBarangs(1, search, newGudang);
  };

  const qtyByKd = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of opnameItems) map.set(item.kd_br, item.quantity);
    return map;
  }, [opnameItems]);

  const gudangModalData = useMemo(
    () => [
      { kd: 'all', name: 'Semua Gudang', count: gudangs.reduce((sum, g) => sum + g.count, 0), colorIndex: -1 },
      ...gudangs,
    ],
    [gudangs]
  );

  const grandTotal = useMemo(
    () => opnameItems.reduce((sum, item) => sum + unitPrice(item.barang) * item.quantity, 0),
    [opnameItems]
  );

  const cardTheme = useMemo(() => ({ isDark, cardBg, textColor }), [isDark, cardBg, textColor]);

  const getGudangColor = (colorIndex: number, isAll = false) => {
    if (isAll) return '#555';
    const colors = ['#C85A54', '#7C4DFF', '#D946EF', '#B8860B', '#1E3A8A', '#16A34A', '#DC2626', '#9333EA'];
    return colors[colorIndex % colors.length];
  };

  const openAddModal = useCallback((barang: Barang) => {
    setSelectedBarang(barang);
    setQtyInput('1');
    setShowQtyModal(true);
  }, []);

  const confirmAdd = () => {
    if (!selectedBarang) return;
    const qty = parseInt(qtyInput, 10);
    if (!Number.isFinite(qty) || qty <= 0) return;
    dispatch(addToOpnameCart({ barang: selectedBarang, quantity: qty }));
    setShowQtyModal(false);
    setSelectedBarang(null);
    setQtyInput('1');
  };

  const handleClearDraft = async () => {
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('Semua barang di draft opname akan dihapus. Lanjutkan?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert('Kosongkan Draft', 'Semua barang di draft opname akan dihapus. Lanjutkan?', [
              { text: 'Batal', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Kosongkan', onPress: () => resolve(true), style: 'destructive' },
            ]);
          });
    if (!confirmed) return;
    dispatch(clearOpnameCart());
  };

  const openSaveModal = () => {
    if (opnameItems.length === 0) {
      Alert.alert('Draft Kosong', 'Silakan tambahkan barang terlebih dahulu.');
      return;
    }
    setPenulis((prev) => prev || user?.name || user?.username || '');
    setShowSaveModal(true);
  };

  const handleSave = async () => {
    const buku = noBuku.trim();
    const penulisVal = penulis.trim();
    const penghitungVal = penghitung.trim();
    const pengawasVal = pengawas.trim();

    if (!buku || !penulisVal || !penghitungVal || !pengawasVal) {
      Alert.alert('Form Belum Lengkap', 'Isi no_buku, penulis, penghitung, dan pengawas.');
      return;
    }

    const invalid = opnameItems.filter((item) => {
      const qty = Number(item.quantity);
      return !item.kd_br || !item.barang?.nama || !Number.isFinite(qty) || qty < 1;
    });
    if (invalid.length > 0) {
      Alert.alert('Ada Barang Tidak Valid', 'Periksa draft lalu coba lagi.');
      return;
    }

    const confirmed =
      Platform.OS === 'web'
        ? window.confirm(`Simpan opname ${buku}?\n${opnameItems.length} jenis barang\nTotal Rp ${Math.round(grandTotal).toLocaleString('id-ID')}`)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Konfirmasi Simpan',
              `No. buku: ${buku}\n${opnameItems.length} jenis barang\nTotal: Rp ${Math.round(grandTotal).toLocaleString('id-ID')}\nStatus: BELUM GABUNG\n\nLanjutkan?`,
              [
                { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Simpan', onPress: () => resolve(true) },
              ]
            );
          });
    if (!confirmed) return;

    setIsSubmitting(true);
    try {
      await createOpname({
        no_buku: buku,
        penulis: penulisVal,
        penghitung: penghitungVal,
        pengawas: pengawasVal,
        items: opnameItems.map((item) => ({
          kd_br: item.barang.kd_br,
          qty: item.quantity,
          nilai: unitPrice(item.barang),
          nama: item.barang.nama,
          satuan: item.barang.satuan,
        })),
      });

      dispatch(clearOpnameCart());
      setShowSaveModal(false);
      setNoBuku('');
      setPenghitung('');
      setPengawas('');
      setTab('riwayat');
      await loadOpnameHistory();
      Alert.alert('Berhasil', `Stok opname ${buku} tersimpan.\nTotal: Rp ${Math.round(grandTotal).toLocaleString('id-ID')}`);
    } catch (error) {
      Alert.alert(
        'Gagal Menyimpan',
        getFriendlyErrorMessage(error, { fallback: 'Gagal menyimpan stok opname. Periksa nomor buku dan coba lagi.' })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowDetail = async (item: OpnameHeader) => {
    setSelectedOpname(item);
    setShowDetailModal(true);
    setIsLoadingDetails(true);
    setOpnameDetails([]);
    try {
      const result = await getOpnameDetails(item.no_buku);
      setOpnameDetails(result.details);
      if (result.header) setSelectedOpname(result.header);
    } catch (error) {
      Alert.alert('Gagal Memuat Detail', getFriendlyErrorMessage(error, { fallback: 'Gagal memuat detail opname.' }));
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!admin) {
    return (
      <View style={[styles.container, { backgroundColor: containerBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={accentColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Stok Opname</Text>
      </View>

      <View style={[styles.segmentRow, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        {([
          { id: 'barang', label: 'Barang' },
          { id: 'draft', label: `Draft${opnameItems.length ? ` (${opnameItems.length})` : ''}` },
          { id: 'riwayat', label: 'Riwayat' },
        ] as { id: OpnameTab; label: string }[]).map((seg) => {
          const active = tab === seg.id;
          return (
            <TouchableOpacity
              key={seg.id}
              style={[styles.segmentBtn, active && { backgroundColor: accentColor }]}
              onPress={() => {
                setTab(seg.id);
                if (seg.id === 'riwayat') loadOpnameHistory();
              }}
            >
              <Text style={[styles.segmentText, { color: active ? '#fff' : textColor }]}>{seg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'barang' && (
        <>
          <View style={[styles.searchContainer, { borderBottomColor: headerBorder }]}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: textColor,
                  backgroundColor: isDark ? '#333' : '#e5e5e5',
                  borderColor: isDark ? '#444' : '#ccc',
                },
              ]}
              placeholder="Cari nama/kode barang..."
              placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
              value={search}
              onChangeText={handleSearch}
            />
          </View>
          <View style={styles.sectionTitleContainer}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Daftar Barang ({displayedBarangs.length}
              {totalItems > displayedBarangs.length ? ` dari ${totalItems}` : ''})
            </Text>
          </View>
          {loadingBarang && displayedBarangs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={accentColor} />
              <Text style={[styles.emptyText, { color: secondaryTextColor, marginTop: 12 }]}>Memuat barang...</Text>
            </View>
          ) : displayedBarangs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: secondaryTextColor }]}>Tidak ada barang ditemukan</Text>
            </View>
          ) : (
            <FlatList
              key={`opname-barang-${barangColumns}`}
              data={displayedBarangs}
              renderItem={({ item }) => (
                <OpnameBarangCard
                  barang={item}
                  quantity={qtyByKd.get(item.kd_br) || 0}
                  onAdd={openAddModal}
                  theme={cardTheme}
                />
              )}
              keyExtractor={(item, index) => `${getBarangIdentityKey(item)}-${index}`}
              numColumns={barangColumns}
              columnWrapperStyle={styles.barangRow}
              contentContainerStyle={{ paddingBottom: 8 }}
              initialNumToRender={barangColumns * 3}
              windowSize={5}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFD700']} tintColor="#FFD700" />
              }
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={accentColor} />
                  </View>
                ) : null
              }
            />
          )}
          <TouchableOpacity
            style={[styles.gudangSelectorButton, { backgroundColor: isDark ? '#333' : '#ddd', borderBottomColor: headerBorder }]}
            onPress={() => setShowGudangModal(true)}
          >
            <View style={styles.gudangSelectorContent}>
              <Text style={[styles.gudangSelectorLabel, { color: secondaryTextColor }]}>Pilih Gudang</Text>
              <Text style={[styles.gudangSelectorValue, { color: textColor }]}>
                {selectedGudang ? gudangs.find((g) => g.kd === selectedGudang)?.name || selectedGudang : 'Semua Gudang'}
              </Text>
            </View>
            <Text style={[styles.gudangSelectorArrow, { color: accentColor }]}>▶</Text>
          </TouchableOpacity>
        </>
      )}

      {tab === 'draft' &&
        (opnameItems.length > 0 ? (
          <>
            <FlatList
              data={opnameItems}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <OpnameItemRow
                  item={item}
                  isDark={isDark}
                  cardBg={cardBg}
                  textColor={textColor}
                  secondaryTextColor={secondaryTextColor}
                />
              )}
              keyExtractor={(item) => item.kd_br}
              contentContainerStyle={styles.cartItemsSection}
            />
            <View style={[styles.summarySection, { backgroundColor: cardBg, borderTopColor: isDark ? '#333' : '#ddd' }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: textColor }]}>Total ({opnameItems.length} jenis)</Text>
                <Text style={[styles.totalValue, { color: accentColor }]}>
                  Rp {Math.round(grandTotal).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.clearButton} onPress={handleClearDraft} disabled={isSubmitting}>
                  <Text style={styles.clearButtonText}>Kosongkan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, isSubmitting && { opacity: 0.7 }]}
                  onPress={openSaveModal}
                  disabled={isSubmitting}
                >
                  <Text style={styles.saveButtonText}>{isSubmitting ? '⏳ Menyimpan...' : '💾 Save'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={[styles.emptyText, { color: textColor }]}>Draft opname kosong</Text>
            <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>Tambah barang dari tab Barang</Text>
          </View>
        ))}

      {tab === 'riwayat' &&
        (isLoadingOpnames && opnames.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[styles.emptyText, { color: secondaryTextColor, marginTop: 12 }]}>Memuat riwayat...</Text>
          </View>
        ) : (
          <FlatList
            data={opnames}
            keyExtractor={(item, index) => `${item.no_buku || 'x'}-${index}`}
            contentContainerStyle={[styles.historyList, opnames.length === 0 && { flexGrow: 1 }]}
            refreshing={isLoadingOpnames}
            onRefresh={loadOpnameHistory}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="documents-outline" size={72} color={secondaryTextColor} />
                <Text style={[styles.emptyText, { color: textColor, marginTop: 12 }]}>Belum ada stok opname</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={[styles.historyCard, { backgroundColor: cardBg, borderColor: headerBorder }]}>
                <View style={styles.historyHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.historyNoTran, { color: textColor }]}>No. Buku: {item.no_buku}</Text>
                    <Text style={[styles.historyDate, { color: secondaryTextColor }]}>
                      Tanggal: {item.tgl_opname ? formatDateDdMmYyyy(item.tgl_opname) : '-'}
                    </Text>
                    <Text style={[styles.historyDate, { color: secondaryTextColor }]}>Penulis: {item.penulis || item.Penulis || '-'}</Text>
                    <Text style={[styles.historyDate, { color: secondaryTextColor }]}>Penghitung: {item.penghitung || item.Penghitung || '-'}</Text>
                    <Text style={[styles.historyDate, { color: secondaryTextColor }]}>Pengawas: {item.pengawas || item.Pengawas || '-'}</Text>
                  </View>
                  <View style={styles.historyStatusBadge}>
                    <Text style={styles.historyStatusText}>{item.status || 'BELUM GABUNG'}</Text>
                  </View>
                </View>
                <View style={[styles.cardDivider, { backgroundColor: headerBorder }]} />
                <View style={styles.historyFooter}>
                  <View>
                    <Text style={[styles.historyTotalLabel, { color: secondaryTextColor }]}>Grand Total</Text>
                    <Text style={[styles.historyTotalAmount, { color: textColor }]}>
                      Rp {Number(item.total ?? item.Total ?? 0).toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.detailBtn, { backgroundColor: isDark ? '#333' : '#eee', borderColor: headerBorder }]}
                    onPress={() => handleShowDetail(item)}
                  >
                    <Ionicons name="eye" size={16} color={accentColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.detailBtnText, { color: textColor }]}>Detail</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListFooterComponent={<View style={{ height: 24 }} />}
          />
        ))}

      <Modal visible={showGudangModal} animationType="slide" transparent onRequestClose={() => setShowGudangModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: containerBg }]}>
            <View style={[styles.modalHeader, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Pilih Gudang</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowGudangModal(false)}>
                <Text style={[styles.modalCloseText, { color: accentColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              key={`gudang-modal-${gudangColumns}`}
              data={gudangModalData}
              numColumns={gudangColumns}
              columnWrapperStyle={styles.gudangModalRow}
              contentContainerStyle={styles.gudangModalList}
              keyExtractor={(item) => item.kd}
              renderItem={({ item }) => {
                const isAll = item.kd === 'all';
                const isSelected = isAll ? !selectedGudang : selectedGudang === item.kd;
                return (
                  <TouchableOpacity
                    style={[
                      styles.gudangModalCard,
                      { backgroundColor: getGudangColor(item.colorIndex, isAll) },
                      isSelected && styles.gudangModalCardSelected,
                    ]}
                    onPress={() => handleGudangSelect(isAll ? '' : item.kd)}
                  >
                    <Text style={styles.gudangModalCardName}>{item.name}</Text>
                    <Text style={styles.gudangModalCardCount}>{item.count} items</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showQtyModal} animationType="slide" transparent onRequestClose={() => setShowQtyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.qtyModalContainer, { backgroundColor: containerBg, borderTopColor: headerBorder }]}>
            <View style={[styles.qtyModalHeader, { borderBottomColor: headerBorder }]}>
              <Text style={[styles.qtyModalTitle, { color: textColor }]}>Jumlah Stok</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowQtyModal(false)}>
                <Text style={[styles.modalCloseText, { color: accentColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.qtyModalBarangName, { color: textColor }]} numberOfLines={2}>
              {selectedBarang?.nama || '-'}
            </Text>
            <View style={styles.qtyInputRow}>
              <TouchableOpacity
                style={[styles.qtyAdjustButton, { backgroundColor: isDark ? '#2d2d2d' : '#ececec' }]}
                onPress={() => setQtyInput(String(Math.max(1, (parseInt(qtyInput, 10) || 1) - 1)))}
              >
                <Text style={[styles.qtyAdjustButtonText, { color: textColor }]}>-</Text>
              </TouchableOpacity>
              <TextInput
                value={qtyInput}
                onChangeText={(v) => setQtyInput(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                style={[
                  styles.qtyInput,
                  { color: textColor, backgroundColor: isDark ? '#333' : '#f2f2f2', borderColor: isDark ? '#444' : '#ccc' },
                ]}
                selectTextOnFocus
              />
              <TouchableOpacity
                style={[styles.qtyAdjustButton, { backgroundColor: isDark ? '#2d2d2d' : '#ececec' }]}
                onPress={() => setQtyInput(String(Math.max(1, (parseInt(qtyInput, 10) || 1) + 1)))}
              >
                <Text style={[styles.qtyAdjustButtonText, { color: textColor }]}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.qtyConfirmButton} onPress={confirmAdd}>
              <Text style={styles.qtyConfirmButtonText}>Tambah ke Draft</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSaveModal} animationType="slide" transparent onRequestClose={() => !isSubmitting && setShowSaveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.saveModalContainer, { backgroundColor: containerBg, borderTopColor: headerBorder }]}>
            <View style={[styles.qtyModalHeader, { borderBottomColor: headerBorder }]}>
              <Text style={[styles.qtyModalTitle, { color: textColor }]}>Data Opname</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => !isSubmitting && setShowSaveModal(false)}>
                <Text style={[styles.modalCloseText, { color: accentColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={[styles.formHint, { color: secondaryTextColor }]}>
                Status otomatis BELUM GABUNG. Total: Rp {Math.round(grandTotal).toLocaleString('id-ID')}
              </Text>
              {[
                { label: 'No. Buku', value: noBuku, setter: setNoBuku, placeholder: 'no_buku' },
                { label: 'Penulis', value: penulis, setter: setPenulis, placeholder: 'Nama penulis' },
                { label: 'Penghitung', value: penghitung, setter: setPenghitung, placeholder: 'Nama penghitung' },
                { label: 'Pengawas', value: pengawas, setter: setPengawas, placeholder: 'Nama pengawas' },
              ].map((field) => (
                <View key={field.label} style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: secondaryTextColor }]}>{field.label}</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      { color: textColor, backgroundColor: isDark ? '#333' : '#f2f2f2', borderColor: isDark ? '#444' : '#ccc' },
                    ]}
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder={field.placeholder}
                    placeholderTextColor={secondaryTextColor}
                    editable={!isSubmitting}
                  />
                </View>
              ))}
              <TouchableOpacity
                style={[styles.qtyConfirmButton, { marginTop: 8 }, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={isSubmitting}
              >
                <Text style={styles.qtyConfirmButtonText}>{isSubmitting ? 'Menyimpan...' : 'Save'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showDetailModal} animationType="slide" transparent onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.detailModalContent, { backgroundColor: containerBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: headerBorder }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Detail Opname</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={22} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>
            {isLoadingDetails ? (
              <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color={accentColor} />
              </View>
            ) : (
              <FlatList
                data={opnameDetails}
                keyExtractor={(item, idx) => `${item.kd_br || 'd'}-${idx}`}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                ListHeaderComponent={
                  selectedOpname ? (
                    <View style={[styles.modalOrderInfo, { backgroundColor: cardBg }]}>
                      <Text style={[styles.historyNoTran, { color: textColor }]}>No. Buku: {selectedOpname.no_buku}</Text>
                      <Text style={[styles.historyDate, { color: secondaryTextColor }]}>
                        Tanggal: {selectedOpname.tgl_opname ? formatDateDdMmYyyy(selectedOpname.tgl_opname) : formatNowDdMmYyyy()}
                      </Text>
                      <Text style={[styles.historyDate, { color: secondaryTextColor }]}>Penulis: {selectedOpname.penulis || selectedOpname.Penulis || '-'}</Text>
                      <Text style={[styles.historyDate, { color: secondaryTextColor }]}>Penghitung: {selectedOpname.penghitung || selectedOpname.Penghitung || '-'}</Text>
                      <Text style={[styles.historyDate, { color: secondaryTextColor }]}>Pengawas: {selectedOpname.pengawas || selectedOpname.Pengawas || '-'}</Text>
                      <Text style={[styles.historyDate, { color: secondaryTextColor }]}>
                        Status: {selectedOpname.status || 'BELUM GABUNG'}
                      </Text>
                    </View>
                  ) : null
                }
                renderItem={({ item, index }) => (
                  <View style={[styles.tableRow, { borderBottomColor: headerBorder }]}>
                    <Text style={[styles.tdNo, { color: secondaryTextColor }]}>{index + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tdNama, { color: textColor }]} numberOfLines={2}>
                        {item.nama_br || item.barang?.nama || item.kd_br}
                      </Text>
                      <Text style={[styles.historyDate, { color: secondaryTextColor }]}>
                        {item.qty} {item.satuan || item.barang?.satuan || ''}
                      </Text>
                    </View>
                    <Text style={[styles.tdNum, { color: textColor }]}>
                      Rp {Number(item.subtotal || 0).toLocaleString('id-ID')}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: secondaryTextColor }]}>Tidak ada detail barang.</Text>
                }
                ListFooterComponent={
                  <Text style={[styles.totalValue, { color: accentColor, marginTop: 16, textAlign: 'right' }]}>
                    Total Rp {Number(
                      (selectedOpname?.total ?? selectedOpname?.Total) ||
                      opnameDetails.reduce((sum, d) => sum + Number(d.subtotal || 0), 0)
                    ).toLocaleString('id-ID')}
                  </Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    height: 40,
  },
  headerTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(128,128,128,0.15)',
  },
  segmentText: { fontSize: 12, fontWeight: '700' },
  searchContainer: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  searchInput: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1 },
  sectionTitleContainer: { paddingHorizontal: 16, paddingVertical: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  barangRow: { justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 6 },
  barangCard: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 6,
    minHeight: 260,
    overflow: 'hidden',
  },
  barangCardImageContainer: { width: '100%', height: 100, backgroundColor: '#333', position: 'relative' },
  barangImage: { width: '100%', height: '100%' },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  quantityBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  barangCardContent: { paddingHorizontal: 10, paddingTop: 8 },
  barangName: { fontSize: 13, fontWeight: '600', marginBottom: 3, lineHeight: 18 },
  barangKode: { fontSize: 11 },
  ketContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  ketWrapper: { flexDirection: 'row', alignItems: 'center' },
  barangPrice: { fontSize: 14, fontWeight: '700' },
  barangSatuan: { fontSize: 11, marginTop: 2 },
  addButton: {
    margin: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonActive: { backgroundColor: '#388E3C' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  gudangSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  gudangSelectorContent: { flex: 1 },
  gudangSelectorLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  gudangSelectorValue: { fontSize: 14, fontWeight: '600' },
  gudangSelectorArrow: { fontSize: 14, marginLeft: 8 },
  cartItemsSection: { padding: 12 },
  cartItemCard: { borderRadius: 10, padding: 12, marginBottom: 10 },
  cartItemTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  cartItemIcon: { fontSize: 18 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 2 },
  cartItemCode: { fontSize: 11, fontWeight: '500' },
  divider: { height: 1, width: '100%', marginBottom: 12 },
  cartItemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  cartItemPrice: { fontSize: 12, fontWeight: '600' },
  controlsContainer: { alignItems: 'flex-end', gap: 8 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 15, paddingHorizontal: 4, height: 30 },
  quantityButton: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  quantityButtonText: { fontSize: 16, fontWeight: 'bold' },
  quantityInput: { fontSize: 13, fontWeight: '700', minWidth: 24, textAlign: 'center', padding: 0, marginHorizontal: 4 },
  totalContainer: { alignItems: 'flex-end' },
  totalLabelSmall: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  cartItemTotal: { fontSize: 14, fontWeight: '800' },
  summarySection: { padding: 12, borderTopWidth: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 16, fontWeight: '800' },
  actionButtons: { flexDirection: 'row', gap: 10 },
  clearButton: { flex: 1, backgroundColor: '#9e9e9e', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  clearButtonText: { color: '#fff', fontWeight: '700' },
  saveButton: { flex: 2, backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySubText: { fontSize: 13, marginTop: 6, textAlign: 'center' },
  footerLoader: { paddingVertical: 16, alignItems: 'center' },
  historyList: { padding: 12 },
  historyCard: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  historyHeader: { flexDirection: 'row' },
  historyNoTran: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  historyDate: { fontSize: 12, marginBottom: 2 },
  historyStatusBadge: { backgroundColor: '#E65100', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  historyStatusText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  cardDivider: { height: 1, marginVertical: 10 },
  historyFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyTotalLabel: { fontSize: 11 },
  historyTotalAmount: { fontSize: 16, fontWeight: '800' },
  detailBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  detailBtnText: { fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(128,128,128,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalCloseText: { fontSize: 18, fontWeight: '600' },
  gudangModalList: { padding: 12, paddingBottom: 40 },
  gudangModalRow: { justifyContent: 'space-between', marginBottom: 12 },
  gudangModalCard: { flex: 1, borderRadius: 14, padding: 18, marginHorizontal: 6, alignItems: 'center', minHeight: 90, borderWidth: 2, borderColor: 'transparent' },
  gudangModalCardSelected: { borderColor: '#FFD700', borderWidth: 3 },
  gudangModalCardName: { color: '#fff', fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  gudangModalCardCount: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  qtyModalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, borderTopWidth: 1 },
  saveModalContainer: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, borderTopWidth: 1, maxHeight: '88%' },
  qtyModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 12 },
  qtyModalTitle: { fontSize: 18, fontWeight: '700' },
  qtyModalBarangName: { marginTop: 14, marginBottom: 16, fontSize: 14, fontWeight: '600' },
  qtyInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qtyAdjustButton: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  qtyAdjustButtonText: { fontSize: 22, fontWeight: '700' },
  qtyInput: { flex: 1, marginHorizontal: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  qtyConfirmButton: { backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  qtyConfirmButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  formHint: { fontSize: 12, marginTop: 12, marginBottom: 8 },
  formGroup: { marginBottom: 12 },
  formLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  formInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  detailModalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%', minHeight: '50%' },
  modalOrderInfo: { borderRadius: 10, padding: 12, marginBottom: 12 },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, gap: 8 },
  tdNo: { width: 22, fontSize: 12 },
  tdNama: { fontSize: 13, fontWeight: '600' },
  tdNum: { fontSize: 12, fontWeight: '700', minWidth: 80, textAlign: 'right' },
});

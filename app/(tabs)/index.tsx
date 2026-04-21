import { useTheme } from '@/hooks/use-theme';
import {
  Gudang as ApiGudang,
  Barang,
  getBarangsWithPagination,
  getGudangs,
  normalizeBarangKetHarga,
} from '@/services/menuApi';
import { addToCart } from '@/store/cartSlice';
import { toggleFavorite } from '@/store/favoriteSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addMoreBarangs, setBarangs as setBarangsAction, setError, setGudangs as setGudangsAction, setInitialized, setLoading } from '@/store/inventorySlice';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PLACEHOLDER_IMAGE = require('@/assets/images/product_placeholder.jpg');

// Data default sebagai fallback jika API gagal
const DEFAULT_GUDANGS: ApiGudang[] = [
  { kd: 'B 2', nama: 'G.LANTAI 2', dept: 'GUDANG', counter: 'B 2' },
  { kd: 'C 3', nama: 'G.DASAR', dept: 'GUDANG', counter: 'C 3' },
  { kd: 'D 4', nama: 'HADIAH', dept: 'GUDANG', counter: 'D 4' },
  { kd: 'E 5', nama: 'ATK', dept: 'GUDANG', counter: 'E 5' },
];

const DEFAULT_BARANGS: Barang[] = [
  {
    kd_br: '-',
    nama: 'GERY CHOCOLATOS CHEESE 2000 WJU5 @60 BKS',
    kd: 'B 2       ',
    kd_sp: 'SNS/GARUDA',
    jenis_produk: 'Barang',
    satuan: 'DUS',
    status: 'Tidak Digunakan               ',
    HPP: '93984',
    h_anggota: '97500.00',
    h_to: '97500',
    h_boman: '0',
    h_royan: '0',
    h_cabang: '93000',
    h_non: '97500',
    markup: '0.0',
    s_awal: '0',
    j_beli: '0',
    j_jual: '0',
    r_beli: '0',
    r_jual: '0',
    d_min: '0',
    d_pls: '0',
    stok_akhir: '0',
    minim_stok: '5',
    hpp_beli: '93984',
    tgl_beli: '2022-10-18 00:00:00',
    tgl_jual: '2022-11-21 00:00:00',
    kd_hd: null,
    qty_hd: null,
    qty_br: null,
    status_hadiah: null,
    sistem_hadiah: null,
    ket: 'SAMA',
    Barcode: '-',
  },
];

interface Gudang {
  kd: string;
  name: string;
  count: number;
  colorIndex: number;
}

const ITEMS_PER_PAGE = 10;

/** Ticker only needs a sample; rendering hundreds of items ×2 kills JS/UI thread. */
const TICKER_MAX_ITEMS = 48;

const COOP_BANNER_BG = '#0d4530';

function countBarangsPerGudangKd(barangList: Barang[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const barang of barangList) {
    const kd = (barang.kd || '').trim();
    if (!kd) continue;
    map.set(kd, (map.get(kd) || 0) + 1);
  }
  return map;
}

const TickerItem = React.memo(function TickerItem({
  barang,
  textMain,
  textMuted,
  accent,
}: {
  barang: Barang;
  textMain: string;
  textMuted: string;
  accent: string;
}) {
  const price = parseFloat(barang.h_anggota) || 0;
  const ket = (barang.ket || '-').trim();
  return (
    <View style={styles.tickerItem}>
      <Image
        source={barang.gambar ? { uri: barang.gambar } : PLACEHOLDER_IMAGE}
        style={styles.tickerThumb}
        resizeMode="cover"
      />
      <Text style={[styles.tickerName, { color: textMain }]} numberOfLines={1}>
        {barang.nama}
      </Text>
      <Text style={[styles.tickerSep, { color: textMuted }]}> · </Text>
      <Text style={[styles.tickerPrice, { color: accent }]}>Rp {price.toLocaleString('id-ID')}</Text>
      <Text style={[styles.tickerSep, { color: textMuted }]}> · </Text>
      <Text style={[styles.tickerKet, { color: textMuted }]} numberOfLines={1}>
        Ket. harga: {ket}
      </Text>
    </View>
  );
});

function BarangRunningTicker({
  barangs,
  isDark,
  emptyMessage,
}: {
  barangs: Barang[];
  isDark: boolean;
  emptyMessage?: string;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [segmentWidth, setSegmentWidth] = useState(0);
  const textMuted = isDark ? '#b8c4bf' : '#4a5c52';
  const textMain = isDark ? '#f5faf7' : '#1a2e22';
  const accent = isDark ? '#FFD700' : '#FF9800';

  useEffect(() => {
    if (segmentWidth <= 0) return;
    translateX.setValue(0);
    // Lebih lambat agar teks sempat dibaca (ms naik dengan lebar konten).
    const duration = Math.min(100_000, Math.max(55_000, segmentWidth * 95));
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -segmentWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [segmentWidth, barangs, translateX]);

  if (barangs.length === 0) {
    return (
      <View
        style={[
          styles.tickerBar,
          {
            backgroundColor: isDark ? '#152219' : '#e8f2eb',
            borderBottomColor: isDark ? '#2a3d32' : '#c5d9cc',
          },
        ]}
      >
        <Text style={[styles.tickerEmpty, { color: textMuted }]}>
          {emptyMessage ?? 'Info harga barang akan berjalan di sini setelah data dimuat'}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.tickerBar,
        {
          backgroundColor: isDark ? '#152219' : '#e8f2eb',
          borderBottomColor: isDark ? '#2a3d32' : '#c5d9cc',
        },
      ]}
    >
      <View style={styles.tickerClip}>
        <Animated.View style={[styles.tickerTrack, { transform: [{ translateX }] }]}>
          <View
            style={styles.tickerSegment}
            onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}
          >
            {barangs.map((b) => (
              <TickerItem
                key={`t1-${b.kd_br}`}
                barang={b}
                textMain={textMain}
                textMuted={textMuted}
                accent={accent}
              />
            ))}
          </View>
          <View style={styles.tickerSegment}>
            {barangs.map((b) => (
              <TickerItem
                key={`t2-${b.kd_br}`}
                barang={b}
                textMain={textMain}
                textMuted={textMuted}
                accent={accent}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function TopBannerBlock({ isDark, barangs }: { isDark: boolean; barangs: Barang[] }) {
  const tickerBarangs = useMemo(() => {
    const hargaBaru = barangs.filter((b) => normalizeBarangKetHarga(b.ket) === 'BARU');
    return hargaBaru.length <= TICKER_MAX_ITEMS ? hargaBaru : hargaBaru.slice(0, TICKER_MAX_ITEMS);
  }, [barangs]);

  const tickerEmptyMessage =
    barangs.length > 0 && tickerBarangs.length === 0
      ? 'Tidak ada barang BARU untuk ditampilkan.'
      : undefined;

  return (
    <View style={{ backgroundColor: COOP_BANNER_BG }}>
      <View style={styles.coopBanner}>
        <Text
          style={styles.coopBannerText}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          KOPERASI NIAGA ABADI RIDHOTULLAH
        </Text>
      </View>
      <BarangRunningTicker barangs={tickerBarangs} isDark={isDark} emptyMessage={tickerEmptyMessage} />
    </View>
  );
}

export default function HomeScreen() {
  const dispatch = useAppDispatch();
  const { colorScheme } = useTheme();
  const { gudangs: reduxGudangs, barangs: reduxBarangs, loading: reduxLoading, error: reduxError, isInitialized } = useAppSelector(state => state.inventory);
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const cartItems = useAppSelector(state => state.cart.items);
  const favoriteItems = useAppSelector(state => state.favorites?.items || []);
  const [gudangs, setGudangs] = useState<Gudang[]>([]);
  const [selectedGudang, setSelectedGudang] = useState<string | null>(null);
  const [filteredBarangs, setFilteredBarangs] = useState<Barang[]>([]);
  const [displayedBarangs, setDisplayedBarangs] = useState<Barang[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showGudangModal, setShowGudangModal] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedBarangForCart, setSelectedBarangForCart] = useState<Barang | null>(null);
  const [cartQtyInput, setCartQtyInput] = useState('1');
  const [refreshing, setRefreshing] = useState(false);
  const loadMoreGuardRef = useRef(false);

  // Responsive layout
  const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
  const isTablet = screenDimensions.width >= 768;
  const gudangColumns = isTablet ? 3 : 2;
  const barangColumns = isTablet ? 3 : 2;

  const isDark = colorScheme === 'dark';
  const containerBg = isDark ? '#1a1a1a' : '#ffffff';
  const headerBg = isDark ? '#242424' : '#f5f5f5';
  const cardBg = isDark ? '#242424' : '#f5f5f5';
  const headerBorder = isDark ? '#333' : '#ddd';
  const sectionBg = isDark ? '#1a1a1a' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#aaa' : '#666';

  // Handle screen orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // Initialize data from API on first load (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!isInitialized) {
      loadGudangsAndData();
    } else {
      // Use data from Redux — reconstruct local gudangs if empty
      if (gudangs.length === 0 && reduxGudangs.length > 0) {
        processGudangs(reduxGudangs, reduxBarangs);
      } else {
        updateGudangCounts(reduxBarangs);
      }
      applyFilters(reduxBarangs, selectedGudang, search);
    }
  }, [isInitialized, isAuthenticated]);

  const loadGudangsAndData = async () => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      // Load gudangs from API
      const gudangList = await getGudangs();
      dispatch(setGudangsAction(gudangList));

      // Load barangs
      const result = await getBarangsWithPagination(1, ITEMS_PER_PAGE, '', undefined);
      dispatch(setBarangsAction(result.data));

      // Process gudangs with barang data
      processGudangs(gudangList, result.data);
      applyFilters(result.data, null, '');

      setCurrentPage(1);
      setTotalPages(result.totalPages);
      dispatch(setInitialized(true));
    } catch (err) {
      console.error('Error loading gudangs:', err);
      dispatch(setError('Failed to load warehouse data. Using default data.'));
      processGudangs(DEFAULT_GUDANGS, DEFAULT_BARANGS);
      dispatch(setBarangsAction(DEFAULT_BARANGS));
      applyFilters(DEFAULT_BARANGS, null, '');
      setCurrentPage(1);
      setTotalPages(1);
      dispatch(setInitialized(true));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Reset filters and search on refresh to get fresh data
    setSelectedGudang(null);
    setSearch('');
    await loadGudangsAndData();
    setRefreshing(false);
  };

  const processGudangs = (gudangList: ApiGudang[], barangList: Barang[] = []) => {
    const counts = countBarangsPerGudangKd(barangList);
    const gudangArray = gudangList
      .map((item, index) => {
        const gudangKd = (item.kd || '').trim();
        return {
          kd: item.kd,
          name: item.nama || item.kd || 'Undefined',
          count: counts.get(gudangKd) || 0,
          colorIndex: index,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    setGudangs(gudangArray);
  };

  // Get theme-aware color for gudang
  const getGudangColor = (colorIndex: number, isAll: boolean = false) => {
    if (isAll) return '#555';

    const colors = ['#C85A54', '#7C4DFF', '#D946EF', '#B8860B', '#1E3A8A', '#16A34A', '#DC2626', '#9333EA'];
    return colors[colorIndex % colors.length];
  };

  const updateGudangCounts = (barangList: Barang[]) => {
    const counts = countBarangsPerGudangKd(barangList);
    setGudangs(prevGudangs => {
      if (prevGudangs.length === 0) return prevGudangs;

      return prevGudangs.map(gudang => {
        const gudangKd = (gudang.kd || '').trim();
        return {
          ...gudang,
          count: counts.get(gudangKd) || 0,
        };
      });
    });
  };

  const applyFilters = (barangList: Barang[], gudang: string | null, searchQuery: string) => {
    let filtered = barangList;

    // Filter by gudang
    if (gudang && gudang.trim()) {
      const normalizedGudang = gudang.trim();
      filtered = filtered.filter(item => {
        const itemKd = (item.kd || '').trim();
        return itemKd === normalizedGudang;
      });
    }

    // Filter by search
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.nama || '').toLowerCase().includes(searchLower) ||
        (item.kd_br || '').toLowerCase().includes(searchLower) ||
        (item.kd_sp || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredBarangs(filtered);
    setDisplayedBarangs(filtered);
  };

  const fetchData = async (
    page: number = 1,
    searchQuery: string = '',
    gudangFilter: string | null = selectedGudang,
    _apiGudangs?: ApiGudang[]
  ): Promise<void> => {
    try {
      if (page === 1) {
        dispatch(setLoading(true));
      } else {
        setLoadingMore(true);
      }
      dispatch(setError(null));

      // Pass gudang filter to API if available
      const result = await getBarangsWithPagination(page, ITEMS_PER_PAGE, searchQuery, gudangFilter || undefined);

      if (page === 1) {
        dispatch(setBarangsAction(result.data));
        updateGudangCounts(result.data);
        applyFilters(result.data, gudangFilter, searchQuery);
      } else {
        const newBarangs = [...reduxBarangs, ...result.data];
        dispatch(addMoreBarangs(result.data));
        updateGudangCounts(newBarangs);
        // IMPORTANT: When loading more, reapply filter to ensure gudang filter is maintained
        applyFilters(newBarangs, gudangFilter, searchQuery);
      }

      setCurrentPage(page);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Error fetching data:', err);
      dispatch(setError('Failed to load barang data. Using default data.'));
      if (page === 1) {
        dispatch(setBarangsAction(DEFAULT_BARANGS));
        updateGudangCounts(DEFAULT_BARANGS);
        applyFilters(DEFAULT_BARANGS, gudangFilter, searchQuery);
        setTotalPages(1);
      }
    } finally {
      dispatch(setLoading(false));
      setLoadingMore(false);
    }
  };

  const handleGudangSelect = (kd: string) => {
    const newGudang = selectedGudang === kd ? null : kd;
    setSelectedGudang(newGudang);
    setCurrentPage(1);
    setShowGudangModal(false);
    fetchData(1, search, newGudang);
  };

  const getSelectedGudangName = () => {
    if (!selectedGudang) return 'Semua Gudang';
    const found = gudangs.find(g => g.kd === selectedGudang);
    return found ? found.name : selectedGudang;
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setCurrentPage(1);
    applyFilters(reduxBarangs, selectedGudang, query);
  };

  const handleLoadMore = () => {
    if (loadingMore || loadMoreGuardRef.current || currentPage >= totalPages) {
      return;
    }
    loadMoreGuardRef.current = true;
    fetchData(currentPage + 1, search, selectedGudang).finally(() => {
      loadMoreGuardRef.current = false;
    });
  };

  const getQuantity = (kd_br: string) => {
    return cartItems.find(item => item.kd_br === kd_br)?.quantity || 0;
  };

  const openAddToCartModal = (barang: Barang) => {
    setSelectedBarangForCart(barang);
    setCartQtyInput('1');
    setShowQtyModal(true);
  };

  const closeAddToCartModal = () => {
    setShowQtyModal(false);
    setSelectedBarangForCart(null);
    setCartQtyInput('1');
  };

  const handleQtyInputChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '');
    setCartQtyInput(sanitized);
  };

  const changeQtyInput = (delta: number) => {
    const current = parseInt(cartQtyInput, 10) || 1;
    const next = Math.max(1, current + delta);
    setCartQtyInput(String(next));
  };

  const confirmAddToCart = () => {
    if (!selectedBarangForCart) return;
    const qty = parseInt(cartQtyInput, 10);
    if (!Number.isFinite(qty) || qty <= 0) return;
    dispatch(addToCart({ barang: selectedBarangForCart, quantity: qty }));
    closeAddToCartModal();
  };

  if (reduxLoading) {
    return (
      <View style={[styles.container, { backgroundColor: containerBg }]}>
        <TopBannerBlock isDark={isDark} barangs={reduxBarangs} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading menu...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Header */}
      {/* <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Daftar Barang</Text>
      </View> */}

      <TopBannerBlock isDark={isDark} barangs={reduxBarangs} />

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: 'headerBg', borderBottomColor: headerBorder }]}>
        <TextInput
          style={[styles.searchInput, {
            color: textColor,
            backgroundColor: isDark ? '#333' : '#e5e5e5',
            borderColor: isDark ? '#444' : '#ccc'
          }]}
          placeholder="Cari nama/kode barang..."
          placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* Barang Title */}
      <View style={[styles.sectionTitleContainer, { backgroundColor: sectionBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Daftar Barang ({displayedBarangs.length})</Text>
      </View>

      {/* Main Content */}
      <View style={[styles.content, { backgroundColor: containerBg }]}>
        {displayedBarangs.length === 0 && !reduxLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: secondaryTextColor }]}>Tidak ada barang ditemukan</Text>
          </View>
        ) : (
          <FlatList
            key={`barang-${barangColumns}`}
            data={displayedBarangs}
            renderItem={({ item }) => (
              <BarangCard
                barang={item}
                quantity={getQuantity(item.kd_br)}
                isFavorite={favoriteItems.some((fav: Barang) => fav.kd_br === item.kd_br)}
                onAddToCart={() => openAddToCartModal(item)}
                onToggleFavorite={() => dispatch(toggleFavorite(item))}
                theme={{ isDark, cardBg, textColor }}
              />
            )}
            keyExtractor={item => item.kd_br}
            numColumns={barangColumns}
            scrollEnabled={true}
            columnWrapperStyle={styles.barangRow}
            initialNumToRender={barangColumns * 2}
            maxToRenderPerBatch={barangColumns * 2}
            windowSize={7}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={Platform.OS === 'android'}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#FFD700']}
                tintColor={isDark ? '#FFD700' : '#FFD700'}
                progressBackgroundColor="transparent"
              />
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#0066FF" />
                  <Text style={styles.footerText}>Loading more...</Text>
                </View>
              ) : currentPage >= totalPages && displayedBarangs.length > 0 ? (
                <View style={styles.footerLoader}>
                  <Text style={styles.footerText}>No more items</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
      {/* Gudang Selector Button */}
      <TouchableOpacity
        style={[styles.gudangSelectorButton, { backgroundColor: isDark ?'#333' : '#ddd', borderBottomColor: headerBorder }]}
        onPress={() => setShowGudangModal(true)}
      >
        <View style={styles.gudangSelectorContent}>
          <Text style={[styles.gudangSelectorLabel, { color: secondaryTextColor }]}>Pilih Gudang</Text>
          <Text style={[styles.gudangSelectorValue, { color: textColor }]}>{getSelectedGudangName()}</Text>
        </View>
        <Text style={[styles.gudangSelectorArrow, { color: isDark ? '#FFD700' : '#FF9800' }]}>▶</Text>
      </TouchableOpacity>

      {/* Gudang Selection Modal */}
      <Modal
        visible={showGudangModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGudangModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: containerBg }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Pilih Gudang</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowGudangModal(false)}
              >
                <Text style={[styles.modalCloseText, { color: isDark ? '#FFD700' : '#FF9800' }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Gudang List */}
            <FlatList
              key={`gudang-modal-${gudangColumns}`}
              data={[{ kd: 'all', name: 'Semua Gudang', count: reduxBarangs.length, colorIndex: -1 }, ...gudangs]}
              renderItem={({ item }) => {
                const isAll = item.kd === 'all';
                const bgColor = getGudangColor(item.colorIndex, isAll);
                const isSelected = isAll ? !selectedGudang : selectedGudang === item.kd;
                return (
                  <TouchableOpacity
                    style={[
                      styles.gudangModalCard,
                      { backgroundColor: bgColor },
                      isSelected && styles.gudangModalCardSelected,
                    ]}
                    onPress={() => handleGudangSelect(isAll ? '' : item.kd)}
                  >
                    <View style={styles.gudangModalCardContent}>
                      <Text style={styles.gudangModalCardName}>{item.name}</Text>
                      <Text style={styles.gudangModalCardCount}>{item.count} items</Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.gudangModalCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              keyExtractor={item => item.kd}
              numColumns={gudangColumns}
              columnWrapperStyle={styles.gudangModalRow}
              contentContainerStyle={styles.gudangModalList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showQtyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAddToCartModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.qtyModalContainer, { backgroundColor: containerBg, borderTopColor: headerBorder }]}>
            <View style={[styles.qtyModalHeader, { borderBottomColor: headerBorder }]}>
              <Text style={[styles.qtyModalTitle, { color: textColor }]}>Jumlah Order</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeAddToCartModal}
              >
                <Text style={[styles.modalCloseText, { color: isDark ? '#FFD700' : '#FF9800' }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.qtyModalBarangName, { color: textColor }]} numberOfLines={2}>
              {selectedBarangForCart?.nama || '-'}
            </Text>

            <View style={styles.qtyInputRow}>
              <TouchableOpacity
                style={[styles.qtyAdjustButton, { backgroundColor: isDark ? '#2d2d2d' : '#ececec' }]}
                onPress={() => changeQtyInput(-1)}
              >
                <Text style={[styles.qtyAdjustButtonText, { color: textColor }]}>-</Text>
              </TouchableOpacity>
              <TextInput
                value={cartQtyInput}
                onChangeText={handleQtyInputChange}
                keyboardType="number-pad"
                style={[
                  styles.qtyInput,
                  {
                    color: textColor,
                    backgroundColor: isDark ? '#333' : '#f2f2f2',
                    borderColor: isDark ? '#444' : '#ccc',
                  },
                ]}
                placeholder="Jumlah"
                placeholderTextColor={secondaryTextColor}
                selectTextOnFocus
              />
              <TouchableOpacity
                style={[styles.qtyAdjustButton, { backgroundColor: isDark ? '#2d2d2d' : '#ececec' }]}
                onPress={() => changeQtyInput(1)}
              >
                <Text style={[styles.qtyAdjustButtonText, { color: textColor }]}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.qtyConfirmButton}
              onPress={confirmAddToCart}
            >
              <Text style={styles.qtyConfirmButtonText}>Simpan ke Keranjang</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Separate component for Barang Card for better performance and TS clarity
const BarangCard = ({
  barang,
  quantity,
  isFavorite,
  onAddToCart,
  onToggleFavorite,
  theme,
}: {
  barang: Barang;
  quantity: number;
  isFavorite: boolean;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
  theme: { isDark: boolean; cardBg: string; textColor: string };
}) => {
  const price = parseFloat(barang.h_anggota) || 0;

  return (
    <View style={[styles.barangCard, { backgroundColor: theme.cardBg }]}>
      <View style={styles.barangCardImageContainer}>
        <Image
          source={barang.gambar ? { uri: barang.gambar } : PLACEHOLDER_IMAGE}
          style={styles.barangImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onToggleFavorite}
        >
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={20} color={isFavorite ? '#E53935' : '#fff'} />
        </TouchableOpacity>
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
          {(() => {
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
              <View style={styles.ketWrapper}>
                <Ionicons name={iconName} size={14} color={iconColor} style={styles.ketIcon} />
                <Text style={[styles.barangKode, { color: iconColor, fontWeight: 'bold' }]}>{ketLabel}</Text>
              </View>
            );
          })()}
        </View>
      </View>
      <View style={styles.barangCardContent}>
        <Text style={[styles.barangPrice, { color: theme.textColor }]}>Rp {price.toLocaleString('id-ID')}</Text>
        <Text style={[styles.barangSatuan, { color: theme.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }]}>{barang.satuan}</Text>
      </View>
      <TouchableOpacity
        style={[styles.addButton, quantity > 0 && styles.addButtonActive]}
        onPress={onAddToCart}
      >
        <Text style={styles.addButtonText}>🛒 {quantity > 0 ? 'Tambah Lagi' : 'Tambah'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#242424',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    height: 40,
  },
  sectionTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  gudangSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  gudangSelectorContent: {
    flex: 1,
  },
  gudangSelectorLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  gudangSelectorValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  gudangSelectorArrow: {
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  qtyModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  qtyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  qtyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  qtyModalBarangName: {
    marginTop: 14,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  qtyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  qtyAdjustButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyAdjustButtonText: {
    fontSize: 22,
    fontWeight: '700',
  },
  qtyInput: {
    flex: 1,
    marginHorizontal: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
  },
  qtyConfirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  qtyConfirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    fontWeight: '600',
  },
  gudangModalList: {
    padding: 12,
    paddingBottom: 40,
  },
  gudangModalRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gudangModalCard: {
    flex: 1,
    borderRadius: 14,
    padding: 18,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 90,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  gudangModalCardSelected: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  gudangModalCardContent: {
    alignItems: 'center',
  },
  gudangModalCardName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  gudangModalCardCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  gudangModalCheckmark: {
    position: 'absolute',
    top: 8,
    right: 10,
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#242424',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#444',
  },
  gudangButton: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  gudangButtonActive: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  gudangButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  gudangButtonTextActive: {
    color: '#fff',
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 8,
  },
  categoriesSection: {
    padding: 12,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryItems: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  barangsSection: {
    padding: 12,
  },
  barangRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  barangCard: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 6,
    minHeight: 280,
    flexDirection: 'column',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  barangCardImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#333',
    position: 'relative',
  },
  barangImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
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
  quantityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  barangCardContent: {
    flex: 1,
    padding: 10,
  },
  barangName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 3,
    lineHeight: 18,
  },
  barangKode: {
    fontSize: 11,
  },
  ketContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ketWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ketIcon: {
    marginRight: 4,
  },
  barangPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  barangSatuan: {
    fontSize: 11,
  },
  menuItemsSection: {
    padding: 12,
  },
  menuItemRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  menuItemCard: {
    flex: 1,
    backgroundColor: '#242424',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
    minHeight: 200,
  },
  itemIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  itemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#61d665ff',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonActive: {
    backgroundColor: '#FFD700',
  },
  addButtonText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  coopBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coopBannerText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
    color: '#FFD700',
  },
  tickerBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
    justifyContent: 'center',
  },
  tickerEmpty: {
    fontSize: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    textAlign: 'center',
  },
  tickerClip: {
    overflow: 'hidden',
    width: '100%',
  },
  tickerTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 28,
    flexShrink: 0,
    maxHeight: 34,
  },
  tickerThumb: {
    width: 26,
    height: 26,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  tickerName: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 200,
  },
  tickerSep: {
    fontSize: 12,
    fontWeight: '500',
  },
  tickerPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
  tickerKet: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 140,
  },
});

import { useTheme } from '@/hooks/use-theme';
import { Gudang as ApiGudang, Barang, getBarangsWithPagination, getGudangs } from '@/services/menuApi';
import { addToCart } from '@/store/cartSlice';
import { toggleFavorite } from '@/store/favoriteSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addMoreBarangs, setBarangs as setBarangsAction, setError, setGudangs as setGudangsAction, setInitialized, setLoading } from '@/store/inventorySlice';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PLACEHOLDER_IMAGE = require('@/assets/images/product_placeholder.jpg');

interface Gudang {
  kd: string;
  name: string;
  count: number;
  colorIndex: number;
}

const ITEMS_PER_PAGE = 10;

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

  const processGudangs = (gudangList: ApiGudang[], barangList: Barang[] = []) => {
    const gudangArray = gudangList.map((item, index) => {
      const count = barangList.filter(barang => {
        const barangKd = (barang.kd || '').trim();
        const gudangKd = (item.kd || '').trim();
        return barangKd === gudangKd;
      }).length;

      return {
        kd: item.kd,
        name: item.nama || item.kd || 'Undefined',
        count: count,
        colorIndex: index,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    console.log('Loaded gudangs:', gudangArray);
    setGudangs(gudangArray);
  };

  // Get theme-aware color for gudang
  const getGudangColor = (colorIndex: number, isAll: boolean = false) => {
    if (isAll) return '#555';

    const colors = ['#C85A54', '#7C4DFF', '#D946EF', '#B8860B', '#1E3A8A', '#16A34A', '#DC2626', '#9333EA'];
    return colors[colorIndex % colors.length];
  };

  const updateGudangCounts = (barangList: Barang[]) => {
    setGudangs(prevGudangs => {
      if (prevGudangs.length === 0) return prevGudangs;

      return prevGudangs.map(gudang => {
        const count = barangList.filter(item => {
          const itemKd = (item.kd || '').trim();
          const gudangKd = (gudang.kd || '').trim();
          return itemKd === gudangKd;
        }).length;
        return {
          ...gudang,
          count,
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
      console.log(`Filter by gudang '${normalizedGudang}': found ${filtered.length} items`); // Debug log
    }

    // Filter by search
    if (searchQuery && searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.nama || '').toLowerCase().includes(searchLower) ||
        (item.kd_br || '').toLowerCase().includes(searchLower) ||
        (item.kd_sp || '').toLowerCase().includes(searchLower)
      );
      console.log(`Filter by search '${searchQuery}': found ${filtered.length} items`); // Debug log
    }

    setFilteredBarangs(filtered);
    setDisplayedBarangs(filtered);
  };

  const fetchData = async (page: number = 1, searchQuery: string = '', gudangFilter: string | null = selectedGudang, apiGudangs?: ApiGudang[]) => {
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
    if (!loadingMore && currentPage < totalPages) {
      fetchData(currentPage + 1, search, selectedGudang);
    }
  };

  const getQuantity = (kd_br: string) => {
    return cartItems.find(item => item.kd_br === kd_br)?.quantity || 0;
  };

  const handleAddToCart = (barang: Barang) => {
    dispatch(addToCart({ barang, quantity: 1 }));
  };

  const BarangCard = ({ barang }: { barang: Barang }) => {
    const quantity = getQuantity(barang.kd_br);
    const price = parseFloat(barang.h_anggota) || 0;
    const isFavorite = favoriteItems.some((fav: Barang) => fav.kd_br === barang.kd_br);

    return (
      <View style={[styles.barangCard, { backgroundColor: cardBg }]}>
        <View style={styles.barangCardImageContainer}>
          <Image
            source={barang.gambar ? { uri: barang.gambar } : PLACEHOLDER_IMAGE}
            style={styles.barangImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => dispatch(toggleFavorite(barang))}
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
          <Text style={[styles.barangName, { color: textColor }]}>{barang.nama}</Text>
          <Text style={[styles.barangKode, { color: isDark ? '#FFD700' : '#FF9800' }]}>Kode: {barang.kd_br}</Text>
        </View>
        <View style={styles.barangCardContent}>
          <Text style={[styles.barangPrice, { color: textColor }]}>Rp {price.toLocaleString('id-ID')}</Text>
          <Text style={[styles.barangSatuan, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }]}>{barang.satuan}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, quantity > 0 && styles.addButtonActive]}
          onPress={() => quantity === 0 && handleAddToCart(barang)}
        >
          <Text style={styles.addButtonText}>🛒 {quantity > 0 ? 'Dalam Keranjang' : 'Tambah'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (reduxLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Daftar Barang</Text>
      </View>

      {/* Gudang Selector Button */}
      <TouchableOpacity
        style={[styles.gudangSelectorButton, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}
        onPress={() => setShowGudangModal(true)}
      >
        <View style={styles.gudangSelectorContent}>
          <Text style={[styles.gudangSelectorLabel, { color: secondaryTextColor }]}>Gudang</Text>
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

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
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
            renderItem={({ item }) => <BarangCard barang={item} />}
            keyExtractor={item => item.kd_br}
            numColumns={barangColumns}
            scrollEnabled={true}
            columnWrapperStyle={styles.barangRow}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
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
    </View>
  );
}

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
    paddingVertical: 14,
    backgroundColor: '#242424',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    height: 60,
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
    paddingVertical: 14,
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
    fontSize: 16,
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
    fontSize: 18,
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
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
  },
});

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
    Ket: 'SAMA',
    Barcode: '-',
  },
  {
    kd_br: '000000',
    nama: 'CHARM NIGHT 2P @24*10',
    kd: '17        ',
    kd_sp: 'SURADI',
    jenis_produk: 'Barang',
    satuan: 'DUS',
    status: 'Tidak Digunakan               ',
    HPP: '250338',
    h_anggota: '257800.00',
    h_to: '257800',
    h_boman: '0',
    h_royan: '0',
    h_cabang: '250800',
    h_non: '257800',
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
    hpp_beli: '250338',
    tgl_beli: null,
    tgl_jual: null,
    kd_hd: null,
    qty_hd: null,
    qty_br: null,
    status_hadiah: null,
    sistem_hadiah: null,
    Ket: 'SAMA',
    Barcode: '-',
  },
];

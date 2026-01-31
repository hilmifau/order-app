import { useTheme } from '@/hooks/use-theme';
import { Gudang as ApiGudang, Barang, getBarangsWithPagination, getGudangs } from '@/services/menuApi';
import { addToCart } from '@/store/cartSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addMoreBarangs, setBarangs as setBarangsAction, setError, setGudangs as setGudangsAction, setInitialized, setLoading } from '@/store/inventorySlice';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const cartItems = useAppSelector(state => state.cart.items);
  const [gudangs, setGudangs] = useState<Gudang[]>([]);
  const [selectedGudang, setSelectedGudang] = useState<string | null>(null);
  const [filteredBarangs, setFilteredBarangs] = useState<Barang[]>([]);
  const [displayedBarangs, setDisplayedBarangs] = useState<Barang[]>([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gudangExpanded, setGudangExpanded] = useState(true);
  
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

  // Initialize data from API on first load
  useEffect(() => {
    if (!isInitialized) {
      loadGudangsAndData();
    } else {
      // Use data from Redux
      updateGudangCounts(reduxBarangs);
      applyFilters(reduxBarangs, selectedGudang, search);
    }
  }, [isInitialized]);

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
        item.nama.toLowerCase().includes(searchLower) ||
        item.kd_br.toLowerCase().includes(searchLower) ||
        item.kd_sp.toLowerCase().includes(searchLower)
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
    fetchData(1, search, newGudang);
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
    
    return (
      <View style={[styles.barangCard, { backgroundColor: cardBg }]}>
        <View style={styles.barangCardContent}>
          <Text style={[styles.barangName, { color: textColor }]} numberOfLines={2}>{barang.nama}</Text>
          <Text style={[styles.barangKode, { color: isDark ? '#FFD700' : '#FF9800' }]}>Kode: {barang.kd_br}</Text>
          <Text style={[styles.barangPrice, { color: textColor }]}>Rp {price.toLocaleString('id-ID')}</Text>
          <Text style={[styles.barangSatuan, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)' }]}>{barang.satuan}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, quantity > 0 && styles.addButtonActive]}
          onPress={() => quantity === 0 && handleAddToCart(barang)}
        >
          <Text style={styles.addButtonText}>🛒 {quantity > 0 ? quantity : 'Tambah'}</Text>
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

      {/* Gudang Title */}
      <View style={[styles.sectionTitleContainer, { backgroundColor: sectionBg }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Pilih Gudang (Warehouse)</Text>
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setGudangExpanded(!gudangExpanded)}
        >
          <Text style={styles.expandButtonText}>{gudangExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
      </View>

      {/* Gudang Filter Grid - Collapsible */}
      {gudangExpanded && (
      <View style={[styles.gudangGridContainer, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <FlatList
          key={`gudang-${gudangColumns}`}
          data={[...gudangs, { kd: 'all', name: 'Semua', count: reduxBarangs.length, colorIndex: -1 }]}
          renderItem={({ item }) => {
            const isAll = item.kd === 'all';
            const bgColor = getGudangColor(item.colorIndex, isAll);
            return (
              <TouchableOpacity
                style={[
                  styles.gudangCard,
                  { backgroundColor: bgColor },
                  (isAll ? !selectedGudang : selectedGudang === item.kd) && styles.gudangCardSelected
                ]}
                onPress={() => handleGudangSelect(isAll ? '' : item.kd)}
              >
                <Text style={styles.gudangCardName}>{item.name}</Text>
                <Text style={styles.gudangCardCount}>{item.count} items</Text>
              </TouchableOpacity>
            );
          }}
          keyExtractor={item => item.kd}
          numColumns={gudangColumns}
          scrollEnabled={true}
          columnWrapperStyle={styles.gudangGridRow}
          nestedScrollEnabled={true}
        />
      </View>
      )}

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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#242424',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  expandButton: {
    padding: 8,
  },
  expandButtonText: {
    color: '#FFD700',
    fontSize: 12,
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
  gudangGridContainer: {
    maxHeight: 250,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  gudangGridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gudangCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gudangCardSelected: {
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  gudangCardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  gudangCardCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
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
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
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
    padding: 12,
    marginHorizontal: 6,
    minHeight: 220,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  barangCardContent: {
    flex: 1,
  },
  barangName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  barangKode: {
    fontSize: 11,
    marginBottom: 6,
  },
  barangPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barangSatuan: {
    fontSize: 11,
    marginBottom: 8,
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
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addButtonActive: {
    backgroundColor: '#4CAF50',
  },
  addButtonText: {
    fontSize: 16,
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

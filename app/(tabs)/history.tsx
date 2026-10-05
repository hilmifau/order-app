import { useTheme } from '@/hooks/use-theme';
import { getAllOrders, getOrderDetails, getOrdersByCustomer } from '@/services/orderApi';
import { RootState } from '@/store/store';
import { getFriendlyErrorMessage } from '@/utils/apiError';
import { formatDateDdMmYyyy, formatNowDdMmYyyy } from '@/utils/dateDisplay';
import { isAdmin } from '@/utils/roles';
import {
  COMPANY_NAME,
  formatIdNumber,
  generateInvoiceHtml,
  PdfItem,
  qtyBySatuan,
  terbilangId,
} from '@/utils/pdfUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';

export default function HistoryScreen() {
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

  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isPrinting, setIsPrinting] = useState<string | null>(null);
  const detailsCacheRef = useRef<Map<string, any[]>>(new Map());

  // New states for Order Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const loadHistory = useCallback(async () => {
    const admin = isAdmin(user);
    if (!admin && !user?.kd_cus) return;
    try {
      setIsLoadingOrders(true);
      const data = admin ? await getAllOrders() : await getOrdersByCustomer(user?.kd_cus);
      const sorted = [...data].sort((a, b) => {
        const noA = parseInt(a.no_tran || a.id || '0');
        const noB = parseInt(b.no_tran || b.id || '0');
        return noB - noA;
      });
      setOrders(sorted);
    } catch (error) {
      console.error('Failed to load history:', error);
      Alert.alert(
        'Gagal Memuat Riwayat',
        getFriendlyErrorMessage(error, { fallback: 'Gagal memuat riwayat pesanan. Silakan coba lagi.' })
      );
    } finally {
      setIsLoadingOrders(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      if (isAdmin(user) || user?.kd_cus) {
        loadHistory();
      }
    }, [user, loadHistory])
  );

  const getCachedDetails = async (noTran: string | number) => {
    const key = String(noTran);
    const cached = detailsCacheRef.current.get(key);
    if (cached) {
      return cached;
    }
    const details = await getOrderDetails(noTran);
    detailsCacheRef.current.set(key, details);
    return details;
  };

  const handleShowOrderDetail = async (order: any) => {
    setSelectedOrder(order);
    setShowDetailModal(true);

    const cacheKey = String(order.no_tran || order.id);
    const cached = detailsCacheRef.current.get(cacheKey);
    if (cached) {
      setOrderDetails(cached);
      setIsLoadingDetails(false);
      return;
    }

    setOrderDetails([]);
    setIsLoadingDetails(true);

    try {
      const details = await getCachedDetails(order.no_tran || order.id);
      setOrderDetails(details);
    } catch (error) {
      console.error('Failed to load order details:', error);
      Alert.alert(
        'Gagal Memuat Detail',
        getFriendlyErrorMessage(error, { fallback: 'Gagal memuat detail pesanan. Silakan coba lagi.' })
      );
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handlePrintHistoryPDF = async (order: any) => {
    try {
      setIsPrinting(order.no_tran || order.id.toString());

      const details = await getCachedDetails(order.no_tran || order.id);

      const pdfItems: PdfItem[] = details.map((d) => ({
        nama: d.nama_br || 'Barang',
        kd_br: d.KD_BR || '-',
        satuan: d.SAT || '-',
        price: d.harga || 0,
        quantity: d.QTY || 0,
        subtotal: d.subtotal || 0,
        ket: d.kd || '',
      }));

      const orderDate = order.tgl ? formatDateDdMmYyyy(order.tgl) : formatNowDdMmYyyy();
      const orderTime = (order.jam && String(order.jam).trim()) || '';

      const html = generateInvoiceHtml(
        user ? {
          name: user.name,
          username: user.username,
          storeName: user.storeName,
          kd_cus: order.kd_cus || user.kd_cus,
          email: user.email,
          phone: user.phone,
          address: user.address,
        } : null,
        pdfItems,
        order.total_po || 0,
        orderDate,
        orderTime,
        order.no_tran || order.id.toString(),
        {
          title: 'DETAIL PO',
          operator: order.nama_adm || user?.username || user?.name,
          jenisTran: order.jenis,
          tAkhirB: order.ket,
          status: order.status,
        }
      );

      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === 'web') {
        window.open(uri, '_blank');
      } else {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
      }
    } catch (error) {
      console.error('History PDF error:', error);
      Alert.alert('Error', 'Gagal membuat PDF untuk riwayat ini.');
    } finally {
      setIsPrinting(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          {isAdmin(user) ? 'Semua PO' : 'Riwayat PO'}
        </Text>
        <TouchableOpacity
          style={[styles.refreshButton, { position: 'absolute', right: 16, zIndex: 1 }]}
          onPress={loadHistory}
          disabled={isLoadingOrders}
        >
          {isLoadingOrders ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Ionicons name="refresh" size={24} color={accentColor} />
          )}
        </TouchableOpacity>
      </View>

      {isLoadingOrders && orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Memuat riwayat...</Text>
        </View>
      ) : (
        <FlatList
          style={styles.scrollContainer}
          data={orders}
          keyExtractor={(item, index) => `${item.id ?? 'x'}-${item.no_tran ?? index}`}
          contentContainerStyle={[styles.historyList, orders.length === 0 && { flexGrow: 1 }]}
          initialNumToRender={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={80} color={secondaryTextColor} />
              <Text style={[styles.emptyText, { color: textColor }]}>
                Belum ada riwayat PO
              </Text>
              <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>
                Kode Pelanggan: {user?.kd_cus || '-'}
              </Text>
              <TouchableOpacity style={[styles.orderNowBtn, { backgroundColor: accentColor }]} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.orderNowText}>Mulai Belanja</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.historyCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.historyHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.fakturBrand, { color: secondaryTextColor }]}>{COMPANY_NAME}</Text>
                  <Text style={[styles.historyNoTran, { color: textColor }]}>
                    No Faktur : {item.no_tran || item.id}
                  </Text>
                  <Text style={[styles.historyDate, { color: secondaryTextColor }]}>
                    Tanggal : {formatDateDdMmYyyy(item.tgl)}
                    {item.jam ? `   Jam : ${item.jam}` : ''}
                  </Text>
                  <Text style={[styles.historyDate, { color: secondaryTextColor }]} numberOfLines={1}>
                    Kepada Yth : {isAdmin(user) ? (item.kd_cus || '-') : (user?.storeName || user?.name || item.kd_cus || '-')}
                  </Text>
                  {item.jenis ? (
                    <Text style={[styles.historyDate, { color: secondaryTextColor }]}>
                      Jenis Tran : {item.jenis}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.historyStatusBadge}>
                  <Text style={styles.historyStatusText}>{item.status || 'SELESAI'}</Text>
                </View>
              </View>

              <View style={[styles.cardDivider, { backgroundColor: borderColor }]} />

              <View style={styles.historyFooter}>
                <View>
                  <Text style={[styles.historyTotalLabel, { color: secondaryTextColor }]}>Grand Total</Text>
                  <Text style={[styles.historyTotalAmount, { color: textColor }]}>
                    {formatIdNumber(item.total_po || 0)}
                  </Text>
                </View>

                <View style={styles.historyActionButtons}>
                  <TouchableOpacity
                    style={[styles.detailBtn, { backgroundColor: isDark ? '#333' : '#eee', borderColor }]}
                    onPress={() => handleShowOrderDetail(item)}
                  >
                    <Ionicons name="eye" size={16} color={accentColor} style={{ marginRight: 4 }} />
                    <Text style={[styles.detailBtnText, { color: textColor }]}>Detail</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.printPdfBtn, { backgroundColor: accentColor }]}
                    onPress={() => handlePrintHistoryPDF(item)}
                    disabled={isPrinting === (item.no_tran || item.id.toString())}
                  >
                    {isPrinting === (item.no_tran || item.id.toString()) ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="document-text" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.printPdfBtnText}>Cetak PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListFooterComponent={<View style={{ height: 40 }} />}
        />
      )}

      {/* Order Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: containerBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Detail PO</Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={secondaryTextColor} />
              </TouchableOpacity>
            </View>

            {isLoadingDetails ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={accentColor} />
                <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Memuat detail...</Text>
              </View>
            ) : (
              <>
                <FlatList
                  style={styles.modalScroll}
                  data={orderDetails}
                  keyExtractor={(item, idx) => `${item.KD_BR || 'item'}-${idx}`}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                  ListHeaderComponent={
                    <>
                      {selectedOrder && (
                        <View style={[styles.modalOrderInfo, { backgroundColor: cardBg }]}>
                          <Text style={[styles.fakturTitle, { color: textColor }]}>DETAIL PO</Text>
                          <Text style={[styles.fakturBrand, { color: secondaryTextColor, marginBottom: 10 }]}>
                            {COMPANY_NAME}
                          </Text>
                          <View style={styles.metaGrid}>
                            <View style={styles.metaCol}>
                              <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Operator</Text>
                                <Text style={[styles.infoValue, { color: textColor }]}>
                                  {selectedOrder.nama_adm || user?.username || '-'}
                                </Text>
                              </View>
                              <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>No Faktur</Text>
                                <Text style={[styles.infoValue, { color: textColor }]}>
                                  {selectedOrder.no_tran || selectedOrder.id}
                                </Text>
                              </View>
                              <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Jam</Text>
                                <Text style={[styles.infoValue, { color: textColor }]}>{selectedOrder.jam || '-'}</Text>
                              </View>
                              <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Jenis Tran</Text>
                                <Text style={[styles.infoValue, { color: textColor }]}>{selectedOrder.jenis || '-'}</Text>
                              </View>
                            </View>
                            <View style={styles.metaCol}>
                              <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Tanggal</Text>
                                <Text style={[styles.infoValue, { color: textColor }]}>
                                  {formatDateDdMmYyyy(selectedOrder.tgl)}
                                </Text>
                              </View>
                              <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Kepada Yth</Text>
                                <Text style={[styles.infoValue, { color: textColor }]} numberOfLines={2}>
                                  {isAdmin(user)
                                    ? (selectedOrder.kd_cus || '-')
                                    : (user?.storeName || user?.name || selectedOrder.kd_cus || '-')}
                                </Text>
                              </View>
                              <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>No. Reg</Text>
                                <Text style={[styles.infoValue, { color: textColor }]}>
                                  {selectedOrder.kd_cus || user?.kd_cus || '-'}
                                </Text>
                              </View>
                              <View style={styles.infoRow}>
                                <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>T Akhir B</Text>
                                <Text style={[styles.infoValue, { color: textColor }]}>
                                  {selectedOrder.ket ? formatDateDdMmYyyy(selectedOrder.ket) : '-'}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      )}
                      <View style={[styles.tableHead, { borderColor }]}>
                        <Text style={[styles.thNo, { color: secondaryTextColor }]}>No.</Text>
                        <Text style={[styles.thNama, { color: secondaryTextColor }]}>Nama Barang</Text>
                        <Text style={[styles.thKet, { color: secondaryTextColor }]}>KET</Text>
                        <Text style={[styles.thNum, { color: secondaryTextColor }]}>Harga</Text>
                        <Text style={[styles.thNum, { color: secondaryTextColor }]}>Jumlah</Text>
                      </View>
                    </>
                  }
                  renderItem={({ item, index }) => (
                    <View style={[styles.tableRow, { borderBottomColor: borderColor }]}>
                      <Text style={[styles.tdNo, { color: secondaryTextColor }]}>{index + 1}</Text>
                      <View style={styles.tdNamaWrap}>
                        <Text style={[styles.tdNama, { color: textColor }]} numberOfLines={2}>{item.nama_br}</Text>
                        <Text style={[styles.tdHarga, { color: secondaryTextColor }]}>
                          {item.QTY} {item.SAT}
                        </Text>
                      </View>
                      <Text style={[styles.tdKet, { color: accentColor }]}>{item.kd || ''}</Text>
                      <Text style={[styles.tdNum, { color: textColor }]}>{formatIdNumber(item.harga || 0)}</Text>
                      <Text style={[styles.tdNum, { color: textColor }]}>{formatIdNumber(item.subtotal || 0)}</Text>
                    </View>
                  )}
                  ListEmptyComponent={
                    <Text style={[styles.detailItemText, { color: secondaryTextColor }]}>
                      Tidak ada detail barang.
                    </Text>
                  }
                />

                <View style={[styles.modalFooter, { borderTopColor: borderColor, backgroundColor: cardBg }]}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={[styles.qtyFooter, { color: secondaryTextColor }]}>
                      {qtyBySatuan(
                        orderDetails.map((d) => ({
                          nama: d.nama_br,
                          kd_br: d.KD_BR,
                          satuan: d.SAT,
                          price: d.harga || 0,
                          quantity: d.QTY || 0,
                          subtotal: d.subtotal || 0,
                        }))
                      )
                        .map((q) => `Tot Qty ${q.sat} : ${formatIdNumber(q.qty)}`)
                        .join('   ')}
                    </Text>
                    <Text style={[styles.terbilang, { color: secondaryTextColor }]} numberOfLines={2}>
                      Terbilang : {terbilangId(selectedOrder?.total_po || 0)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.totalLabel, { color: textColor }]}>Grand Total</Text>
                    <Text style={[styles.totalAmount, { color: accentColor }]}>
                      {formatIdNumber(selectedOrder?.total_po || 0)}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    height: 50,
  },
  refreshButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  historyList: {
    gap: 16,
  },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyNoTran: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    marginTop: 1,
  },
  fakturBrand: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  fakturTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metaCol: {
    flex: 1,
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 6,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thNo: { width: 28, fontSize: 10, fontWeight: '800' },
  thNama: { flex: 1, fontSize: 10, fontWeight: '800' },
  thKet: { width: 32, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  thNum: { width: 68, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  tdNo: { width: 28, fontSize: 11, paddingTop: 1 },
  tdNamaWrap: { flex: 1, paddingRight: 4 },
  tdNama: { fontSize: 12, fontWeight: '600' },
  tdHarga: { fontSize: 10, marginTop: 2 },
  tdKet: { width: 32, fontSize: 11, fontWeight: '700', textAlign: 'center', paddingTop: 1 },
  tdNum: { width: 68, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  qtyFooter: {
    fontSize: 11,
    marginBottom: 4,
  },
  terbilang: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  historyStatusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  cardDivider: {
    height: 1,
    marginBottom: 12,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTotalLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF9800',
  },
  printPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 2,
  },
  printPdfBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    marginBottom: 24,
  },
  orderNowBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  orderNowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  historyActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalOrderInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    gap: 6,
  },
  infoLabel: {
    fontSize: 11,
    width: 78,
  },
  infoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  detailItemText: {
    fontSize: 12,
  },
  modalFooter: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

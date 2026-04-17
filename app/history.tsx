import { useTheme } from '@/hooks/use-theme';
import { getOrderDetails, getOrdersByCustomer } from '@/services/orderApi';
import { RootState } from '@/store/store';
import { formatDateDdMmYyyy, formatNowDdMmYyyy } from '@/utils/dateDisplay';
import { generateInvoiceHtml, PdfItem } from '@/utils/pdfUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

  // New states for Order Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetails, setOrderDetails] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    if (user?.kd_cus) {
      loadHistory();
    }
  }, [user?.kd_cus]);

  const loadHistory = async () => {
    if (!user?.kd_cus) return;

    try {
      setIsLoadingOrders(true);
      const data = await getOrdersByCustomer(user.kd_cus);
      // Sort by newest transaction first (using no_tran or id)
      const sorted = [...data].sort((a, b) => {
        const noA = parseInt(a.no_tran || a.id || '0');
        const noB = parseInt(b.no_tran || b.id || '0');
        return noB - noA;
      });
      setOrders(sorted);
    } catch (error) {
      console.error('Failed to load history:', error);
      Alert.alert('Error', 'Gagal memuat riwayat pesanan');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleShowOrderDetail = async (order: any) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    setOrderDetails([]);
    setIsLoadingDetails(true);

    try {
      const details = await getOrderDetails(order.no_tran || order.id);
      setOrderDetails(details);
    } catch (error) {
      console.error('Failed to load order details:', error);
      Alert.alert('Error', 'Gagal memuat detail pesanan');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handlePrintHistoryPDF = async (order: any) => {
    try {
      setIsPrinting(order.no_tran || order.id.toString());

      const details = await getOrderDetails(order.no_tran || order.id);

      const pdfItems: PdfItem[] = details.map((d) => ({
        nama: d.nama_br || 'Barang',
        kd_br: d.KD_BR || '-',
        satuan: d.SAT || '-',
        price: d.harga || 0,
        quantity: d.QTY || 0,
        subtotal: d.subtotal || 0,
      }));

      const orderDate = order.tgl ? formatDateDdMmYyyy(order.tgl) : formatNowDdMmYyyy();
      const orderTime = (order.jam && String(order.jam).trim()) || '';

      const html = generateInvoiceHtml(
        user ? {
          name: user.name,
          username: user.username,
          storeName: user.storeName,
          kd_cus: user.kd_cus,
          email: user.email
        } : null,
        pdfItems,
        order.total_po || 0,
        orderDate,
        orderTime,
        order.no_tran || order.id.toString()
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
      {/* Custom Header with Back Button */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={[styles.backButton, { position: 'absolute', left: 16, zIndex: 1 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={accentColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Riwayat Pesanan</Text>
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

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {isLoadingOrders && orders.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[styles.loadingText, { color: secondaryTextColor }]}>Memuat riwayat...</Text>
          </View>
        ) : orders.length > 0 ? (
          <View style={styles.historyList}>
            {orders.map((item, index) => (
              <View key={`${item.id}--${item.no_tran}-${index}`} style={[styles.historyCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.historyHeader}>
                  <View>
                    <Text style={[styles.historyNoTran, { color: textColor }]}>#{item.no_tran || item.id}</Text>
                    <Text style={[styles.historyDate, { color: secondaryTextColor }]}>
                      {formatDateDdMmYyyy(item.tgl)}
                    </Text>
                  </View>
                  <View style={styles.historyStatusBadge}>
                    <Text style={styles.historyStatusText}>{item.status || 'SELESAI'}</Text>
                  </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: borderColor }]} />

                <View style={styles.historyFooter}>
                  <View>
                    <Text style={[styles.historyTotalLabel, { color: secondaryTextColor }]}>Total Pesanan</Text>
                    <Text style={[styles.historyTotalAmount, { color: textColor }]}>
                      Rp {(item.total_po || 0).toLocaleString('id-ID')}
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
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={80} color={secondaryTextColor} />
            <Text style={[styles.emptyText, { color: textColor }]}>
              Belum ada riwayat pesanan
            </Text>
            <Text style={[styles.emptySubText, { color: secondaryTextColor }]}>
              Kode Pelanggan: {user?.kd_cus || '-'}
            </Text>
            <TouchableOpacity style={[styles.orderNowBtn, { backgroundColor: accentColor }]} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.orderNowText}>Mulai Belanja</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

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
              <Text style={[styles.modalTitle, { color: textColor }]}>Detail Pesanan</Text>
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
                <ScrollView style={styles.modalScroll}>
                  {selectedOrder && (
                    <View style={[styles.modalOrderInfo, { backgroundColor: cardBg }]}>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>No. Transaksi:</Text>
                        <Text style={[styles.infoValue, { color: textColor }]}>#{selectedOrder.no_tran || selectedOrder.id}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: secondaryTextColor }]}>Tanggal:</Text>
                        <Text style={[styles.infoValue, { color: textColor }]}>
                          {formatDateDdMmYyyy(selectedOrder.tgl)}
                          {selectedOrder.jam ? ` · ${selectedOrder.jam}` : ''}
                        </Text>
                      </View>
                    </View>
                  )}

                  <Text style={[styles.detailSectionTitle, { color: secondaryTextColor }]}>DAFTAR BARANG</Text>
                  
                  {orderDetails.map((item, idx) => (
                    <View key={`detail-${idx}`} style={[styles.detailItem, { borderBottomColor: borderColor }]}>
                      <View style={styles.detailItemTop}>
                        <Text style={[styles.detailItemName, { color: textColor }]}>{item.nama_br}</Text>
                        <Text style={[styles.detailItemSubtotal, { color: textColor }]}>
                          Rp {(item.subtotal || 0).toLocaleString('id-ID')}
                        </Text>
                      </View>
                      <View style={styles.detailItemBottom}>
                        <Text style={[styles.detailItemText, { color: secondaryTextColor }]}>
                          {item.QTY} {item.SAT} x Rp {(item.harga || 0).toLocaleString('id-ID')}
                        </Text>
                        <Text style={[styles.detailItemText, { color: accentColor }]}>Kode: {item.KD_BR}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={{ height: 20 }} />
                </ScrollView>

                <View style={[styles.modalFooter, { borderTopColor: borderColor, backgroundColor: cardBg }]}>
                  <Text style={[styles.totalLabel, { color: textColor }]}>Total Akhir</Text>
                  <Text style={[styles.totalAmount, { color: accentColor }]}>
                    Rp {(selectedOrder?.total_po || 0).toLocaleString('id-ID')}
                  </Text>
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
    paddingTop: 45,
    paddingBottom: 10,
    borderBottomWidth: 1,
    height: 90,
  },
  backButton: {
    padding: 8,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
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
    fontSize: 18,
    fontWeight: '800',
    color: '#FF9800',
  },
  printPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 2,
  },
  printPdfBtnText: {
    color: '#fff',
    fontSize: 14,
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
    fontSize: 14,
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
    padding: 20,
  },
  modalOrderInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    letterSpacing: 1,
  },
  detailItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailItemName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  detailItemSubtotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItemText: {
    fontSize: 12,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

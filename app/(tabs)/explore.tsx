import { useTheme } from '@/hooks/use-theme';
import { createDetailPoNote, createPoNote, DetailPoNotePayload, PoNotePayload } from '@/services/orderApi';
import { addToCart, clearCart, removeFromCart, updateQuantity } from '@/store/cartSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { formatDateDdMmYyyy, formatDateLabelWithWeekday, formatNowDdMmYyyy, formatTime24h } from '@/utils/dateDisplay';
import { generateInvoiceHtml, PdfItem } from '@/utils/pdfUtils';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, FlatList, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ExploreScreen() {
  const dispatch = useAppDispatch();
  const { colorScheme } = useTheme();
  const cartItems = useAppSelector(state => state.cart.items);
  const favoriteItems = useAppSelector(state => state.favorites?.items || []);
  const user = useAppSelector(state => state.auth.user);
  const [isOrdered, setIsOrdered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noTran, setNoTran] = useState<string | null>(null);

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;
      const display = formatDateLabelWithWeekday(d);
      dates.push({ value: formatted, label: display });
    }
    return dates;
  };

  const [deliveryDates] = useState(generateDates());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isDark = colorScheme === 'dark';
  const containerBg = isDark ? '#1a1a1a' : '#ffffff';
  const headerBg = isDark ? '#242424' : '#f5f5f5';
  const cardBg = isDark ? '#242424' : '#f5f5f5';
  const headerBorder = isDark ? '#333' : '#ddd';
  const textColor = isDark ? '#ffffff' : '#000000';
  const secondaryTextColor = isDark ? '#aaa' : '#666';

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.barang.h_anggota) || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const handleUpdateQuantity = (kd_br: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch(removeFromCart(kd_br));
    } else {
      dispatch(updateQuantity({ kd_br, quantity }));
    }
  };

  const CartItemRow = ({ item }: { item: typeof cartItems[0] }) => {
    const price = parseFloat(item.barang.h_anggota) || 0;
    const itemTotal = price * item.quantity;
    const [inputValue, setInputValue] = useState(item.quantity.toString());

    const handleQuantityChange = (text: string) => {
      setInputValue(text);
      const num = parseInt(text);
      if (!isNaN(num) && num >= 0) {
        handleUpdateQuantity(item.kd_br, num);
      }
    };

    const handleBlur = () => {
      const num = parseInt(inputValue);
      if (isNaN(num) || num < 0) {
        setInputValue('1');
        handleUpdateQuantity(item.kd_br, 1);
      } else if (num === 0) {
        dispatch(removeFromCart(item.kd_br));
      }
    };

    return (
      <View style={[styles.cartItemCard, { backgroundColor: cardBg }]}>
        {/* Top Section: Icon and Name/Code */}
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

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#eee' }]} />

        {/* Bottom Section: Price, Quantity, and Subtotal */}
        <View style={styles.cartItemBottom}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceLabel, { color: secondaryTextColor }]}>Harga Satuan</Text>
            <Text style={[styles.cartItemPrice, { color: textColor }]}>
              Rp {price.toLocaleString('id-ID')}
            </Text>
          </View>

          <View style={styles.controlsContainer}>
            <View style={[styles.quantityControl, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#444' : '#ddd' }]}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item.kd_br, item.quantity - 1)}
              >
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

              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item.kd_br, item.quantity + 1)}
              >
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
  };

  const handleOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Keranjang Kosong', 'Silakan tambahkan barang terlebih dahulu');
      return;
    }
    if (!user?.kd_cus) {
      Alert.alert('Data Tidak Lengkap', 'Kode pelanggan tidak ditemukan. Silakan login ulang.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Pilih Tanggal', 'Silakan pilih Tanggal Pengiriman terlebih dahulu.');
      return;
    }
    const now = new Date();
    const pad2 = (value: number) => value.toString().padStart(2, '0');
    const tgl = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const jam = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

    const total = calculateTotal();

    const masterPayload: PoNotePayload = {
      tgl,
      kd_cus: user.kd_cus,
      jam,
      nama_adm: user.username || user.name || 'Admin',
      kpb: user.username || user.name || 'Admin',
      ket: selectedDate as string,
      status: 'PROSES ORDER',
      total_po: total,
      jenis: 'Anggota',
      // items: cartItems,
    };
    setIsSubmitting(true);
    try {
      const poNoteRes = await createPoNote(masterPayload);

      let finalNoTran: string | null = null;
      if (typeof poNoteRes?.data === 'number' || typeof poNoteRes?.data === 'string') {
        finalNoTran = String(poNoteRes.data);
      } else if (poNoteRes?.data && typeof poNoteRes.data === 'object') {
        finalNoTran = String(
          poNoteRes.data.no_tran || poNoteRes.data.NO_PO || poNoteRes.data.id || poNoteRes.data.po_no || ''
        );
      } else if (poNoteRes && typeof poNoteRes === 'object') {
        finalNoTran = String(
          poNoteRes.no_tran || poNoteRes.NO_PO || poNoteRes.id || poNoteRes.po_no || ''
        );
      }

      finalNoTran = finalNoTran && finalNoTran !== 'undefined' && finalNoTran !== 'null' ? finalNoTran : null;
      if (!finalNoTran) {
        Alert.alert(
          'Gagal Mendapatkan No. Transaksi',
          'Response tidak mengandung no_tran valid. Lihat console untuk detail.'
        );
        throw new Error('Gagal mendapatkan no_tran dari PO Note');
      }

      let urut = 1;
      for (const item of cartItems) {
        const price = parseFloat(item.barang.h_anggota) || 0;
        const subtotal = price * item.quantity;

        const detailPayload: DetailPoNotePayload = {
          no_tran: Number(finalNoTran),
          NO_PO: finalNoTran,
          NO_URUT: urut.toString(),
          KD_BR: item.barang.kd_br,
          RASA: item.barang.ket || item.barang.jenis_produk || '',
          QTY: item.quantity,
          SAT: item.barang.satuan,
          harga: price,
          subtotal,
          kd: item.barang.kd,
          nama_br: item.barang.nama,
        };

        await createDetailPoNote(detailPayload);
        urut += 1;
      }

      setNoTran(finalNoTran); // Save the transaction number
      setIsOrdered(true);
      Alert.alert('Order Berhasil', 'Order Anda telah dicatat. Anda sekarang bisa mencetak PDF.');
    } catch (error) {
      console.error('Order error:', error);
      Alert.alert('Gagal Order', 'Terjadi kesalahan saat menyimpan order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintPDF = async () => {
    if (!isOrdered) {
      Alert.alert('Order Belum Dikonfirmasi', 'Silakan klik tombol Order terlebih dahulu');
      return;
    }

    // Generate PDF
    const orderDate = formatNowDdMmYyyy();
    const orderTime = formatTime24h();

    const total = calculateTotal();

    // Map cart items to PdfItem format
    const pdfItems: PdfItem[] = cartItems.map(item => ({
      nama: item.barang.nama,
      kd_br: item.barang.kd_br,
      satuan: item.barang.satuan,
      price: parseFloat(item.barang.h_anggota) || 0,
      quantity: item.quantity,
      subtotal: (parseFloat(item.barang.h_anggota) || 0) * item.quantity,
    }));

    const html = generateInvoiceHtml(
      user ? {
        name: user.name,
        username: user.username,
        storeName: user.storeName,
        kd_cus: user.kd_cus,
        email: user.email
      } : null,
      pdfItems,
      total,
      orderDate,
      orderTime,
      noTran // Pass transaction number to PDF
    );

    try {
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });

      // Share or download the PDF
      if (Platform.OS === 'web') {
        // Web: open in new tab
        window.open(uri, '_blank');
        Alert.alert('PDF Berhasil', 'PDF invoice telah dibuka di tab baru!');

        // Kosongkan keranjang dan reset state setelah print
        dispatch(clearCart());
        setIsOrdered(false);
      } else {
        // Android/iOS: share the PDF
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });

        // Kosongkan keranjang dan reset state setelah sharing
        dispatch(clearCart());
        setIsOrdered(false);
        Alert.alert('Berhasil', 'PDF Invoice telah berhasil dibuat dan dishare!');
      }
    } catch (error) {
      console.error('PDF error:', error);
      Alert.alert('Error', 'Gagal membuat PDF');
    }
  };

  const resetOrder = () => {
    setIsOrdered(false);
    setNoTran(null);
    dispatch(clearCart());
  };

  const handleAddFavorites = () => {
    let addedCount = 0;
    favoriteItems.forEach((fav: any) => {
      const existing = cartItems.find((item: any) => item.kd_br === fav.kd_br);
      if (!existing) {
        dispatch(addToCart({ barang: fav, quantity: 1 }));
        addedCount++;
      }
    });

    if (addedCount > 0) {
      Alert.alert('Sukses', `${addedCount} barang favorit ditambahkan ke keranjang`);
    } else {
      Alert.alert('Info', 'Semua barang favorit sudah ada di keranjang');
    }
  };


  const total = calculateTotal();

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Keranjang</Text>
      </View>

      {/* Add Favorites Button */}
      {favoriteItems.length > 0 && (
        <TouchableOpacity
          style={[styles.addFavoritesButton, { backgroundColor: cardBg, borderColor: headerBorder }]}
          onPress={handleAddFavorites}
        >
          <Ionicons name="heart" size={20} color="#E53935" style={{ marginRight: 8 }} />
          <Text style={[styles.addFavoritesText, { color: textColor }]}>Tambah Semua Favorit ke Keranjang</Text>
        </TouchableOpacity>
      )}

      {/* Cart Items */}
      {cartItems.length > 0 ? (
        <>
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.cartItemsSection}>
              <FlatList
                data={cartItems}
                renderItem={({ item }) => <CartItemRow item={item} />}
                keyExtractor={item => item.kd_br}
                scrollEnabled={false}
              />
            </View>
          </ScrollView>

          {/* Order Summary */}
          <View style={[styles.summarySection, { backgroundColor: cardBg, borderTopColor: isDark ? '#333' : '#ddd' }]}>

            {/* Delivery Date Selection */}
            <View style={[styles.summaryRow, { borderBottomWidth: 1, borderBottomColor: isDark ? '#333' : '#eee', paddingBottom: 15, marginBottom: 5 }]}>
              <Text style={[styles.totalLabelSmall, { color: textColor, fontSize: 13, fontWeight: '600' }]}>Tanggal Kirim</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.dateSelectorButton, { backgroundColor: isDark ? '#333' : '#e0e0e0' }]}>
                <Text style={[styles.dateSelectorText, { color: isDark ? '#FFD700' : '#FF9800' }]}>
                  {selectedDate
                    ? deliveryDates.find(d => d.value === selectedDate)?.label || formatDateDdMmYyyy(selectedDate)
                    : 'Pilih Tanggal'}{' '}
                  ▼
                </Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: isDark ? '#333' : '#ddd', borderTopWidth: 0 }]}>
              <Text style={[styles.totalLabel, { color: textColor }]}>Total</Text>
              <Text style={[styles.totalValue, { color: isDark ? '#FFD700' : '#FF9800' }]}>Rp {total.toLocaleString('id-ID')}</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={resetOrder}
              >
                <Text style={styles.clearButtonText}>Kosongkan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.orderButton}
                onPress={handleOrder}
                disabled={isSubmitting}
              >
                <Text style={styles.orderButtonText}>{isSubmitting ? '⏳ Menyimpan...' : '📋 Pesan'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pdfButton, !isOrdered && styles.pdfButtonDisabled]}
                onPress={handlePrintPDF}
                disabled={!isOrdered}
              >
                <Text style={[styles.pdfButtonText, !isOrdered && styles.pdfButtonTextDisabled]}>Print PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.emptyContainer, { backgroundColor: containerBg }]}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={[styles.emptyText, { color: textColor }]}>Keranjang kosong</Text>
        </View>
      )}

      {/* Date Picker Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={[styles.modalHeader, { borderBottomColor: headerBorder }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Pilih Tanggal Pengiriman</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={{ color: isDark ? '#FFD700' : '#FF9800', fontSize: 20, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={deliveryDates}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dateItem,
                    { borderBottomColor: headerBorder },
                    selectedDate === item.value && { backgroundColor: isDark ? '#333' : '#eee' }
                  ]}
                  onPress={() => {
                    setSelectedDate(item.value);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={[
                    styles.dateItemText,
                    { color: selectedDate === item.value ? (isDark ? '#FFD700' : '#FF9800') : textColor },
                    selectedDate === item.value && { fontWeight: 'bold' }
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
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
  cartItemsSection: {
    padding: 12,
  },
  cartItemCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cartItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cartItemIcon: {
    fontSize: 18,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 2,
  },
  cartItemCode: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 12,
  },
  cartItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
    fontWeight: '600',
  },
  controlsContainer: {
    alignItems: 'flex-end',
    gap: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 4,
    height: 30,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantityInput: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center',
    padding: 0,
    marginHorizontal: 4,
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabelSmall: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
  summarySection: {
    padding: 12,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentMethods: {
    display: 'none',
  },
  paymentButton: {
    display: 'none',
  },
  cashButton: {
    display: 'none',
  },
  onlineButton: {
    display: 'none',
  },
  paymentButtonText: {
    display: 'none',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pdfButton: {
    flex: 1,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pdfButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pdfButtonTextDisabled: {
    color: '#999',
  },
  placeOrderButton: {
    display: 'none',
  },
  placeOrderButtonText: {
    display: 'none',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
  dateSelectorButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dateSelectorText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 10,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dateItem: {
    padding: 14,
    borderBottomWidth: 1,
  },
  dateItemText: {
    fontSize: 13,
  },
  addFavoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  addFavoritesText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
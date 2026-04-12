import { useTheme } from '@/hooks/use-theme';
import { createDetailPoNote, createPoNote, DetailPoNotePayload, PoNotePayload } from '@/services/orderApi';
import { clearCart, removeFromCart, updateQuantity } from '@/store/cartSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ExploreScreen() {
  const dispatch = useAppDispatch();
  const { colorScheme } = useTheme();
  const cartItems = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user);
  const [isOrdered, setIsOrdered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  console.log("user", user);
  


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
      if (!isNaN(num) && num > 0) {
        handleUpdateQuantity(item.kd_br, num);
      }
    };

    const handleBlur = () => {
      const num = parseInt(inputValue);
      if (isNaN(num) || num <= 0) {
        setInputValue('1');
        handleUpdateQuantity(item.kd_br, 1);
      }
    };

    return (
      <View style={[styles.cartItemCard, { backgroundColor: cardBg }]}>
        <View style={styles.cartItemContent}>
          <Text style={styles.cartItemIcon}>📦</Text>
          <View style={styles.cartItemInfo}>
            <Text style={[styles.cartItemName, { color: textColor }]}>{item.barang.nama}</Text>
            <Text style={[styles.cartItemCode, { color: isDark ? '#FFD700' : '#FF9800' }]}>Kode: {item.barang.kd_br}</Text>
            <Text style={[styles.cartItemPrice, { color: textColor }]}>Rp {price.toLocaleString('id-ID')}</Text>
          </View>
        </View>
        <View style={styles.cartItemRight}>
          <View style={styles.quantityControl}>
            <TouchableOpacity 
              style={[styles.quantityButton, { backgroundColor: isDark ? '#333' : '#e5e5e5' }]}
              onPress={() => handleUpdateQuantity(item.kd_br, item.quantity - 1)}
            >
              <Text style={[styles.quantityButtonText, { color: textColor }]}>−</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.quantityInput, { color: textColor, backgroundColor: isDark ? '#1a1a1a' : '#ffffff', borderColor: isDark ? '#444' : '#ccc' }]}
              value={inputValue}
              onChangeText={handleQuantityChange}
              onBlur={handleBlur}
              keyboardType="numeric"
              selectTextOnFocus
            />
            <TouchableOpacity 
              style={[styles.quantityButton, { backgroundColor: isDark ? '#333' : '#e5e5e5' }]}
              onPress={() => handleUpdateQuantity(item.kd_br, item.quantity + 1)}
            >
              <Text style={[styles.quantityButtonText, { color: textColor }]}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.cartItemTotal, { color: textColor }]}>Rp {itemTotal.toLocaleString('id-ID')}</Text>
        </View>
      </View>
    );
  };

  const handleOrder = async () => {
    console.log("---handleOrder---");
    
    if (cartItems.length === 0) {
      Alert.alert('Keranjang Kosong', 'Silakan tambahkan barang terlebih dahulu');
      return;
    }
    if (!user?.kd_cus) {
      Alert.alert('Data Tidak Lengkap', 'Kode pelanggan tidak ditemukan. Silakan login ulang.');
      return;
    }
    console.log("---handleOrder 1---");
    
    const now = new Date();
    const pad2 = (value: number) => value.toString().padStart(2, '0');
    const tgl = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const jam = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

    const total = calculateTotal();
    console.log("---handleOrder 2---");

    const masterPayload: PoNotePayload = {
      tgl,
      kd_cus: user.kd_cus,
      jam,
      nama_admin: user.username || user.name || 'Admin',
      kpb: user.username || user.name || 'Admin',
      ket: '',
      status: 'PROSES ORDER',
      total_po: total,
      jenis: 'Anggota',
      items: cartItems,
    };
        console.log("---handleOrder 2---", masterPayload);

    setIsSubmitting(true);
    try {
      const poNoteRes = await createPoNote(masterPayload);
      console.log('PO Note response:', poNoteRes);
      
      console.log('PO Note response:', poNoteRes);

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
          RASA: item.barang.Ket || item.barang.jenis_produk || '',
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

      console.log('Order response:', { poNoteRes, no_tran: finalNoTran });
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
    const orderDate = new Date().toLocaleDateString('id-ID');
    const orderTime = new Date().toLocaleTimeString('id-ID');
    
    // Create HTML content for PDF
    let itemsHtml = '';
    cartItems.forEach((item, index) => {
      const price = parseFloat(item.barang.h_anggota) || 0;
      const subtotal = price * item.quantity;
      
      itemsHtml += `
        <div style="margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${index + 1}. ${item.barang.nama}</div>
          <div style="margin-left: 20px; font-size: 12px; line-height: 1.6;">
            <div>Kode: ${item.barang.kd_br}</div>
            <div>Satuan: ${item.barang.satuan}</div>
            <div>Harga: Rp ${price.toLocaleString('id-ID')}</div>
            <div>Qty: ${item.quantity}</div>
            <div style="font-weight: bold; margin-top: 5px;">Subtotal: Rp ${subtotal.toLocaleString('id-ID')}</div>
          </div>
        </div>
      `;
    });
    
    const total = calculateTotal();
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              line-height: 1.4;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .date-info {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-top: 20px;
              margin-bottom: 15px;
            }
            .total {
              margin-top: 20px;
              padding-top: 15px;
              border-top: 3px solid #000;
              font-size: 18px;
              font-weight: bold;
              text-align: right;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #000;
              font-style: italic;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">INVOICE PESANAN</div>
            <div class="date-info">
              <div>Tanggal: ${orderDate}</div>
              <div>Waktu: ${orderTime}</div>
            </div>
          </div>
          
          <div class="section-title">DETAIL BARANG</div>
          ${itemsHtml}
          
          <div class="total">
            TOTAL: Rp ${total.toLocaleString('id-ID')}
          </div>
          
          <div class="footer">
            Terima kasih telah berbelanja!
          </div>
        </body>
      </html>
    `;

    try {
      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Share or download the PDF
      if (Platform.OS === 'web') {
        // Web: open in new tab
        window.open(uri, '_blank');
        Alert.alert('PDF Berhasil', 'PDF invoice telah dibuka di tab baru!');
      } else {
        // Android/iOS: share the PDF
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
        });
        Alert.alert('Berhasil', 'PDF Invoice telah berhasil dibuat dan dishare!');
      }
    } catch (error) {
      console.error('PDF error:', error);
      Alert.alert('Error', 'Gagal membuat PDF');
    }
  };

  const resetOrder = () => {
    setIsOrdered(false);
    dispatch(clearCart());
  };


  const total = calculateTotal();

  return (
    <View style={[styles.container, { backgroundColor: containerBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>🛒 Keranjang</Text>
      </View>

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
            <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: isDark ? '#333' : '#ddd' }]}>
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
                <Text style={[styles.pdfButtonText, !isOrdered && styles.pdfButtonTextDisabled]}>� Print PDF</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#242424',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
  cartItemsSection: {
    padding: 12,
  },
  cartItemCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cartItemIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
    flexWrap: 'wrap',
  },
  cartItemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  cartItemCode: {
    fontSize: 11,
    marginBottom: 2,
  },
  cartItemPrice: {
    fontSize: 12,
  },
  cartItemRight: {
    alignItems: 'flex-end',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  quantityButton: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  quantityButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  quantityInput: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 35,
    width: 35,
    height: 28,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  cartItemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summarySection: {
    padding: 16,
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
    fontSize: 16,
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  pdfButton: {
    flex: 1,
    backgroundColor: '#0066FF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pdfButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 14,
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
});
import { formatDateDdMmYyyy } from '@/utils/dateDisplay';

export interface PdfItem {
  nama: string;
  kd_br: string;
  satuan: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface PdfUser {
  name: string;
  username?: string;
  storeName?: string;
  kd_cus: string;
  email?: string;
}

/**
 * Mendapatkan template HTML untuk invoice PDF yang konsisten
 */
export const generateInvoiceHtml = (
  user: PdfUser | null,
  items: PdfItem[],
  total: number,
  orderDate: string,
  orderTime: string,
  noTran?: string | null
): string => {
  let itemsHtml = '';
  items.forEach((item, index) => {
    itemsHtml += `
      <div style="margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 15px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${index + 1}. ${item.nama}</div>
        <div style="margin-left: 20px; font-size: 12px; line-height: 1.6;">
          <div>Kode: ${item.kd_br}</div>
          <div>Satuan: ${item.satuan}</div>
          <div>Harga: Rp ${item.price.toLocaleString('id-ID')}</div>
          <div>Qty: ${item.quantity}</div>
          <div style="font-weight: bold; margin-top: 5px;">Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}</div>
        </div>
      </div>
    `;
  });

  return `
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
            margin-bottom: 5px;
          }
          .no-tran {
            font-size: 16px;
            font-weight: bold;
            color: #E53935;
            margin-bottom: 10px;
          }
          .date-info {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
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
          ${noTran ? `<div class="no-tran">No. Transaksi: ${noTran}</div>` : ''}
          <div class="date-info">
            <div>Tanggal: ${formatDateDdMmYyyy(orderDate)}</div>
            <div>Waktu: ${orderTime}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 12px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 6px;">
          <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 6px;">INFORMASI PEMESAN</div>
          <div style="font-size: 12px; line-height: 1.8;">
            <div><strong>Nama:</strong> ${user?.name || user?.username || '-'}</div>
            <div><strong>Toko:</strong> ${user?.storeName || '-'}</div>
            <div><strong>Kode Pelanggan:</strong> ${user?.kd_cus || '-'}</div>
            <div><strong>Email:</strong> ${user?.email || '-'}</div>
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
};

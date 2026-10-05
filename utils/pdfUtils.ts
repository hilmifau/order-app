import { formatDateDdMmYyyy } from '@/utils/dateDisplay';

export const COMPANY_NAME = 'K-NAR PD AREN';
export const COMPANY_SUB = 'PD AREN';

export interface PdfItem {
  nama: string;
  kd_br: string;
  satuan: string;
  price: number;
  quantity: number;
  subtotal: number;
  ket?: string;
  c?: string;
}

export interface PdfUser {
  name: string;
  username?: string;
  storeName?: string;
  kd_cus: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface InvoiceMeta {
  title?: string;
  operator?: string;
  jenisTran?: string;
  target?: string;
  tAkhirB?: string;
  status?: string;
}

const SATUAN = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
  'sepuluh',
  'sebelas',
];

function terbilangBelowThousand(n: number): string {
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rest = n % 10;
    return rest ? `${SATUAN[tens]} puluh ${SATUAN[rest]}` : `${SATUAN[tens]} puluh`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = hundreds === 1 ? 'seratus' : `${SATUAN[hundreds]} ratus`;
  return rest ? `${head} ${terbilangBelowThousand(rest)}` : head;
}

/** Angka ke terbilang Indonesia, contoh: 24519105 → "Dua Puluh Empat Juta ..." */
export function terbilangId(value: number): string {
  const n = Math.round(Math.abs(Number(value) || 0));
  if (n === 0) return 'Nol Rupiah';

  const parts: string[] = [];
  const milyar = Math.floor(n / 1_000_000_000);
  const juta = Math.floor((n % 1_000_000_000) / 1_000_000);
  const ribu = Math.floor((n % 1_000_000) / 1000);
  const sisa = n % 1000;

  if (milyar) {
    parts.push(milyar === 1 ? 'satu milyar' : `${terbilangBelowThousand(milyar)} milyar`);
  }
  if (juta) parts.push(`${terbilangBelowThousand(juta)} juta`);
  if (ribu) {
    parts.push(ribu === 1 ? 'seribu' : `${terbilangBelowThousand(ribu)} ribu`);
  }
  if (sisa) parts.push(terbilangBelowThousand(sisa));

  const words = parts
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
  return `${words} Rupiah`;
}

export function formatIdNumber(value: number): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString('id-ID');
}

export function qtyBySatuan(items: PdfItem[]): { sat: string; qty: number }[] {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const sat = String(item.satuan || '-').trim().toUpperCase() || '-';
    map.set(sat, (map.get(sat) || 0) + Number(item.quantity || 0));
  });
  return Array.from(map.entries())
    .map(([sat, qty]) => ({ sat, qty }))
    .sort((a, b) => b.qty - a.qty);
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dash(value: string | number | null | undefined): string {
  const s = String(value ?? '').trim();
  return s ? escapeHtml(s) : '-';
}

/**
 * Template HTML Detail PO — layout mengikuti PDF asli, judul dokumen DETAIL PO.
 */
export const generateInvoiceHtml = (
  user: PdfUser | null,
  items: PdfItem[],
  total: number,
  orderDate: string,
  orderTime: string,
  noTran?: string | null,
  meta?: InvoiceMeta
): string => {
  const docTitle = (meta?.title || 'DETAIL PO').trim() || 'DETAIL PO';
  const kepada = user?.storeName || user?.name || user?.username || '-';
  const operator = meta?.operator || user?.username || user?.name || '-';
  const jenisTran = meta?.jenisTran || '-';
  const alamat = user?.address || '-';
  const noTelp = user?.phone || '-';
  const noReg = user?.kd_cus || '-';
  const tAkhirB = meta?.tAkhirB ? formatDateDdMmYyyy(meta.tAkhirB) : '-';
  const rows = items
    .map((item, index) => {
      const qtySat = `${item.quantity} ${item.satuan || ''}`.trim();
      return `
        <tr>
          <td class="col-no">${index + 1}</td>
          <td class="col-nama">${escapeHtml(item.nama)}</td>
          <td class="col-qty">${escapeHtml(qtySat)}</td>
          <td class="col-c">${escapeHtml(item.c || 'O')}</td>
          <td class="col-ket">${escapeHtml(item.ket || '')}</td>
          <td class="col-num">${formatIdNumber(item.price)}</td>
          <td class="col-num">${formatIdNumber(item.subtotal)}</td>
        </tr>`;
    })
    .join('');

  const qtyLine = qtyBySatuan(items)
    .map(({ sat, qty }) => `Tot Qty ${escapeHtml(sat)} : <b>${formatIdNumber(qty)}</b>`)
    .join('&nbsp;&nbsp;&nbsp;&nbsp;');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 8mm; }
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            color: #000;
            margin: 0;
            padding: 12px;
            line-height: 1.25;
          }
          .top { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
          .brand { font-weight: bold; font-size: 13px; }
          .brand-sub { font-size: 11px; }
          .bismillah { text-align: center; font-size: 11px; margin-bottom: 2px; }
          .doc-title { text-align: center; font-size: 16px; font-weight: bold; letter-spacing: 0.5px; }
          .meta {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 6px;
            font-size: 10px;
          }
          .meta td { padding: 1px 4px 1px 0; vertical-align: top; }
          .meta .lbl { width: 72px; white-space: nowrap; }
          .meta .colon { width: 8px; }
          .meta .val { width: 38%; }
          table.items {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          table.items th {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 3px 3px;
            font-weight: bold;
            text-align: left;
          }
          table.items th.col-num { text-align: right; }
          table.items td {
            border-bottom: 0.4px solid #333;
            padding: 2px 3px;
            vertical-align: top;
          }
          .col-no { width: 6%; text-align: right; }
          .col-nama { width: 44%; }
          .col-qty { width: 12%; white-space: nowrap; }
          .col-c { width: 5%; text-align: center; }
          .col-ket { width: 7%; text-align: center; }
          .col-num { width: 13%; text-align: right; white-space: nowrap; }
          .qty-line { margin-top: 8px; font-size: 10px; }
          .summary-wrap { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .warn {
            font-size: 9px;
            font-weight: bold;
            width: 55%;
            vertical-align: top;
            padding-right: 12px;
          }
          .summary {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .summary td { padding: 1px 0; }
          .summary .s-lbl { width: 55%; }
          .summary .s-colon { width: 8%; }
          .summary .s-val { text-align: right; font-weight: bold; }
          .summary .line td { border-top: 1px solid #000; padding-top: 3px; }
          .terbilang { margin-top: 8px; font-size: 10px; }
          .sign {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
            text-align: center;
            font-size: 10px;
          }
          .sign td { width: 25%; padding: 0 6px; }
          .sign .line {
            border-top: 1px solid #000;
            margin-top: 36px;
            padding-top: 3px;
          }
        </style>
      </head>
      <body>
        <table class="top">
          <tr>
            <td style="width:28%; vertical-align:top;">
              <div class="brand">${COMPANY_NAME}</div>
              <div class="brand-sub">${COMPANY_SUB}</div>
            </td>
            <td style="text-align:center; vertical-align:top;">
              <div class="bismillah">Bismillahirrohmaanirrohim</div>
              <div class="doc-title">${escapeHtml(docTitle)}</div>
            </td>
            <td style="width:18%;"></td>
          </tr>
        </table>

        <table class="meta">
          <tr>
            <td class="lbl">Operator</td><td class="colon">:</td><td class="val">${dash(operator)}</td>
            <td class="lbl">Tanggal</td><td class="colon">:</td><td class="val">${dash(formatDateDdMmYyyy(orderDate))}</td>
          </tr>
          <tr>
            <td class="lbl">No Faktur</td><td class="colon">:</td><td class="val">${dash(noTran)}</td>
            <td class="lbl">Kepada Yth</td><td class="colon">:</td><td class="val">${dash(kepada)}</td>
          </tr>
          <tr>
            <td class="lbl">Jam</td><td class="colon">:</td><td class="val">${dash(orderTime)}</td>
            <td class="lbl">No. Reg</td><td class="colon">:</td><td class="val">${dash(noReg)}</td>
          </tr>
          <tr>
            <td class="lbl">Jenis Tran</td><td class="colon">:</td><td class="val">${dash(jenisTran)}</td>
            <td class="lbl">No Telp</td><td class="colon">:</td><td class="val">${dash(noTelp)}</td>
          </tr>
          <tr>
            <td class="lbl">Alamat</td><td class="colon">:</td><td class="val">${dash(alamat)}</td>
            <td class="lbl">T Akhir B</td><td class="colon">:</td><td class="val">${dash(tAkhirB)}</td>
          </tr>
        </table>

        <table class="items">
          <thead>
            <tr>
              <th class="col-no">No.</th>
              <th class="col-nama">Nama Barang</th>
              <th class="col-qty">Qty Sat</th>
              <th class="col-c">C</th>
              <th class="col-ket">KET</th>
              <th class="col-num">Harga</th>
              <th class="col-num">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="7">Tidak ada barang.</td></tr>'}
          </tbody>
        </table>

        <div class="qty-line">${qtyLine}</div>

        <table class="summary-wrap">
          <tr>
            <td class="warn">
              KARYAWAN DILARANG MEMINTA DAN MENERIMA DARI<br/>
              PELANGGAN DALAM BENTUK APAPUN.
            </td>
            <td style="width:42%; vertical-align:top;">
              <table class="summary">
                <tr>
                  <td class="s-lbl">Grand Total</td><td class="s-colon">:</td>
                  <td class="s-val">${formatIdNumber(total)}</td>
                </tr>
                <tr class="line">
                  <td class="s-lbl">Total Trans</td><td class="s-colon">:</td>
                  <td class="s-val">${formatIdNumber(total)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <div class="terbilang"><b>Terbilang :</b> ${escapeHtml(terbilangId(total))}</div>

        <table class="sign">
          <tr>
            <td>Diperiksa Oleh</td>
            <td>Dikirim Oleh</td>
            <td>Pelanggan</td>
            <td>Kasir</td>
          </tr>
          <tr>
            <td><div class="line">&nbsp;</div></td>
            <td><div class="line">&nbsp;</div></td>
            <td><div class="line">${dash(kepada)}</div></td>
            <td><div class="line">${dash(operator)}</div></td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

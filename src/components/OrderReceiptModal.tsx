import React, { useRef } from 'react';
import { Printer, Download, X, CheckCircle2, ShieldCheck, Phone, MapPin, Building, Calendar, Hash } from 'lucide-react';
import { CustomerOrder } from '../types';
import { useShop } from '../context/ShopContext';

export interface OrderReceiptModalProps {
  order: CustomerOrder;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  const { storeSettings, formatPrice } = useShop();
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printableRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${order.order_number} - Cyber Dynamic Technologies</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 24px;
            }
            .receipt-box {
              max-width: 680px;
              margin: 0 auto;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 28px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .logo-title {
              font-size: 20px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: -0.5px;
            }
            .meta-text {
              font-size: 11px;
              color: #64748b;
              line-height: 1.4;
            }
            .badge {
              display: inline-block;
              padding: 4px 8px;
              background: #ecfeff;
              color: #0e7490;
              border: 1px solid #cffafe;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 12px;
            }
            th {
              text-align: left;
              padding: 8px 10px;
              background: #f8fafc;
              border-bottom: 1px solid #cbd5e1;
              color: #334155;
              font-weight: 700;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #f1f5f9;
            }
            .totals-row {
              display: flex;
              justify-content: flex-end;
              margin-top: 10px;
            }
            .totals-table {
              width: 260px;
              font-size: 12px;
            }
            .totals-table td {
              padding: 4px 8px;
              border: none;
            }
            .total-final {
              font-size: 15px;
              font-weight: 900;
              color: #0891b2;
              border-top: 1px solid #cbd5e1 !important;
              padding-top: 8px !important;
            }
            .stamp {
              margin-top: 24px;
              border: 2px dashed #0891b2;
              padding: 12px;
              border-radius: 8px;
              text-align: center;
              font-size: 11px;
              color: #0e7490;
              background: #f0fdfa;
            }
            @media print {
              body { padding: 0; }
              .receipt-box { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadHtml = () => {
    const printContent = printableRef.current;
    if (!printContent) return;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt_${order.order_number}.html</title>
  <style>
    body { font-family: sans-serif; padding: 20px; color: #1e293b; }
    .box { max-width: 650px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 24px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="box">${printContent.innerHTML}</div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CyberDynamicTech_Receipt_${order.order_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formattedDate = new Date(order.date_created).toLocaleString('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold tracking-tight">Official Order Tax Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadHtml}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download Receipt file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="p-6 overflow-y-auto bg-slate-50/50">
          <div
            ref={printableRef}
            id="official-printable-receipt"
            className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 text-slate-900"
          >
            {/* Header / Brand Details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <img
                    src={storeSettings.logo_url || '/logo.png'}
                    alt="Cyber Dynamic Technologies"
                    className="h-9 w-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                    Cyber Dynamic Technologies
                  </h2>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Technology • Solutions • Growth
                </p>
                <p className="text-[10px] text-slate-500">
                  Kampala Road • Central Business District, Kampala, Uganda
                </p>
                <p className="text-[10px] text-slate-500">
                  Tel: +256 779 743 101 / +256 701 000 000 • TIN: 1004829182
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="inline-block px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-black uppercase tracking-wider">
                  Official Commercial Invoice
                </span>
                <p className="text-xs font-mono font-black text-slate-800">
                  Receipt #{order.order_number}
                </p>
                {order.woocommerce_order_id && (
                  <p className="text-[10px] text-emerald-700 font-mono font-bold">
                    WooCommerce ID: #{order.woocommerce_order_id}
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  Issued: {formattedDate}
                </p>
              </div>
            </div>

            {/* Customer & Delivery Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div>
                <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                  Customer Information
                </p>
                <p className="font-bold text-slate-900">
                  {order.billing.first_name} {order.billing.last_name}
                </p>
                {order.billing.email && (
                  <p className="text-slate-600 text-[11px]">{order.billing.email}</p>
                )}
                <p className="text-slate-600 text-[11px]">
                  Payment: {order.payment_method_title}
                </p>
                <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                  Status:{' '}
                  <span className="text-cyan-700 uppercase font-black">
                    {order.status}
                  </span>
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1">
                  Destination / Delivery
                </p>
                <p className="font-bold text-slate-900">
                  {order.shipping.address_1}
                </p>
                <p className="text-slate-600 text-[11px]">
                  {order.shipping.district || 'Kampala'}, Uganda
                </p>
                <p className="text-slate-600 text-[11px]">
                  Zone: {order.delivery_zone}
                </p>
                {order.customer_note && (
                  <p className="text-[10px] text-slate-500 italic mt-0.5">
                    Note: "{order.customer_note}"
                  </p>
                )}
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-2 px-1">Item Description</th>
                    <th className="py-2 px-2 text-center">Qty</th>
                    <th className="py-2 px-2 text-right">Unit Price</th>
                    <th className="py-2 px-2 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.line_items.map((item, idx) => {
                    const unitPrice = Math.round(item.total / (item.quantity || 1));
                    return (
                      <tr key={idx}>
                        <td className="py-2.5 px-1">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Item #{item.product_id} • 1-Year Distributor Warranty
                          </p>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-2 text-right font-medium text-slate-600">
                          {formatPrice(unitPrice)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-slate-900">
                          {formatPrice(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end pt-2 border-t border-slate-200">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatPrice(order.subtotal || order.total)}</span>
                </div>
                {order.discount_total > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount ({order.coupon_code || 'Promo'}):</span>
                    <span>-{formatPrice(order.discount_total)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery ({order.delivery_zone}):</span>
                  <span>
                    {order.shipping_total === 0 ? 'FREE' : formatPrice(order.shipping_total)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2">
                  <span>Total Due / Paid:</span>
                  <span className="text-cyan-700">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Verification & Official Stamp */}
            <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200/80 flex items-center justify-between gap-4 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-cyan-900 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                  <span>Verified Cyber Dynamic Technologies Genuine Guarantee</span>
                </div>
                <p className="text-[10px] text-cyan-800">
                  All equipment carries valid serial verification & 12 months comprehensive hardware replacement warranty.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="px-2 py-1 rounded bg-white text-cyan-800 font-mono font-black text-[10px] border border-cyan-200 uppercase">
                  DISPATCH KAMPALA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Retain this receipt for warranty claims & doorstep verification.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

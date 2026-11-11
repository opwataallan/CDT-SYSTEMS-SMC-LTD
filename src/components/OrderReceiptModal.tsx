import React, { useRef } from 'react';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  ShieldCheck,
  Phone,
  MapPin,
  Building,
  Calendar,
  Hash,
  ExternalLink,
  Clock,
  AlertCircle,
  CreditCard,
  FileText,
  DollarSign,
} from 'lucide-react';
import { CustomerOrder } from '../types';
import { useShop } from '../context/ShopContext';

export interface OrderReceiptModalProps {
  order: CustomerOrder;
  onClose: () => void;
  forceType?: 'receipt' | 'invoice';
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  onClose,
  forceType,
}) => {
  const { storeSettings, formatPrice } = useShop();
  const printableRef = useRef<HTMLDivElement>(null);

  // Determine if this order is considered PAID or UNPAID
  const isPaid =
    forceType === 'receipt'
      ? true
      : forceType === 'invoice'
      ? false
      : order.payment_status === 'paid' ||
        order.paymentStatus === 'paid' ||
        order.status === 'completed' ||
        order.status === 'delivered' ||
        (order.status === 'processing' && order.payment_submitted);

  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

  const docTitle = isPaid
    ? 'Official Payment Receipt'
    : isCancelled
    ? 'Cancelled Order Statement'
    : 'Commercial Tax Invoice';

  const docNumber = isPaid
    ? `RCP-${order.order_number}`
    : `INV-${order.order_number}`;

  const formattedDate = new Date(order.date_created || Date.now()).toLocaleString('en-UG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const paymentDate = order.payment_confirmed_at
    ? new Date(order.payment_confirmed_at).toLocaleString('en-UG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : order.payment_submitted_at
    ? new Date(order.payment_submitted_at).toLocaleString('en-UG', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : formattedDate;

  // Print handler - opens clean print dialog for printing or saving as PDF
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
          <meta charset="utf-8" />
          <title>${docTitle} - ${order.order_number}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #fff;
              margin: 0;
              padding: 10px;
              font-size: 12px;
            }
            .document-box {
              max-width: 720px;
              margin: 0 auto;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
              padding: 24px;
            }
            .badge-paid {
              display: inline-block;
              padding: 4px 10px;
              background: #ecfdf5;
              color: #047857;
              border: 1px solid #a7f3d0;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
            }
            .badge-unpaid {
              display: inline-block;
              padding: 4px 10px;
              background: #fffbeb;
              color: #b45309;
              border: 1px solid #fde68a;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 11px;
            }
            th {
              text-align: left;
              padding: 8px 10px;
              background: #f8fafc;
              border-bottom: 2px solid #cbd5e1;
              color: #334155;
              font-weight: 700;
            }
            td {
              padding: 9px 10px;
              border-bottom: 1px solid #f1f5f9;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .totals-container {
              display: flex;
              justify-content: flex-end;
              margin-top: 12px;
            }
            .totals-box {
              width: 280px;
              font-size: 12px;
            }
            .total-final {
              font-size: 15px;
              font-weight: 900;
              color: ${isPaid ? '#047857' : '#0891b2'};
              border-top: 2px solid #0f172a;
              padding-top: 8px;
            }
            .stamp-box {
              margin-top: 24px;
              padding: 14px;
              border-radius: 8px;
              border: 2px dashed ${isPaid ? '#059669' : '#d97706'};
              background: ${isPaid ? '#f0fdf4' : '#fffbeb'};
              color: ${isPaid ? '#065f46' : '#92400e'};
            }
            @media print {
              body { padding: 0; }
              .document-box { border: none; padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="document-box">
            ${printContent.innerHTML}
          </div>
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

  // Download HTML file handler
  const handleDownload = () => {
    const printContent = printableRef.current;
    if (!printContent) return;

    const filePrefix = isPaid ? 'Receipt' : 'Invoice';
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${docTitle} - ${order.order_number} - Cyber Dynamic Technologies</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      padding: 30px 15px;
      margin: 0;
    }
    .wrapper {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    table { width: 100%; border-collapse: collapse; margin: 18px 0; }
    th { text-align: left; padding: 8px 10px; background: #f8fafc; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
    td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
    .badge-paid { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-unpaid { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
  </style>
</head>
<body>
  <div class="wrapper">
    ${printContent.innerHTML}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CyberDynamicTech_${filePrefix}_${order.order_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const customerFirstName =
    order.billing?.first_name ||
    order.shipping?.first_name ||
    (typeof (order as any).customerName === 'string'
      ? (order as any).customerName.split(' ')[0]
      : '') ||
    'Valued';

  const customerLastName =
    order.billing?.last_name ||
    order.shipping?.last_name ||
    (typeof (order as any).customerName === 'string'
      ? (order as any).customerName.split(' ').slice(1).join(' ')
      : '') ||
    'Customer';

  const customerEmail =
    order.billing?.email ||
    order.shipping?.email ||
    (order as any).customerEmail ||
    '';

  const customerPhone =
    order.billing?.phone ||
    order.shipping?.phone ||
    (order as any).customerPhone ||
    '';

  const deliveryAddress =
    order.shipping?.address_1 ||
    order.billing?.address_1 ||
    (order as any).deliveryAddress ||
    'Plot 14 Kampala Road / City Central Delivery';

  const deliveryZone =
    order.delivery_zone ||
    order.shipping?.district ||
    order.billing?.district ||
    'Kampala Central';

  const calculatedSubtotal =
    order.subtotal ||
    (order.total - (order.shipping_total || 0) + (order.discount_total || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-4 flex flex-col max-h-[94vh]">
        {/* Top Header Bar */}
        <div className={`flex items-center justify-between px-5 py-3.5 text-white ${
          isPaid ? 'bg-emerald-950 border-b border-emerald-900' : 'bg-slate-900 border-b border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            {isPaid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <FileText className="w-4 h-4 text-cyan-400" />
            )}
            <span className="text-xs font-black tracking-tight uppercase">
              {docTitle} • {order.order_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPaid ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-cyan-600 hover:bg-cyan-500'
              }`}
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={`Download ${isPaid ? 'Receipt' : 'Invoice'} HTML file`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {isPaid ? 'Receipt' : 'Invoice'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50/60">
          <div
            ref={printableRef}
            id="official-cdt-document"
            className="bg-white p-5 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 text-slate-900"
          >
            {/* Header: Brand Details & Document Type Badge */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-cyan-400 font-black flex items-center justify-center text-sm tracking-tighter">
                    CDT
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                      Cyber Dynamic Technologies
                    </h2>
                    <p className="text-[10px] text-cyan-700 font-bold uppercase tracking-wider">
                      Uganda • East Africa
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 mt-2 space-y-0.5 leading-relaxed">
                  <p className="font-semibold text-slate-800">
                    Plot 14 Kampala Road, Commercial Plaza • Central Division, Kampala, Uganda
                  </p>
                  <p>
                    Tel: <strong>+256 779 743 101</strong> / <strong>+256 701 000 000</strong> • Web: <strong>www.cyberdynamictech.com</strong>
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    URA Tax Identification Number (TIN): <strong>1004829182</strong> • Reg: <strong>800200031920</strong>
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1.5 shrink-0">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>PAID IN FULL</span>
                  </span>
                ) : isCancelled ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-rose-100 text-rose-900 border border-rose-300 text-xs font-black uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-700" />
                    <span>CANCELLED</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>PAYMENT DUE / UNPAID</span>
                  </span>
                )}

                <p className="text-xs font-mono font-black text-slate-900">
                  {docNumber}
                </p>
                <p className="text-[10px] text-slate-500">
                  Order Ref: <strong>#{order.order_number}</strong>
                </p>
                {order.woocommerce_order_id && (
                  <p className="text-[10px] text-purple-700 font-mono font-bold">
                    WooCommerce Live ID: #{order.woocommerce_order_id}
                  </p>
                )}
                <p className="text-[10px] text-slate-500">
                  Date Issued: {formattedDate}
                </p>
                {isPaid && (
                  <p className="text-[10px] text-emerald-800 font-semibold">
                    Paid On: {paymentDate}
                  </p>
                )}
              </div>
            </div>

            {/* Customer & Billing / Shipping Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <span>Customer Details</span>
                </p>
                <p className="font-black text-slate-900 text-sm">
                  {customerFirstName} {customerLastName}
                </p>
                {customerEmail && (
                  <p className="text-slate-600 text-[11px] mt-0.5">{customerEmail}</p>
                )}
                {customerPhone && (
                  <p className="text-slate-600 text-[11px] font-mono">{customerPhone}</p>
                )}
                <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-0.5">
                  <p className="text-[11px] text-slate-600">
                    Payment Channel: <strong>{order.payment_method_title || order.payment_method || 'Mobile Money / Card'}</strong>
                  </p>
                  {order.payment_details?.transaction_ref && (
                    <p className="text-[10px] font-mono text-slate-700 font-bold">
                      Txn Ref: {order.payment_details.transaction_ref}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-500 text-[10px] uppercase tracking-wider mb-1.5">
                  Delivery Destination
                </p>
                <p className="font-bold text-slate-900">{deliveryAddress}</p>
                <p className="text-slate-600 text-[11px]">{deliveryZone}, Uganda</p>
                <div className="mt-2 pt-2 border-t border-slate-200/80 space-y-0.5">
                  <p className="text-[11px] text-slate-600">
                    Courier Service: <strong>{order.shipping_provider || 'Cyber Dynamic Regional Express'}</strong>
                  </p>
                  {order.tracking_number && (
                    <p className="text-[10px] font-mono text-cyan-800 font-bold">
                      Tracking No: {order.tracking_number}
                    </p>
                  )}
                  {order.customer_note && (
                    <p className="text-[10px] text-slate-500 italic">
                      Note: "{order.customer_note}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-600 font-bold uppercase text-[10px] bg-slate-50">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.line_items.map((item, idx) => {
                    const unitPrice =
                      item.price ||
                      Math.round(item.total / (item.quantity || 1)) ||
                      0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="text-[10px] text-slate-500">
                            Product ID #{item.product_id}
                            {item.sku ? ` • SKU: ${item.sku}` : ''} • 12-Month Replacement Warranty
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 font-mono font-medium">
                          {formatPrice(unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          {formatPrice(item.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals & Financial Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t-2 border-slate-200">
              {/* Payment Instructions if UNPAID */}
              {!isPaid && !isCancelled ? (
                <div className="flex-1 bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                    <CreditCard className="w-4 h-4 text-amber-700" />
                    <span>Official Payment Instructions</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-amber-900 leading-relaxed">
                    <p>
                      <strong>1. MTN Mobile Money:</strong> Dial <code>*165*3#</code> or send to <strong>0394760459</strong> / <strong>+256 779 743 101</strong> (OPWATA ALLAN SAMUEL - CDT).
                    </p>
                    <p>
                      <strong>2. Airtel Money:</strong> Send to <strong>+256 701 000 000</strong>.
                    </p>
                    <p>
                      <strong>3. Bank Wire / EFT:</strong> Stanbic Bank Uganda, Kampala Road Branch (A/C: <strong>9030018294819</strong> - Cyber Dynamic Tech).
                    </p>
                    <p>
                      <strong>4. Cash on Delivery:</strong> Available for Kampala Central, Nakawa, Rubaga & Entebbe upon doorstep delivery.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Official Quality Guarantee:</p>
                  <p>
                    All equipment sold by Cyber Dynamic Technologies is 100% genuine and verified. Please retain this receipt for hardware warranty, technical servicing, and returns within 14 business days.
                  </p>
                </div>
              )}

              {/* Totals Box */}
              <div className="w-full sm:w-72 space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold font-mono">{formatPrice(calculatedSubtotal)}</span>
                </div>

                {order.discount_total > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({order.coupon_code || 'Promo'}):</span>
                    <span className="font-mono">-{formatPrice(order.discount_total)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Delivery ({deliveryZone}):</span>
                  <span className="font-semibold font-mono">
                    {order.shipping_total === 0 ? 'FREE' : formatPrice(order.shipping_total)}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-1.5">
                  <span>Included Tax / VAT (18%):</span>
                  <span className="font-mono">
                    {formatPrice(Math.round(order.total * 0.18 / 1.18))}
                  </span>
                </div>

                <div className="flex justify-between text-sm font-black text-slate-900 border-t-2 border-slate-900 pt-2">
                  <span>{isPaid ? 'Total Paid:' : 'Total Amount Due:'}</span>
                  <span className={`font-mono text-base ${isPaid ? 'text-emerald-700' : 'text-cyan-700'}`}>
                    {formatPrice(order.total)}
                  </span>
                </div>

                {isPaid && (
                  <div className="flex justify-between text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <span>Balance Outstanding:</span>
                    <span className="font-mono">UGX 0</span>
                  </div>
                )}
              </div>
            </div>

            {/* Official Stamp & Verification Block */}
            <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
              isPaid
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/70 border-amber-300 text-amber-950'
            }`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className={`w-5 h-5 shrink-0 ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`} />
                <div>
                  <strong className="block text-xs">
                    {isPaid
                      ? 'Verified Payment & Doorstep Dispatch Clearance'
                      : 'Proforma Invoice Awaiting Payment Settlement'}
                  </strong>
                  <p className="text-[10px] text-slate-600">
                    Cyber Dynamic Technologies Logistics & Customer Relations Division • Plot 14 Kampala Road
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`px-2.5 py-1 rounded font-mono font-black text-[10px] border uppercase ${
                  isPaid
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-amber-600 text-white border-amber-700'
                }`}>
                  {isPaid ? 'OFFICIAL RECEIPT SEAL' : 'INVOICE COPY'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="text-[11px] text-slate-500">
            {isPaid
              ? 'Present this receipt upon courier delivery for warranty validation.'
              : 'Complete payment via MTN MoMo or Airtel to initiate immediate dispatch.'}
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className={`flex-1 sm:flex-initial px-4 py-2 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isPaid ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {isPaid ? 'Receipt' : 'Invoice'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save File</span>
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

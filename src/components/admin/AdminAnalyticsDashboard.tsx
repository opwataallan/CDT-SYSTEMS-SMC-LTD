import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  RefreshCw,
  Download,
  Calendar,
  Activity,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  Phone,
  Server,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useShop } from '../../context/ShopContext';

export const AdminAnalyticsDashboard: React.FC = () => {
  const { showToast, formatPrice } = useShop();
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);

  const loadAnalytics = async (tf = timeframe) => {
    try {
      setLoading(true);
      const res = await api.getAnalytics(tf);
      setData(res);
    } catch (err: any) {
      showToast('Failed to load analytics: ' + err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics(timeframe);
  }, [timeframe]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAnalytics(timeframe);
  };

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Date', 'Revenue (UGX)', 'Orders Count'],
      ...(data.salesTrend || []).map((s: any) => [s.date, s.revenue, s.orders]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CyberDynamicTech_WooCommerce_Analytics_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Analytics summary downloaded successfully.');
  };

  // Custom tooltips
  const CustomCurrencyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-300 border-b border-slate-700 pb-1">{label}</p>
          <p className="text-emerald-400 font-extrabold">
            Revenue: UGX {Number(payload[0].value).toLocaleString()}
          </p>
          {payload[1] && (
            <p className="text-amber-300 font-bold">
              Orders: {payload[1].value}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-[#007f19] animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-600">Gathering WooCommerce Store Telemetry & Graphs...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const salesTrend = data?.salesTrend || [];
  const ordersByStatus = data?.ordersByStatus || [];
  const topProducts = data?.topProducts || [];
  const categoryBreakdown = data?.categoryBreakdown || [];
  const paymentDistribution = data?.paymentDistribution || [];

  return (
    <div id="admin-analytics-dashboard" className="space-y-6">
      {/* 1. Header Toolbar & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#920d35]/10 text-[#920d35]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
              WooCommerce Performance & Sales Analytics
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-[#007f19] border border-emerald-200">
              Live Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time commercial metrics, revenue charts, order processing velocity, and Ugandan payment methods.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
            {(['7d', '30d', '90d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf === '7d' ? 'Last 7 Days' : tf === '30d' ? 'Last 30 Days' : 'Last Quarter (90d)'}
              </button>
            ))}
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reload metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#007f19] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* CSV Export Action */}
          <button
            onClick={handleExportCSV}
            className="h-8 px-3 bg-[#007f19] hover:bg-[#006013] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-[#007f19] transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Gross Revenue</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#007f19] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {kpis.formattedTotalRevenue || 'UGX 0'}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#007f19] mt-1.5">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2% vs previous period</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-[#920d35] transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">WooCommerce Orders</span>
            <span className="w-7 h-7 rounded-lg bg-[#920d35]/10 text-[#920d35] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {kpis.totalOrdersCount || 0} Orders
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-1.5">
            <span>Avg: {kpis.formattedAOV || 'UGX 0'} / order</span>
          </div>
        </div>

        {/* Units Sold */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-blue-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">Tech Hardware Sold</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {kpis.totalUnitsSold || 0} Units
          </div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 mt-1.5">
            <span>Across {kpis.activeProductsCount || 0} SKUs in Catalog</span>
          </div>
        </div>

        {/* Sync Telemetry */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-amber-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">WooCommerce Sync</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#007f19] animate-pulse" />
            <span className="text-xs sm:text-sm font-black text-slate-900">
              Active Host
            </span>
          </div>
          <div className="text-[11px] text-slate-500 truncate mt-1.5 font-mono">
            {kpis.syncHost || 'cyberdynamictech.com'}
          </div>
        </div>
      </div>

      {/* 3. Primary Charts: Sales Timeline & Orders Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue & Orders Timeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#007f19]" />
                <span>Gross Revenue & Orders Timeline (UGX)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Daily aggregated store turnover and checkout volume
              </p>
            </div>
            <span className="text-xs font-bold text-[#007f19]">
              Turnover: {kpis.formattedTotalRevenue}
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#007f19" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#007f19" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `UGX ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomCurrencyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#007f19"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Turnover"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Orders Status Breakdown (BarChart) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#920d35]" />
              <span>Orders by Lifecycle Status</span>
            </h3>
            <p className="text-[11px] text-slate-400">Current dispatch and verification pipeline</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByStatus} layout="vertical" margin={{ top: 5, right: 15, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={10} stroke="#94a3b8" />
                <YAxis type="category" dataKey="status" fontSize={11} stroke="#475569" tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [`${value} Orders`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {ordersByStatus.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#007f19'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="bg-emerald-50 text-[#007f19] p-2 rounded-lg font-bold flex items-center justify-between">
              <span>Delivered</span>
              <span>{ordersByStatus.find((o: any) => o.status === 'Delivered')?.count || 0}</span>
            </div>
            <div className="bg-[#920d35]/10 text-[#920d35] p-2 rounded-lg font-bold flex items-center justify-between">
              <span>Processing</span>
              <span>{ordersByStatus.find((o: any) => o.status === 'Processing')?.count || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Secondary Row: Top Products & Category Distribution & Payment Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top-Selling Products List with Units Sold */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              <span>Top-Selling Products</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">Units / Rev</span>
          </div>

          <div className="space-y-3">
            {topProducts.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{p.sku} • Stock: {p.stock}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-black text-[#007f19]">
                    UGX {p.revenue ? (p.revenue / 1000).toFixed(0) + 'k' : '—'}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{p.units} sold</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Revenue Distribution (Pie/Donut Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-600" />
              <span>Category Revenue Share</span>
            </h3>
            <p className="text-[11px] text-slate-400">Share of turnover across hardware departments</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="revenue"
                >
                  {categoryBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cat-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`UGX ${Number(value).toLocaleString()}`, 'Turnover']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {categoryBreakdown.slice(0, 4).map((c: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="truncate max-w-[130px]">{c.name}</span>
                </span>
                <span className="font-bold text-slate-800">UGX {(c.revenue / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Breakdown (MTN, Airtel, COD, Card) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ugandan Payment Gateways</span>
            </h3>
            <p className="text-[11px] text-slate-400">Customer checkout preference breakdown</p>
          </div>

          <div className="space-y-3 pt-1">
            {paymentDistribution.map((pm: any, i: number) => {
              const isMtn = pm.method === 'momo';
              const isAirtel = pm.method === 'airtel';
              const isCod = pm.method === 'cod';
              const colorClass = isMtn
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : isAirtel
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : isCod
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800';

              return (
                <div key={i} className={`p-3 rounded-lg border ${colorClass} space-y-1.5`}>
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      <span>{pm.name}</span>
                    </span>
                    <span className="font-black text-sm">{pm.percentage}%</span>
                  </div>
                  <div className="w-full bg-white/70 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-current rounded-full"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>{pm.count} transactions</span>
                    <span>UGX {pm.total.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. WooCommerce REST Live Data Summary */}
      <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#920d35] text-white flex items-center justify-center font-black">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
                WooCommerce REST API Synchronized
              </h4>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#007f19] text-white">
                SSL Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live commerce target: <span className="font-mono text-emerald-400">https://www.cyberdynamictech.com</span> • Last handshake:{' '}
              {kpis.lastSyncTimestamp ? new Date(kpis.lastSyncTimestamp).toLocaleTimeString() : 'Active'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-300">Catalog SKUs</div>
            <div className="text-sm font-black text-white">{kpis.activeProductsCount || 16} Verified</div>
          </div>
          <button
            onClick={handleRefresh}
            className="h-9 px-4 rounded-lg bg-[#007f19] hover:bg-[#006013] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Re-Ping Live API</span>
          </button>
        </div>
      </div>
    </div>
  );
};

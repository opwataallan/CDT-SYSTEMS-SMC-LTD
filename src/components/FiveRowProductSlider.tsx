import React from 'react';
import { ProductSliderRow } from './ProductSliderRow';
import { Zap, CheckCircle2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export interface FiveRowProductSliderProps {
  className?: string;
  showSectionHeader?: boolean;
}

export const FiveRowProductSlider: React.FC<FiveRowProductSliderProps> = ({
  className = '',
  showSectionHeader = true,
}) => {
  const { config } = useShop();

  const fliersRow2 = config?.homepage?.advert_fliers_row2;
  const fliersRow4 = config?.homepage?.advert_fliers_row4;

  return (
    <section
      id="cdt-five-row-product-catalog-slider"
      className={`w-full bg-white py-3.5 sm:py-5 border-y border-slate-200/80 ${className}`}
      aria-label="CDT Featured Product Category Sliders"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {showSectionHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5 pb-3 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-black tracking-wide uppercase">
                  <Zap className="w-3 h-3 text-cyan-600 fill-cyan-600" />
                  Live Product Showcase
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Verified In Stock
                </span>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
                Explore Our 5 Hardware Categories
              </h2>
            </div>
          </div>
        )}

        {/* =========================================================================
            ROW 1: LAPTOPS & COMPUTERS (Auto-Scrolling)
            Display: HP laptops, Dell laptops, Lenovo laptops, Desktop computers,
                     Refurbished laptops, All-in-one computers
           ========================================================================= */}
        <ProductSliderRow
          rowNumber={1}
          title="Laptops & Computers"
          categorySlug="laptops-computers"
          subCategoriesText="HP Laptops • Dell Laptops • Lenovo Laptops • Desktop PCs • Certified Refurbished • All-in-One"
          badgeText="High Performance Workstations"
          autoScroll={true}
          speed={0.52}
          direction="left-to-right"
          filterCategorySlugs={[
            'laptops-computers',
            'hp-laptops',
            'dell-laptops',
            'lenovo-laptops',
            'desktop-computers',
            'refurbished-laptops',
            'all-in-one-computers',
            'hp pavilion',
            'dell latitude',
            'thinkpad',
            'prodesk',
            'optiplex',
            'elitebook',
          ]}
        />

        {/* =========================================================================
            ROW 2: SMARTPHONES & TABLETS (Strictly Manual Swipe & Drag • 3 Advert Fliers)
            Display: 3 Spotlight Advert Fliers configurable from Admin Settings
           ========================================================================= */}
        <ProductSliderRow
          rowNumber={2}
          title="Smartphones & Tablets"
          categorySlug="smartphones-tablets"
          subCategoriesText="Samsung Galaxy • iPhones • Google Pixel • Tablets & iPads • Fast GaN Chargers"
          badgeText="Official Warranties"
          autoScroll={false}
          maxProducts={3}
          fliers={fliersRow2}
          filterCategorySlugs={[
            'smartphones-tablets',
            'samsung-phones',
            'iphones',
            'android-smartphones',
            'tablets',
            'phone-accessories',
            'galaxy s24',
            'iphone 15',
            'galaxy a55',
            'iphone 13',
            'pixel 8',
            'ipad air',
            'tab s9',
            'anker',
          ]}
        />

        {/* =========================================================================
            ROW 3: PRINTERS & OFFICE EQUIPMENT (Auto-Scrolling)
            Display: HP printers, Laser printers, Photocopiers, Multifunction printers,
                     Toner/cartridges, Office equipment
           ========================================================================= */}
        <ProductSliderRow
          rowNumber={3}
          title="Printers & Office Equipment"
          categorySlug="printers-office-equipment"
          subCategoriesText="HP LaserJet • Epson EcoTank • Canon Copiers • Kyocera A3 • Genuine HP Toners • Shredders"
          badgeText="Lowest Cost Per Page"
          autoScroll={true}
          speed={0.58}
          direction="left-to-right"
          filterCategorySlugs={[
            'printers-office-equipment',
            'printers-photocopiers',
            'hp-printers',
            'laser-printers',
            'photocopiers',
            'multifunction-printers',
            'toner-cartridges',
            'office-equipment',
            'laserjet',
            'ecotank',
            'canon',
            'taskalfa',
            'imagerunner',
            'toner',
            'powershred',
          ]}
        />

        {/* =========================================================================
            ROW 4: NETWORKING & SECURITY (Strictly Manual Swipe & Drag • 3 Advert Fliers)
            Display: 3 Spotlight Advert Fliers configurable from Admin Settings
           ========================================================================= */}
        <ProductSliderRow
          rowNumber={4}
          title="Networking & Security"
          categorySlug="networking-security"
          subCategoriesText="Wi-Fi 6 Routers • 4G/5G SIM Gateways • Cisco Managed Switches • ColorVu CCTV • Solar 4G Cameras"
          badgeText="Seamless Enterprise Connectivity"
          autoScroll={false}
          maxProducts={3}
          fliers={fliersRow4}
          filterCategorySlugs={[
            'networking-security',
            'networking-mifi',
            'wifi-routers',
            '4g-5g-routers',
            'network-switches',
            'cctv-cameras',
            'solar-security-cameras',
            'networking-accessories',
            'archer ax73',
            'huawei 5g',
            'mr6400',
            'cisco business',
            'colorvu',
            'reolink',
            'cat6',
          ]}
        />

        {/* =========================================================================
            ROW 5: ACCESSORIES & ELECTRONICS (Auto-Scrolling)
            Display: Keyboards, Computer mice, Headphones, Monitors, Gaming accessories,
                     Smartwatches, Other IT electronics
           ========================================================================= */}
        <ProductSliderRow
          rowNumber={5}
          title="Accessories & Electronics"
          categorySlug="accessories-electronics"
          subCategoriesText="Logitech MX Keyboards & Mice • Sony ANC Headphones • Dell 4K Monitors • Redragon Gaming • APC UPS"
          badgeText="Ergonomic & Power Protection"
          autoScroll={true}
          speed={0.64}
          direction="left-to-right"
          filterCategorySlugs={[
            'accessories-electronics',
            'accessories-peripherals',
            'monitors-displays',
            'keyboards',
            'computer-mice',
            'headphones',
            'monitors',
            'gaming-accessories',
            'smartwatches',
            'it-electronics',
            'mx keys',
            'mx master',
            'wh-1000xm5',
            'ultrasharp',
            'redragon',
            'watch 6',
            'back-ups',
          ]}
        />
      </div>
    </section>
  );
};

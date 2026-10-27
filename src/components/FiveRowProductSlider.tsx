import React from 'react';
import { ProductSliderRow } from './ProductSliderRow';
import { Zap, CheckCircle2 } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { DEFAULT_MARKETPLACE_CONFIG } from '../data/defaultConfig';

export interface FiveRowProductSliderProps {
  className?: string;
  showSectionHeader?: boolean;
}

export const FiveRowProductSlider: React.FC<FiveRowProductSliderProps> = ({
  className = '',
  showSectionHeader = true,
}) => {
  const { config } = useShop();

  const fliersRow2 =
    config?.homepage?.advert_fliers_row2 && config.homepage.advert_fliers_row2.length > 0
      ? config.homepage.advert_fliers_row2
      : DEFAULT_MARKETPLACE_CONFIG.homepage.advert_fliers_row2;

  const fliersRow4 =
    config?.homepage?.advert_fliers_row4 && config.homepage.advert_fliers_row4.length > 0
      ? config.homepage.advert_fliers_row4
      : DEFAULT_MARKETPLACE_CONFIG.homepage.advert_fliers_row4;

  return (
    <section
      id="cdt-five-row-product-catalog-slider"
      className={`w-full bg-white py-3.5 sm:py-5 border-y border-slate-200/80 ${className}`}
      aria-label="CDT Featured Product Category Sliders"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {showSectionHeader && (
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Featured Collections
            </h2>
          </div>
        )}

        {/* ROW 1: LAPTOPS & COMPUTERS */}
        <ProductSliderRow
          rowNumber={1}
          title="Laptops & Computers"
          categorySlug="laptops-computers"
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

        {/* ROW 2: SMARTPHONES & TABLETS */}
        <ProductSliderRow
          rowNumber={2}
          title="Smartphones & Tablets"
          categorySlug="smartphones-tablets"
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

        {/* ROW 3: PRINTERS & OFFICE EQUIPMENT */}
        <ProductSliderRow
          rowNumber={3}
          title="Printers & Office Equipment"
          categorySlug="printers-office-equipment"
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

        {/* ROW 4: NETWORKING & SECURITY */}
        <ProductSliderRow
          rowNumber={4}
          title="Networking & Security"
          categorySlug="networking-security"
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

        {/* ROW 5: ACCESSORIES & ELECTRONICS */}
        <ProductSliderRow
          rowNumber={5}
          title="Accessories & Electronics"
          categorySlug="accessories-electronics"
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

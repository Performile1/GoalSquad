'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { MoneyIcon, CalendarIcon, EyeIcon, ClickIcon, DashboardIcon, CheckIcon } from '@/app/components/BrandIcons';

interface AdPlacement {
  id: string;
  name: string;
  description: string;
  page: string;
  position: string;
  width: number;
  height: number;
  price_per_day: number;
  price_per_1000_views: number;
  price_per_100_clicks: number;
}

interface PricingOption {
  type: 'days' | 'views' | 'clicks';
  label: string;
  description: string;
  icon: any;
  basePrice: number;
  unit: string;
}

export default function AdPurchasePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState<AdPlacement | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<'days' | 'views' | 'clicks'>('days');
  const [quantity, setQuantity] = useState<number>(7);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // Ad details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Company information
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [backlinkUrl, setBacklinkUrl] = useState('');
  
  // New configuration options
  const [placementType, setPlacementType] = useState<'fixed' | 'rotating'>('rotating');
  const [dailyViewLimit, setDailyViewLimit] = useState(1000);
  const [linkType, setLinkType] = useState<'internal' | 'external'>('external');
  const [internalLinkPath, setInternalLinkPath] = useState('');
  const [autoRestartNextDay, setAutoRestartNextDay] = useState(true);
  const [buttons, setButtons] = useState<Array<{
    text: string;
    link_url: string;
    link_type: 'internal' | 'external';
    internal_link_path?: string;
    color: string;
    background_color: string;
  }>>([]);
  const [showButtonConfig, setShowButtonConfig] = useState(false);
  
  // Payment options
  const [paymentType, setPaymentType] = useState<'daily' | 'advance'>('daily');
  const [advanceDiscountPercent, setAdvanceDiscountPercent] = useState(10);
  const [saveCardForDailyCharges, setSaveCardForDailyCharges] = useState(false);
  const [dailyChargeLimit, setDailyChargeLimit] = useState(500);

  useEffect(() => {
    if (!user) {
      router.push('/auth/register-select');
      return;
    }
    fetchPlacements();
  }, [user]);

  useEffect(() => {
    if (selectedPlacement) {
      calculatePrice();
    }
  }, [selectedPlacement, selectedPricing, quantity, paymentType, advanceDiscountPercent]);

  const fetchPlacements = async () => {
    try {
      const response = await fetch('/api/ads/placements');
      const data = await response.json();
      setPlacements(data.placements || []);
    } catch (error) {
      console.error('Failed to fetch placements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!selectedPlacement) return;

    let price = 0;
    switch (selectedPricing) {
      case 'days':
        price = selectedPlacement.price_per_day * quantity;
        break;
      case 'views':
        price = (selectedPlacement.price_per_1000_views / 1000) * quantity;
        break;
      case 'clicks':
        price = (selectedPlacement.price_per_100_clicks / 100) * quantity;
        break;
    }

    // Apply discount for advance payment
    if (paymentType === 'advance') {
      price = price * (1 - advanceDiscountPercent / 100);
    }

    setTotalPrice(Math.round(price));
  };

  const pricingOptions: PricingOption[] = [
    {
      type: 'days',
      label: 'Dagar',
      description: 'Betala för antal dagar annonsen ska visas',
      icon: CalendarIcon,
      basePrice: selectedPlacement?.price_per_day || 100,
      unit: 'dag',
    },
    {
      type: 'views',
      label: 'Visningar',
      description: 'Betala för antal visningar av annonsen',
      icon: EyeIcon,
      basePrice: selectedPlacement?.price_per_1000_views || 50,
      unit: 'visning',
    },
    {
      type: 'clicks',
      label: 'Klick',
      description: 'Betala för antal klick på annonsen',
      icon: ClickIcon,
      basePrice: selectedPlacement?.price_per_100_clicks || 200,
      unit: 'klick',
    },
  ];

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/ads/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: selectedPlacement?.id,
          title,
          description,
          image_url: imageUrl,
          link_url: linkUrl,
          alt_text: altText,
          purchase_type: selectedPricing,
          purchased_quantity: quantity,
          price_paid: totalPrice,
          start_date: startDate,
          end_date: selectedPricing === 'days' ? endDate : null,
          max_views: selectedPricing === 'views' ? quantity : null,
          max_clicks: selectedPricing === 'clicks' ? quantity : null,
          placement_type: placementType,
          daily_view_limit: dailyViewLimit,
          link_type: linkType,
          internal_link_path: linkType === 'internal' ? internalLinkPath : null,
          auto_restart_next_day: autoRestartNextDay,
          button_config: buttons,
          payment_type: paymentType,
          advance_discount_percent: advanceDiscountPercent,
          save_card_for_daily_charges: saveCardForDailyCharges,
          daily_charge_limit: dailyChargeLimit,
          company_name: companyName,
          company_description: companyDescription,
          company_website: companyWebsite,
          backlink_url: backlinkUrl,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push('/ads/success');
      } else {
        alert('Kunde inte skapa annons: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('Ett fel uppstod');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-900 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-primary-900 font-semibold">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Köp Annonsplats</h1>
          <p className="text-gray-600">Nå ut till tusentals potentiella kunder med annonser på GoalSquad</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center mb-8"
        >
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  step >= s
                    ? 'bg-primary-900 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > s ? <CheckIcon size={20} /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 transition ${
                    step > s ? 'bg-primary-900' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Step 1: Select Placement */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gray-900">Välj Placering</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {placements.map((placement, index) => (
                <motion.div
                  key={placement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => setSelectedPlacement(placement)}
                  className={`p-6 rounded-xl cursor-pointer transition border-2 ${
                    selectedPlacement?.id === placement.id
                      ? 'border-primary-900 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <h3 className="font-bold text-gray-900 mb-2">{placement.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{placement.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      {placement.page} - {placement.position}
                    </span>
                    <span className="text-gray-500">
                      {placement.width}x{placement.height}px
                    </span>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-col gap-2 text-sm">
                      <span className="text-gray-600">
                        {placement.price_per_day} kr/dag
                      </span>
                      <span className="text-gray-600">
                        {placement.price_per_1000_views} kr/1000 visningar
                      </span>
                      <span className="text-gray-600">
                        {placement.price_per_100_clicks} kr/100 klick
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => step === 1 && selectedPlacement && setStep(2)}
                disabled={!selectedPlacement}
                className="px-6 py-3 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nästa
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Pricing */}
        {step === 2 && selectedPlacement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep(1)}
              className="text-primary-900 hover:text-primary-600 font-semibold"
            >
              ← Tillbaka
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Välj Prissättning</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingOptions.map((option, index) => (
                <motion.div
                  key={option.type}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => setSelectedPricing(option.type)}
                  className={`p-6 rounded-xl cursor-pointer transition border-2 ${
                    selectedPricing === option.type
                      ? 'border-primary-900 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <option.icon size={24} className="text-primary-900" />
                    </div>
                    <h3 className="font-bold text-gray-900">{option.label}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                  <div className="text-2xl font-bold text-primary-900">
                    {option.basePrice} kr/{option.unit}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quantity Input */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Antal {selectedPricing === 'days' ? 'dagar' : selectedPricing === 'views' ? 'visningar' : 'klick'}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                min={selectedPricing === 'days' ? 1 : 100}
                step={selectedPricing === 'days' ? 1 : 100}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
              />
            </div>

            {/* Total Price */}
            <div className="bg-primary-50 rounded-xl p-6 border-2 border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Totalt pris</h3>
                  <p className="text-sm text-gray-600">
                    {quantity} {selectedPricing === 'days' ? 'dagar' : selectedPricing === 'views' ? 'visningar' : 'klick'}
                  </p>
                  {paymentType === 'advance' && (
                    <p className="text-xs text-green-600 mt-1">
                      {advanceDiscountPercent}% rabatt tillämpad
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary-900">
                    {totalPrice} kr
                  </div>
                  {paymentType === 'advance' && (
                    <div className="text-sm text-gray-500 line-through">
                      {Math.round(totalPrice / (1 - advanceDiscountPercent / 100))} kr
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Type Selection */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Betalningstyp</h3>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition">
                  <input
                    type="radio"
                    name="paymentType"
                    value="daily"
                    checked={paymentType === 'daily'}
                    onChange={(e) => setPaymentType(e.target.value as 'daily' | 'advance')}
                    className="mt-1 w-5 h-5 text-primary-900"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">Daglig debitering</div>
                    <p className="text-sm text-gray-600">Betala dagligen baserat på faktisk användning</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 transition">
                  <input
                    type="radio"
                    name="paymentType"
                    value="advance"
                    checked={paymentType === 'advance'}
                    onChange={(e) => setPaymentType(e.target.value as 'daily' | 'advance')}
                    className="mt-1 w-5 h-5 text-primary-900"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">Förskottsbetalning (rabatterat pris)</div>
                    <p className="text-sm text-gray-600">Betala allt i förväg och få {advanceDiscountPercent}% rabatt. Återbetalas om annonsen inte godkänns (minus administrativ avgift).</p>
                  </div>
                </label>
              </div>

              {paymentType === 'advance' && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rabattprocent ({advanceDiscountPercent}%)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    step="5"
                    value={advanceDiscountPercent}
                    onChange={(e) => setAdvanceDiscountPercent(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>5%</span>
                    <span>10%</span>
                    <span>15%</span>
                    <span>20%</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Tillbaka
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                Nästa
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Ad Details */}
        {step === 3 && selectedPlacement && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <button
              onClick={() => setStep(2)}
              className="text-primary-900 hover:text-primary-600 font-semibold"
            >
              ← Tillbaka
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Annonsdetaljer</h2>
            
            {/* Company Information */}
            <div className="bg-primary-50 rounded-xl p-6 border-2 border-primary-200">
              <h3 className="font-bold text-gray-900 mb-4">Företagsinformation (Obligatoriskt)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Vi kräver företagsinformation för att säkerställa att våra partners matchar vår profil.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Företagsnamn *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ditt företags namn"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Företagsbeskrivning * (minst 50 tecken)
                  </label>
                  <textarea
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    placeholder="Beskriv ert företag och vad ni gör..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none resize-none"
                    rows={4}
                    minLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">Hjälper oss att granska er ansökan</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Företagets webbplats
                  </label>
                  <input
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Backlink Section */}
            <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
              <h3 className="font-bold text-gray-900 mb-4">Backlink för rabatt</h3>
              <p className="text-sm text-gray-600 mb-4">
                Få rabatt på annonskostnaden om ni länkar tillbaka till goalsquad.shop på er webbplats.
              </p>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL där backlink placeras
                </label>
                <input
                  type="url"
                  value={backlinkUrl}
                  onChange={(e) => setBacklinkUrl(e.target.value)}
                  placeholder="https://example.com/page"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Vi verifierar backlink innan rabatt appliceras</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Annonsens titel"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Beskrivning
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kort beskrivning av annonsen"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bild-URL *
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                />
                {imageUrl && (
                  <div className="mt-2">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="max-w-full h-48 object-cover rounded-lg"
                      onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Länk-URL *
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alt-text (för tillgänglighet)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Beskrivning av bilden"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Startdatum *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                />
              </div>

              {selectedPricing === 'days' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slutdatum
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  />
                </div>
              )}

              {/* Placement Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Placeringstyp
                </label>
                <select
                  value={placementType}
                  onChange={(e) => setPlacementType(e.target.value as 'fixed' | 'rotating')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                >
                  <option value="rotating">Roterande (delar plats med andra annonser)</option>
                  <option value="fixed">Fast (visas alltid)</option>
                </select>
              </div>

              {/* Daily View Limit */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dagligt visningsgräns
                </label>
                <input
                  type="number"
                  value={dailyViewLimit}
                  onChange={(e) => setDailyViewLimit(parseInt(e.target.value) || 1000)}
                  min={100}
                  step={100}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Annonsen pausas när gränsen nås</p>
              </div>

              {/* Link Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Länktyp
                </label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as 'internal' | 'external')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                >
                  <option value="external">Extern länk (öppnas i ny flik)</option>
                  <option value="internal">Intern länk (GoalSquad-sida)</option>
                </select>
              </div>

              {linkType === 'internal' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Intern sökväg
                  </label>
                  <input
                    type="text"
                    value={internalLinkPath}
                    onChange={(e) => setInternalLinkPath(e.target.value)}
                    placeholder="/products, /leaderboard, etc."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                  />
                </div>
              )}

              {/* Auto Restart Next Day */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoRestart"
                  checked={autoRestartNextDay}
                  onChange={(e) => setAutoRestartNextDay(e.target.checked)}
                  className="w-5 h-5 text-primary-900 rounded focus:ring-primary-900"
                />
                <label htmlFor="autoRestart" className="text-sm text-gray-700">
                  Starta om automatiskt nästa dag när daglig gräns nås
                </label>
              </div>

              {/* Button Configuration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Knappar i banner
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowButtonConfig(!showButtonConfig)}
                    className="text-sm text-primary-900 hover:text-primary-600 font-semibold"
                  >
                    {showButtonConfig ? 'Dölj' : 'Visa'} konfiguration
                  </button>
                </div>
                
                {showButtonConfig && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setButtons([...buttons, {
                          text: 'Köp Nu',
                          link_url: linkUrl,
                          link_type: linkType,
                          internal_link_path: internalLinkPath,
                          color: '#FFFFFF',
                          background_color: '#1e3a8a',
                        }])}
                        className="px-4 py-2 bg-primary-900 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition"
                      >
                        + Lägg till knapp
                      </button>
                    </div>
                    
                    {buttons.map((button, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border-2 border-gray-200 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-900">Knapp {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => setButtons(buttons.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                          >
                            Ta bort
                          </button>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Text</label>
                          <input
                            type="text"
                            value={button.text}
                            onChange={(e) => {
                              const newButtons = [...buttons];
                              newButtons[index].text = e.target.value;
                              setButtons(newButtons);
                            }}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Länk</label>
                          <input
                            type="text"
                            value={button.link_url}
                            onChange={(e) => {
                              const newButtons = [...buttons];
                              newButtons[index].link_url = e.target.value;
                              setButtons(newButtons);
                            }}
                            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Textfärg</label>
                          <input
                            type="color"
                            value={button.color}
                            onChange={(e) => {
                              const newButtons = [...buttons];
                              newButtons[index].color = e.target.value;
                              setButtons(newButtons);
                            }}
                            className="w-full h-10 border-2 border-gray-200 rounded-lg cursor-pointer"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Bakgrundsfärg</label>
                          <input
                            type="color"
                            value={button.background_color}
                            onChange={(e) => {
                              const newButtons = [...buttons];
                              newButtons[index].background_color = e.target.value;
                              setButtons(newButtons);
                            }}
                            className="w-full h-10 border-2 border-gray-200 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Saving for Daily Charges */}
              {paymentType === 'daily' && (
                <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-4">Spara kort för dagliga debiteringar</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveCardForDailyCharges}
                        onChange={(e) => setSaveCardForDailyCharges(e.target.checked)}
                        className="w-5 h-5 text-primary-900 rounded focus:ring-primary-900"
                      />
                      <div>
                        <span className="font-semibold text-gray-900">Spara mitt kort för automatiska debiteringar</span>
                        <p className="text-sm text-gray-600">Vi debiterar automatiskt upp till det dagliga maxbeloppet baserat på dina gränser</p>
                      </div>
                    </label>
                    
                    {saveCardForDailyCharges && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Dagligt maxbelopp (kr)
                        </label>
                        <input
                          type="number"
                          value={dailyChargeLimit}
                          onChange={(e) => setDailyChargeLimit(parseInt(e.target.value) || 500)}
                          min={100}
                          step={100}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-900 focus:outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">Vi debiterar aldrig mer än detta belopp per dag</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary-50 rounded-xl p-6 border-2 border-primary-200">
              <h3 className="font-bold text-gray-900 mb-4">Sammanfattning</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Placering:</span>
                  <span className="font-semibold text-gray-900">{selectedPlacement.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prissättning:</span>
                  <span className="font-semibold text-gray-900">
                    {quantity} {selectedPricing === 'days' ? 'dagar' : selectedPricing === 'views' ? 'visningar' : 'klick'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Betalningstyp:</span>
                  <span className="font-semibold text-gray-900">
                    {paymentType === 'advance' ? 'Förskottsbetalning' : 'Daglig debitering'}
                  </span>
                </div>
                {paymentType === 'advance' && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rabatt:</span>
                    <span className="font-semibold text-green-600">{advanceDiscountPercent}%</span>
                  </div>
                )}
                {paymentType === 'daily' && saveCardForDailyCharges && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dagligt maxbelopp:</span>
                    <span className="font-semibold text-gray-900">{dailyChargeLimit} kr</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-primary-300">
                  <span className="text-gray-600">Totalt:</span>
                  <span className="font-bold text-primary-900 text-lg">{totalPrice} kr</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Tillbaka
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title || !imageUrl || !linkUrl || !startDate}
                className="px-6 py-3 bg-primary-900 text-white rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Betala och Skapa Annons
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

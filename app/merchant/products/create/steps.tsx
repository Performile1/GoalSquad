/**
 * Product Creation Form Steps
 */

import React from 'react';

// Step 1: Basic Info
export function Step1BasicInfo({
  name, setName, description, setDescription,
  price, setPrice, stock, setStock,
  categoryId, setCategoryId, categories, categorySuggestions
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        📝 Grundläggande Information
      </h2>

      {/* Product Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Produktnamn *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="t.ex. Premium Chokladaskar 500g"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Beskrivning *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskriv produkten i detalj..."
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
          required
        />
      </div>

      {/* Category with Suggestions */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Kategori *
        </label>
        
        {categorySuggestions.length > 0 && (
          <div className="mb-3 p-4 bg-primary-50 rounded-lg">
            <p className="text-sm font-semibold text-primary-900 mb-2">
              💡 Föreslagna kategorier:
            </p>
            <div className="flex flex-wrap gap-2">
              {categorySuggestions.map((suggestion: any) => (
                <button
                  key={suggestion.categoryId}
                  onClick={() => setCategoryId(suggestion.categoryId)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                    categoryId === suggestion.categoryId
                      ? 'bg-primary-900 text-white'
                      : 'bg-white text-primary-900 hover:bg-primary-100'
                  }`}
                >
                  {suggestion.categoryName} ({(suggestion.confidenceScore * 100).toFixed(0)}%)
                </button>
              ))}
            </div>
          </div>
        )}

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
          required
        >
          <option value="">Välj kategori...</option>
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.iconEmoji} {cat.name} ({cat.productCount} produkter)
            </option>
          ))}
        </select>
      </div>

      {/* Price & Stock */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pris (kr) *
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="150"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Lagersaldo *
          </label>
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="100"
            min="0"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
            required
          />
        </div>
      </div>
    </div>
  );
}

// Step 2: Identifiers
export function Step2Identifiers({
  ean, setEan, eanValid,
  gs1Gtin, setGs1Gtin,
  sku, setSku,
  brand, setBrand,
  manufacturer, setManufacturer
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        🔖 Identifiering & Varumärke
      </h2>

      {/* EAN */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          EAN-13 Streckkod
        </label>
        <div className="relative">
          <input
            type="text"
            value={ean}
            onChange={(e) => setEan(e.target.value.replace(/\D/g, '').slice(0, 13))}
            placeholder="5901234123457"
            maxLength={13}
            className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:outline-none ${
              eanValid === true
                ? 'border-green-500 focus:border-green-500'
                : eanValid === false
                ? 'border-red-500 focus:border-red-500'
                : 'border-gray-200 focus:border-primary-600'
            }`}
          />
          {eanValid !== null && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">
              {eanValid ? '✅' : '❌'}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          13-siffrig EAN-kod (valideras automatiskt)
        </p>
      </div>

      {/* GS1 GTIN */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          GS1 GTIN-14
        </label>
        <input
          type="text"
          value={gs1Gtin}
          onChange={(e) => setGs1Gtin(e.target.value.replace(/\D/g, '').slice(0, 14))}
          placeholder="01234567890128"
          maxLength={14}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          14-siffrig GS1 Global Trade Item Number (valfritt)
        </p>
      </div>

      {/* SKU */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          SKU (Artikelnummer)
        </label>
        <input
          type="text"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="CHOC-PREM-500"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ditt interna artikelnummer
        </p>
      </div>

      {/* Brand */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Varumärke
        </label>
        <input
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Marabou"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        />
      </div>

      {/* Manufacturer */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tillverkare
        </label>
        <input
          type="text"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="Mondelez International"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        />
      </div>
    </div>
  );
}

// Step 3: Dimensions
export function Step3Dimensions({
  weightGrams, setWeightGrams,
  lengthMm, setLengthMm,
  widthMm, setWidthMm,
  heightMm, setHeightMm,
  volumeMl, setVolumeMl
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        📏 Mått & Vikt
      </h2>

      <p className="text-gray-600 mb-6">
        Fyll i produktens fysiska egenskaper. Används för frakt och lagring.
      </p>

      {/* Weight */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Vikt (gram)
        </label>
        <input
          type="number"
          value={weightGrams}
          onChange={(e) => setWeightGrams(e.target.value)}
          placeholder="500"
          min="0"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        />
        {weightGrams && (
          <p className="text-xs text-gray-500 mt-1">
            = {(parseFloat(weightGrams) / 1000).toFixed(2)} kg
          </p>
        )}
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Längd (mm)
          </label>
          <input
            type="number"
            value={lengthMm}
            onChange={(e) => setLengthMm(e.target.value)}
            placeholder="200"
            min="0"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Bredd (mm)
          </label>
          <input
            type="number"
            value={widthMm}
            onChange={(e) => setWidthMm(e.target.value)}
            placeholder="150"
            min="0"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Höjd (mm)
          </label>
          <input
            type="number"
            value={heightMm}
            onChange={(e) => setHeightMm(e.target.value)}
            placeholder="50"
            min="0"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
          />
        </div>
      </div>

      {lengthMm && widthMm && heightMm && (
        <div className="p-4 bg-primary-50 rounded-lg">
          <p className="text-sm text-primary-900">
            📦 Förpackningsstorlek: {lengthMm} × {widthMm} × {heightMm} mm
            <br />
            = {(parseFloat(lengthMm) / 10).toFixed(1)} × {(parseFloat(widthMm) / 10).toFixed(1)} × {(parseFloat(heightMm) / 10).toFixed(1)} cm
          </p>
        </div>
      )}

      {/* Volume */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Volym (ml)
        </label>
        <input
          type="number"
          value={volumeMl}
          onChange={(e) => setVolumeMl(e.target.value)}
          placeholder="500"
          min="0"
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          För flytande produkter (valfritt)
        </p>
        {volumeMl && (
          <p className="text-xs text-gray-500 mt-1">
            = {(parseFloat(volumeMl) / 1000).toFixed(2)} liter
          </p>
        )}
      </div>
    </div>
  );
}

// Step 4: Details
export function Step4Details({
  ingredients, setIngredients,
  allergens, setAllergens,
  countryOfOrigin, setCountryOfOrigin,
  packageType, setPackageType,
  unitsPerPackage, setUnitsPerPackage,
  recyclable, setRecyclable,
  ecoFriendly, setEcoFriendly,
  certifications, setCertifications,
  ageRestriction, setAgeRestriction
}: any) {
  const commonAllergens = [
    'Mjölk', 'Ägg', 'Fisk', 'Skaldjur', 'Nötter', 'Jordnötter',
    'Soja', 'Vete', 'Gluten', 'Selleri', 'Senap', 'Sesam', 'Lupin', 'Svaveldioxid'
  ];

  const commonCertifications = [
    'Ekologisk', 'Fairtrade', 'KRAV', 'EU-ekologisk', 'Rainforest Alliance',
    'MSC', 'ASC', 'FSC', 'Svanen', 'Nyckelhålet'
  ];

  const toggleAllergen = (allergen: string) => {
    if (allergens.includes(allergen)) {
      setAllergens(allergens.filter((a: string) => a !== allergen));
    } else {
      setAllergens([...allergens, allergen]);
    }
  };

  const toggleCertification = (cert: string) => {
    if (certifications.includes(cert)) {
      setCertifications(certifications.filter((c: string) => c !== cert));
    } else {
      setCertifications([...certifications, cert]);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        📋 Produktdetaljer
      </h2>

      {/* Ingredients */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ingredienser
        </label>
        <textarea
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Socker, kakaosmör, mjölkpulver, kakaomassa..."
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        />
      </div>

      {/* Allergens */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Allergener
        </label>
        <div className="flex flex-wrap gap-2">
          {commonAllergens.map((allergen) => (
            <button
              key={allergen}
              type="button"
              onClick={() => toggleAllergen(allergen)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                allergens.includes(allergen)
                  ? 'bg-red-100 text-red-700 border-2 border-red-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {allergens.includes(allergen) && '⚠️ '}
              {allergen}
            </button>
          ))}
        </div>
      </div>

      {/* Country of Origin */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ursprungsland
        </label>
        <select
          value={countryOfOrigin}
          onChange={(e) => setCountryOfOrigin(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        >
          <option value="">Välj land...</option>
          <option value="SE">🇸🇪 Sverige</option>
          <option value="NO">🇳🇴 Norge</option>
          <option value="DK">🇩🇰 Danmark</option>
          <option value="FI">🇫🇮 Finland</option>
          <option value="DE">🇩🇪 Tyskland</option>
          <option value="FR">🇫🇷 Frankrike</option>
          <option value="IT">🇮🇹 Italien</option>
          <option value="ES">🇪🇸 Spanien</option>
          <option value="NL">🇳🇱 Nederländerna</option>
          <option value="BE">🇧🇪 Belgien</option>
        </select>
      </div>

      {/* Package Type */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Förpackningstyp
          </label>
          <select
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
          >
            <option value="">Välj typ...</option>
            <option value="box">📦 Låda</option>
            <option value="bag">👜 Påse</option>
            <option value="bottle">🍾 Flaska</option>
            <option value="can">🥫 Burk</option>
            <option value="jar">🫙 Glasburk</option>
            <option value="carton">📦 Kartong</option>
            <option value="wrapper">🎁 Omslag</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Enheter per förpackning
          </label>
          <input
            type="number"
            value={unitsPerPackage}
            onChange={(e) => setUnitsPerPackage(e.target.value)}
            min="1"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Sustainability */}
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={recyclable}
            onChange={(e) => setRecyclable(e.target.checked)}
            className="w-5 h-5 text-green-600 rounded"
          />
          <span className="font-semibold text-gray-900">
            ♻️ Återvinningsbar förpackning
          </span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={ecoFriendly}
            onChange={(e) => setEcoFriendly(e.target.checked)}
            className="w-5 h-5 text-green-600 rounded"
          />
          <span className="font-semibold text-gray-900">
            🌱 Miljövänlig produkt
          </span>
        </label>
      </div>

      {/* Certifications */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Certifieringar
        </label>
        <div className="flex flex-wrap gap-2">
          {commonCertifications.map((cert) => (
            <button
              key={cert}
              type="button"
              onClick={() => toggleCertification(cert)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                certifications.includes(cert)
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {certifications.includes(cert) && '✓ '}
              {cert}
            </button>
          ))}
        </div>
      </div>

      {/* Age Restriction */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Åldersgräns
        </label>
        <select
          value={ageRestriction}
          onChange={(e) => setAgeRestriction(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
        >
          <option value="">Ingen åldersgräns</option>
          <option value="15">15+ år</option>
          <option value="18">18+ år (alkohol, tobak)</option>
          <option value="21">21+ år</option>
        </select>
      </div>
    </div>
  );
}

// Step 5: Images
export function Step5Images({
  images, imagePreviews, handleImageUpload, removeImage,
  imageSeoTags, setImageSeoTags
}: any) {
  const updateImageSeo = (index: number, field: string, value: string) => {
    const newSeoTags = [...imageSeoTags];
    if (!newSeoTags[index]) {
      newSeoTags[index] = {};
    }
    newSeoTags[index][field] = value;
    setImageSeoTags(newSeoTags);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        📸 Produktbilder
      </h2>

      <p className="text-gray-600 mb-6">
        Ladda upp minst 1 bild. Första bilden blir huvudbild. Lägg till SEO-texter för bättre sökmotoroptimering.
      </p>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-600 transition">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="text-6xl mb-4">📸</div>
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Klicka för att ladda upp bilder
          </p>
          <p className="text-sm text-gray-600">
            PNG, JPG, WebP upp till 5MB per bild
          </p>
        </label>
      </div>

      {/* Image Previews with SEO */}
      {imagePreviews.length > 0 && (
        <div className="space-y-6">
          {imagePreviews.map((preview: string, index: number) => (
            <div key={index} className="bg-white rounded-xl border-2 border-gray-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Image Preview */}
                <div className="relative group flex-shrink-0">
                  <img
                    src={preview}
                    alt={imageSeoTags[index]?.alt_text || `Preview ${index + 1}`}
                    title={imageSeoTags[index]?.title || ''}
                    className="w-full md:w-48 h-48 object-cover rounded-lg"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Huvudbild
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* SEO Fields */}
                <div className="flex-1 space-y-4">
                  <h3 className="font-bold text-gray-900">
                    Bild {index + 1} - SEO-inställningar
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Alt-text (beskrivning för skärmläsare)
                    </label>
                    <input
                      type="text"
                      value={imageSeoTags[index]?.alt_text || ''}
                      onChange={(e) => updateImageSeo(index, 'alt_text', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                      placeholder="Beskriv bilden för sökmotorer och skärmläsare"
                    />
                    <p className="text-xs text-gray-500 mt-1">Viktig för tillgänglighet och SEO</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bildtitel (visas vid hovring)
                    </label>
                    <input
                      type="text"
                      value={imageSeoTags[index]?.title || ''}
                      onChange={(e) => updateImageSeo(index, 'title', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                      placeholder="Kort titel för bilden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bildtext/Caption
                    </label>
                    <textarea
                      value={imageSeoTags[index]?.caption || ''}
                      onChange={(e) => updateImageSeo(index, 'caption', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                      rows={2}
                      placeholder="Valfri bildtext som visas under bilden"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

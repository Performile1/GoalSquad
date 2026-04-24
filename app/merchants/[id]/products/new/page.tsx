'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'

export default function NewProduct() {
  const router = useRouter()
  const params = useParams()
  const merchantId = params.id as string

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    ean: '',
    category: '',
    brand: '',
    basePrice: '',
    retailPrice: '',
    
    // Shipping Dimensions
    weightGrams: '',
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    
    stockQuantity: '',
    stockLocation: '',
    status: 'draft' as 'draft' | 'active',
  })

  const [calculatedDimensions, setCalculatedDimensions] = useState({
    volumetricWeight: 0,
    chargeableWeight: 0,
  })

  // Calculate volumetric weight when dimensions change
  const calculateDimensions = () => {
    const weight = parseInt(formData.weightGrams) || 0
    const length = parseInt(formData.lengthMm) || 0
    const width = parseInt(formData.widthMm) || 0
    const height = parseInt(formData.heightMm) || 0

    const volumetric = (length * width * height) / 5000
    const chargeable = Math.max(weight, volumetric)

    setCalculatedDimensions({
      volumetricWeight: Math.round(volumetric),
      chargeableWeight: Math.round(chargeable),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          name: formData.name,
          description: formData.description,
          sku: formData.sku,
          ean: formData.ean || undefined,
          category: formData.category || undefined,
          brand: formData.brand || undefined,
          basePrice: parseFloat(formData.basePrice),
          retailPrice: parseFloat(formData.retailPrice),
          weightGrams: parseInt(formData.weightGrams),
          lengthMm: parseInt(formData.lengthMm),
          widthMm: parseInt(formData.widthMm),
          heightMm: parseInt(formData.heightMm),
          stockQuantity: parseInt(formData.stockQuantity) || 0,
          stockLocation: formData.stockLocation || undefined,
          status: formData.status,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product')
      }

      // Success! Redirect to product list
      router.push(`/merchants/${merchantId}/products`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Lägg till ny produkt
          </h1>
          <p className="text-gray-600 mb-8">
            Ladda upp en produkt med GS1-mått för korrekt fraktberäkning
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Grundläggande information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Produktnamn *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="Nike Air Max 90"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beskrivning
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="Product description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (lämna tomt för automatiskt GS-XXXXX)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="GS-ABC123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EAN-13 streckkod
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={formData.ean}
                    onChange={(e) => setFormData({ ...formData, ean: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="1234567890123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="Footwear"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="Nike"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Prissättning
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ditt baspris (kr) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="1000.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Vad du får per försäljning
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Försäljningspris (kr) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="1500.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Kunden betalar detta pris
                  </p>
                </div>

                {formData.basePrice && formData.retailPrice && (
                  <div className="md:col-span-2 bg-primary-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Plattformsmarginal:</strong>{' '}
                      {(parseFloat(formData.retailPrice) - parseFloat(formData.basePrice)).toFixed(2)} kr
                      ({(((parseFloat(formData.retailPrice) - parseFloat(formData.basePrice)) / parseFloat(formData.retailPrice)) * 100).toFixed(1)}%)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* GS1 Dimensions (Shipping Matrix) */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📦 GS1-mått (för fraktmatris)
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vikt (gram) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.weightGrams}
                    onChange={(e) => {
                      setFormData({ ...formData, weightGrams: e.target.value })
                      setTimeout(calculateDimensions, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Längd (mm) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.lengthMm}
                    onChange={(e) => {
                      setFormData({ ...formData, lengthMm: e.target.value })
                      setTimeout(calculateDimensions, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bredd (mm) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.widthMm}
                    onChange={(e) => {
                      setFormData({ ...formData, widthMm: e.target.value })
                      setTimeout(calculateDimensions, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Höjd (mm) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.heightMm}
                    onChange={(e) => {
                      setFormData({ ...formData, heightMm: e.target.value })
                      setTimeout(calculateDimensions, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="100"
                  />
                </div>

                {calculatedDimensions.volumetricWeight > 0 && (
                  <div className="md:col-span-2 bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Beräknade fraktmått
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Volymsväkt:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {calculatedDimensions.volumetricWeight}g
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Debiterad vikt:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {calculatedDimensions.chargeableWeight}g
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Formula: max(actual weight, (L × W × H) / 5000)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Lagerhållning
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lagerantal
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lagerplats
                  </label>
                  <input
                    type="text"
                    value={formData.stockLocation}
                    onChange={(e) => setFormData({ ...formData, stockLocation: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    placeholder="Warehouse A, Oslo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'active' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                  >
                    <option value="draft">Utkast</option>
                    <option value="active">Aktiv</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-900 text-white py-4 rounded-lg font-semibold hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Skapar produkt...' : 'Skapa produkt'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Avbryt
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

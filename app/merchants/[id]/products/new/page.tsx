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
    
    // GS1 Dimensions
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Add New Product
          </h1>
          <p className="text-gray-600 mb-8">
            Upload a product with GS1 dimensions for accurate shipping calculations
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
                Basic Information
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nike Air Max 90"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Product description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU (leave empty for auto-generated GS-XXXXX)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="GS-ABC123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    EAN-13 Barcode
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={formData.ean}
                    onChange={(e) => setFormData({ ...formData, ean: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1234567890123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nike"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Pricing
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Base Price (NOK) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1000.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    What you receive per sale
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retail Price (NOK) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.retailPrice}
                    onChange={(e) => setFormData({ ...formData, retailPrice: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1500.00"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Customer pays this price
                  </p>
                </div>

                {formData.basePrice && formData.retailPrice && (
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Platform Margin:</strong>{' '}
                      {(parseFloat(formData.retailPrice) - parseFloat(formData.basePrice)).toFixed(2)} NOK
                      ({(((parseFloat(formData.retailPrice) - parseFloat(formData.basePrice)) / parseFloat(formData.retailPrice)) * 100).toFixed(1)}%)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* GS1 Dimensions (Shipping Matrix) */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                📦 GS1 Dimensions (for Shipping Matrix)
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (grams) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.weightGrams}
                    onChange={(e) => {
                      setFormData({ ...formData, weightGrams: e.target.value })
                      setTimeout(calculateDimensions, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Length (mm) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.lengthMm}
                    onChange={(e) => {
                      setFormData({ ...formData, lengthMm: e.target.value })
                      setTimeout(calculateDimensions, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width (mm) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.widthMm}
                    onChange={(e) => {
                      setFormData({ ...formData, widthMm: e.target.value })
                      setTimeout(calculateDimensions, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (mm) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.heightMm}
                    onChange={(e) => {
                      setFormData({ ...formData, heightMm: e.target.value })
                      setTimeout(calculateDimensions, 100)
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                {calculatedDimensions.volumetricWeight > 0 && (
                  <div className="md:col-span-2 bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Calculated Shipping Dimensions
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Volumetric Weight:</p>
                        <p className="text-lg font-bold text-gray-900">
                          {calculatedDimensions.volumetricWeight}g
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Chargeable Weight:</p>
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
                Inventory
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Location
                  </label>
                  <input
                    type="text"
                    value={formData.stockLocation}
                    onChange={(e) => setFormData({ ...formData, stockLocation: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Product...' : 'Create Product'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

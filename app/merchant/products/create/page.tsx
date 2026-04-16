'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Step1BasicInfo,
  Step2Identifiers,
  Step3Dimensions,
  Step4Details,
  Step5Images
} from './steps';

interface SimilarProduct {
  id: string;
  name: string;
  ean?: string;
  brand?: string;
  merchantName: string;
  categoryName: string;
  similarityScore: number;
}

interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  confidenceScore: number;
}

export default function CreateProductPage() {
  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  
  // Identifiers
  const [ean, setEan] = useState('');
  const [gs1Gtin, setGs1Gtin] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  
  // Physical attributes
  const [weightGrams, setWeightGrams] = useState('');
  const [lengthMm, setLengthMm] = useState('');
  const [widthMm, setWidthMm] = useState('');
  const [heightMm, setHeightMm] = useState('');
  const [volumeMl, setVolumeMl] = useState('');
  
  // Product details
  const [ingredients, setIngredients] = useState('');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [countryOfOrigin, setCountryOfOrigin] = useState('');
  const [packageType, setPackageType] = useState('');
  const [unitsPerPackage, setUnitsPerPackage] = useState('1');
  const [recyclable, setRecyclable] = useState(false);
  const [ecoFriendly, setEcoFriendly] = useState(false);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [ageRestriction, setAgeRestriction] = useState('');
  
  // Category & images
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Smart features
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestion[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [selectedExistingProduct, setSelectedExistingProduct] = useState<string | null>(null);
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [eanValid, setEanValid] = useState<boolean | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Check for similar products when name/EAN changes
  useEffect(() => {
    if (name.length > 3 || ean.length > 0) {
      checkSimilarProducts();
    }
  }, [name, ean, brand]);

  // Suggest categories based on product name
  useEffect(() => {
    if (name.length > 3) {
      suggestCategories();
    }
  }, [name, description]);

  // Validate EAN
  useEffect(() => {
    if (ean.length === 13) {
      validateEan();
    } else {
      setEanValid(null);
    }
  }, [ean]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const checkSimilarProducts = async () => {
    try {
      const response = await fetch('/api/products/check-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, ean, brand }),
      });
      const data = await response.json();
      setSimilarProducts(data.similar || []);
      setShowDuplicateWarning(data.similar.length > 0);
    } catch (error) {
      console.error('Failed to check similar products:', error);
    }
  };

  const suggestCategories = async () => {
    try {
      const response = await fetch('/api/products/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();
      setCategorySuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to suggest categories:', error);
    }
  };

  const validateEan = async () => {
    try {
      const response = await fetch(`/api/products/validate-ean?ean=${ean}`);
      const data = await response.json();
      setEanValid(data.valid);
    } catch (error) {
      console.error('Failed to validate EAN:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages([...images, ...files]);
    
    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Upload images first
      const imageUrls: string[] = [];
      for (const image of images) {
        const formData = new FormData();
        formData.append('image', image);
        
        const uploadResponse = await fetch('/api/upload/product-image', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        imageUrls.push(uploadData.url);
      }

      // Create product
      const productData = {
        name,
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stock),
        categoryId,
        
        // Identifiers
        ean: ean || null,
        gs1Gtin: gs1Gtin || null,
        sku: sku || null,
        brand: brand || null,
        manufacturer: manufacturer || null,
        
        // Physical
        weightGrams: weightGrams ? parseInt(weightGrams) : null,
        lengthMm: lengthMm ? parseInt(lengthMm) : null,
        widthMm: widthMm ? parseInt(widthMm) : null,
        heightMm: heightMm ? parseInt(heightMm) : null,
        volumeMl: volumeMl ? parseInt(volumeMl) : null,
        
        // Details
        ingredients: ingredients || null,
        allergens,
        countryOfOrigin: countryOfOrigin || null,
        packageType: packageType || null,
        unitsPerPackage: parseInt(unitsPerPackage),
        recyclable,
        ecoFriendly,
        certifications,
        ageRestriction: ageRestriction ? parseInt(ageRestriction) : null,
        
        // Images
        images: imageUrls,
      };

      const response = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert('Produkt skapad! ✅');
        // Redirect to products list
        window.location.href = '/merchant/products';
      } else {
        alert('Kunde inte skapa produkt');
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Grundinfo', icon: '📝' },
    { number: 2, title: 'Identifiering', icon: '🔖' },
    { number: 3, title: 'Mått & Vikt', icon: '📏' },
    { number: 4, title: 'Detaljer', icon: '📋' },
    { number: 5, title: 'Bilder', icon: '📸' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📦 Skapa Ny Produkt
          </h1>
          <p className="text-gray-600">
            Fyll i produktinformation. Vi hjälper dig undvika dubbletter!
          </p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <button
                  onClick={() => setCurrentStep(step.number)}
                  className={`flex flex-col items-center gap-2 ${
                    currentStep === step.number
                      ? 'text-primary-900'
                      : currentStep > step.number
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      currentStep === step.number
                        ? 'bg-primary-100'
                        : currentStep > step.number
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    {currentStep > step.number ? '✓' : step.icon}
                  </div>
                  <span className="text-sm font-semibold hidden md:block">
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Duplicate Warning */}
        <AnimatePresence>
          {showDuplicateWarning && similarProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6 mb-8"
            >
              <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                ⚠️ Liknande produkter hittades!
              </h3>
              <p className="text-yellow-800 mb-4">
                Vi hittade {similarProducts.length} liknande produkt(er). Vill du använda en befintlig produkt istället?
              </p>
              <div className="space-y-3">
                {similarProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg p-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">
                        {product.brand && `${product.brand} • `}
                        {product.merchantName} • {product.categoryName}
                      </p>
                      {product.ean && (
                        <p className="text-xs text-gray-500">EAN: {product.ean}</p>
                      )}
                      <p className="text-xs text-primary-900 mt-1">
                        Likhet: {(product.similarityScore * 100).toFixed(0)}%
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedExistingProduct(product.id);
                        setShowDuplicateWarning(false);
                      }}
                      className="bg-primary-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-800"
                    >
                      Använd denna
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowDuplicateWarning(false)}
                className="mt-4 text-yellow-800 hover:text-yellow-900 font-semibold"
              >
                Nej, skapa ny produkt →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <Step1BasicInfo
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              price={price}
              setPrice={setPrice}
              stock={stock}
              setStock={setStock}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              categories={categories}
              categorySuggestions={categorySuggestions}
            />
          )}

          {/* Step 2: Identifiers */}
          {currentStep === 2 && (
            <Step2Identifiers
              ean={ean}
              setEan={setEan}
              eanValid={eanValid}
              gs1Gtin={gs1Gtin}
              setGs1Gtin={setGs1Gtin}
              sku={sku}
              setSku={setSku}
              brand={brand}
              setBrand={setBrand}
              manufacturer={manufacturer}
              setManufacturer={setManufacturer}
            />
          )}

          {/* Step 3: Dimensions */}
          {currentStep === 3 && (
            <Step3Dimensions
              weightGrams={weightGrams}
              setWeightGrams={setWeightGrams}
              lengthMm={lengthMm}
              setLengthMm={setLengthMm}
              widthMm={widthMm}
              setWidthMm={setWidthMm}
              heightMm={heightMm}
              setHeightMm={setHeightMm}
              volumeMl={volumeMl}
              setVolumeMl={setVolumeMl}
            />
          )}

          {/* Step 4: Details */}
          {currentStep === 4 && (
            <Step4Details
              ingredients={ingredients}
              setIngredients={setIngredients}
              allergens={allergens}
              setAllergens={setAllergens}
              countryOfOrigin={countryOfOrigin}
              setCountryOfOrigin={setCountryOfOrigin}
              packageType={packageType}
              setPackageType={setPackageType}
              unitsPerPackage={unitsPerPackage}
              setUnitsPerPackage={setUnitsPerPackage}
              recyclable={recyclable}
              setRecyclable={setRecyclable}
              ecoFriendly={ecoFriendly}
              setEcoFriendly={setEcoFriendly}
              certifications={certifications}
              setCertifications={setCertifications}
              ageRestriction={ageRestriction}
              setAgeRestriction={setAgeRestriction}
            />
          )}

          {/* Step 5: Images */}
          {currentStep === 5 && (
            <Step5Images
              images={images}
              imagePreviews={imagePreviews}
              handleImageUpload={handleImageUpload}
              removeImage={removeImage}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Föregående
            </button>
            
            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-primary-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-800"
              >
                Nästa →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-primary-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Skapar...' : '✓ Skapa Produkt'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components (continued in next file due to length...)

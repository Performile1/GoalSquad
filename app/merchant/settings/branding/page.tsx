'use client';

import { useState, useEffect, useRef } from 'react';
import ImageEditor from '@/app/components/ImageEditor';

export default function MerchantBrandingPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Logos
  const [logoUrl, setLogoUrl] = useState('');
  const [logoSquareUrl, setLogoSquareUrl] = useState('');
  const [logoHorizontalUrl, setLogoHorizontalUrl] = useState('');

  // Brand colors
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4');

  // Company info
  const [companyDescription, setCompanyDescription] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [employeeCount, setEmployeeCount] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [companyRegistration, setCompanyRegistration] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  // Social media
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  // Contact persons
  const [contacts, setContacts] = useState<any[]>([]);

  // Image editor
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editingImageType, setEditingImageType] = useState<'logo' | 'logo_square' | 'logo_horizontal' | null>(null);

  const fileInputRefs = {
    logo: useRef<HTMLInputElement>(null),
    logoSquare: useRef<HTMLInputElement>(null),
    logoHorizontal: useRef<HTMLInputElement>(null),
  };

  useEffect(() => {
    fetchBranding();
    fetchContacts();
  }, []);

  const fetchBranding = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/merchant/branding');
      const data = await response.json();

      if (data.branding) {
        const b = data.branding;
        setLogoUrl(b.logo_url || '');
        setLogoSquareUrl(b.logo_square_url || '');
        setLogoHorizontalUrl(b.logo_horizontal_url || '');
        setPrimaryColor(b.brand_colors?.primary || '#0ea5e9');
        setSecondaryColor(b.brand_colors?.secondary || '#06b6d4');
        setCompanyDescription(b.company_description || '');
        setFoundedYear(b.founded_year || '');
        setEmployeeCount(b.employee_count || '');
        setAnnualRevenue(b.annual_revenue || '');
        setCompanyRegistration(b.company_registration || '');
        setVatNumber(b.vat_number || '');
        setWebsiteUrl(b.website_url || '');
        setLinkedinUrl(b.linkedin_url || '');
        setFacebookUrl(b.facebook_url || '');
        setInstagramUrl(b.instagram_url || '');
      }
    } catch (error) {
      console.error('Failed to fetch branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/merchant/contacts');
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const handleLogoUpload = async (type: 'logo' | 'logoSquare' | 'logoHorizontal', file: File) => {
    // Show image editor
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingImage(reader.result as string);
      setEditingImageType(type === 'logo' ? 'logo' : type === 'logoSquare' ? 'logo_square' : 'logo_horizontal');
    };
    reader.readAsDataURL(file);
  };

  const handleImageEditorSave = async (blob: Blob, url: string) => {
    try {
      // Upload edited image
      const formData = new FormData();
      formData.append('logo', blob);
      formData.append('type', editingImageType!);

      const response = await fetch('/api/merchant/logo', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (editingImageType === 'logo') setLogoUrl(data.logoUrl);
        else if (editingImageType === 'logo_square') setLogoSquareUrl(data.logoUrl);
        else if (editingImageType === 'logo_horizontal') setLogoHorizontalUrl(data.logoUrl);

        alert('Logga uppladdad! ✅');
      } else {
        alert('Uppladdning misslyckades');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ett fel uppstod');
    } finally {
      setEditingImage(null);
      setEditingImageType(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/merchant/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandColors: { primary: primaryColor, secondary: secondaryColor },
          companyDescription,
          foundedYear: foundedYear ? parseInt(foundedYear) : null,
          employeeCount,
          annualRevenue,
          companyRegistration,
          vatNumber,
          websiteUrl,
          linkedinUrl,
          facebookUrl,
          instagramUrl,
        }),
      });

      if (response.ok) {
        alert('Inställningar sparade! ✅');
      } else {
        alert('Kunde inte spara');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Ett fel uppstod');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4 animate-bounce">🎨</div>
          <p className="text-xl text-gray-600">Laddar varumärkesinställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🎨 Varumärke & Företagsinformation
        </h1>

        {/* Logos */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📸 Logotyper
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Logo */}
            <LogoUploadBox
              title="Huvudlogga"
              description="Kvadratisk eller vertikal"
              currentLogo={logoUrl}
              onUpload={() => fileInputRefs.logo.current?.click()}
            />
            <input
              ref={fileInputRefs.logo}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload('logo', file);
              }}
              className="hidden"
            />

            {/* Square Logo */}
            <LogoUploadBox
              title="Kvadratisk Logga"
              description="För ikoner (512x512px)"
              currentLogo={logoSquareUrl}
              onUpload={() => fileInputRefs.logoSquare.current?.click()}
            />
            <input
              ref={fileInputRefs.logoSquare}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload('logoSquare', file);
              }}
              className="hidden"
            />

            {/* Horizontal Logo */}
            <LogoUploadBox
              title="Horisontell Logga"
              description="För headers (1200x300px)"
              currentLogo={logoHorizontalUrl}
              onUpload={() => fileInputRefs.logoHorizontal.current?.click()}
            />
            <input
              ref={fileInputRefs.logoHorizontal}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload('logoHorizontal', file);
              }}
              className="hidden"
            />
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tips:</strong> Loggor kan beskäras och bakgrund kan tas bort automatiskt efter uppladdning!
            </p>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🎨 Varumärkesfärger
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Primär Färg
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sekundär Färg
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-6 rounded-lg" style={{
            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`
          }}>
            <p className="text-white font-bold text-center text-lg">
              Förhandsvisning av färgschema
            </p>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🏢 Företagsinformation
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Företagsbeskrivning
              </label>
              <textarea
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Beskriv ert företag..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Grundat år
                </label>
                <input
                  type="number"
                  value={foundedYear}
                  onChange={(e) => setFoundedYear(e.target.value)}
                  placeholder="2020"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Antal anställda
                </label>
                <select
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Välj...</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Organisationsnummer
                </label>
                <input
                  type="text"
                  value={companyRegistration}
                  onChange={(e) => setCompanyRegistration(e.target.value)}
                  placeholder="556123-4567"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  VAT/MOMS-nummer
                </label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  placeholder="SE556123456701"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📱 Webbplats & Sociala Medier
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Webbplats
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                LinkedIn
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/company/..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Facebook
              </label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instagram
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition disabled:opacity-50 shadow-lg"
          >
            {saving ? 'Sparar...' : '💾 Spara Inställningar'}
          </button>
        </div>
      </div>

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          imageUrl={editingImage}
          onSave={handleImageEditorSave}
          onCancel={() => {
            setEditingImage(null);
            setEditingImageType(null);
          }}
        />
      )}
    </div>
  );
}

function LogoUploadBox({ title, description, currentLogo, onUpload }: any) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition">
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {currentLogo ? (
        <div className="mb-4">
          <img
            src={currentLogo}
            alt={title}
            className="max-h-32 mx-auto object-contain"
          />
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-6xl mb-4">
          📸
        </div>
      )}

      <button
        onClick={onUpload}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        {currentLogo ? 'Byt Logga' : 'Ladda upp'}
      </button>
    </div>
  );
}

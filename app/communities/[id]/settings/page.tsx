'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function CommunitySettingsPage({ params }: { params: { id: string } }) {
  const [uploading, setUploading] = useState(false);
  const [logos, setLogos] = useState({
    primary: '',
    banner: '',
    icon: '',
  });
  const [brandColors, setBrandColors] = useState({
    primary: '#0ea5e9',
    secondary: '#06b6d4',
  });
  const [showOnHomepage, setShowOnHomepage] = useState(false);

  const fileInputRefs = {
    primary: useRef<HTMLInputElement>(null),
    banner: useRef<HTMLInputElement>(null),
    icon: useRef<HTMLInputElement>(null),
  };

  const handleLogoUpload = async (type: 'primary' | 'banner' | 'icon', file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('type', type);

      const response = await fetch(`/api/communities/${params.id}/logo`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setLogos((prev) => ({ ...prev, [type]: data.logoUrl }));
        alert('Logga uppladdad! ✅');
      } else {
        alert('Uppladdning misslyckades');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ett fel uppstod');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (type: 'primary' | 'banner' | 'icon') => {
    const file = fileInputRefs[type].current?.files?.[0];
    if (file) {
      handleLogoUpload(type, file);
    }
  };

  const updateBranding = async () => {
    try {
      const response = await fetch(`/api/communities/${params.id}/logo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandColors, showOnHomepage }),
      });

      if (response.ok) {
        alert('Inställningar sparade! ✅');
      } else {
        alert('Kunde inte spara');
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Ett fel uppstod');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          ⚙️ Föreningsinställningar
        </h1>

        {/* Logo Upload Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📸 Loggor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Logo */}
            <LogoUploadBox
              title="Primär Logga"
              description="Kvadratisk (500x500px)"
              currentLogo={logos.primary}
              onUpload={() => fileInputRefs.primary.current?.click()}
              uploading={uploading}
            />
            <input
              ref={fileInputRefs.primary}
              type="file"
              accept="image/*"
              onChange={() => handleFileSelect('primary')}
              className="hidden"
            />

            {/* Banner Logo */}
            <LogoUploadBox
              title="Banner Logga"
              description="Bred (1200x300px)"
              currentLogo={logos.banner}
              onUpload={() => fileInputRefs.banner.current?.click()}
              uploading={uploading}
            />
            <input
              ref={fileInputRefs.banner}
              type="file"
              accept="image/*"
              onChange={() => handleFileSelect('banner')}
              className="hidden"
            />

            {/* Icon Logo */}
            <LogoUploadBox
              title="Ikon Logga"
              description="Liten (128x128px)"
              currentLogo={logos.icon}
              onUpload={() => fileInputRefs.icon.current?.click()}
              uploading={uploading}
            />
            <input
              ref={fileInputRefs.icon}
              type="file"
              accept="image/*"
              onChange={() => handleFileSelect('icon')}
              className="hidden"
            />
          </div>

          <div className="mt-6 p-4 bg-primary-50 rounded-lg">
            <p className="text-sm text-primary-800">
              💡 <strong>Tips:</strong> Använd PNG eller SVG för bästa kvalitet. Max 5MB per fil.
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
                  value={brandColors.primary}
                  onChange={(e) =>
                    setBrandColors((prev) => ({ ...prev, primary: e.target.value }))
                  }
                  className="w-20 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColors.primary}
                  onChange={(e) =>
                    setBrandColors((prev) => ({ ...prev, primary: e.target.value }))
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
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
                  value={brandColors.secondary}
                  onChange={(e) =>
                    setBrandColors((prev) => ({ ...prev, secondary: e.target.value }))
                  }
                  className="w-20 h-12 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColors.secondary}
                  onChange={(e) =>
                    setBrandColors((prev) => ({ ...prev, secondary: e.target.value }))
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-6 rounded-lg" style={{
            background: `linear-gradient(to right, ${brandColors.primary}, ${brandColors.secondary})`
          }}>
            <p className="text-white font-bold text-center text-lg">
              Förhandsvisning av färgschema
            </p>
          </div>
        </div>

        {/* Homepage Feature */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            ⭐ Visning på Startsidan
          </h2>

          <label className="flex items-center gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnHomepage}
              onChange={(e) => setShowOnHomepage(e.target.checked)}
              className="w-6 h-6 text-primary-900 rounded focus:ring-2 focus:ring-primary-600"
            />
            <div>
              <div className="font-semibold text-gray-900">
                Visa på startsidan
              </div>
              <div className="text-sm text-gray-600">
                Er logga kommer att visas i den rullande bannern på startsidan
              </div>
            </div>
          </label>

          {showOnHomepage && (
            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Obs:</strong> Endast föreningar med uppladdad primär logga visas på startsidan.
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={updateBranding}
            className="bg-gradient-to-r from-primary-900 to-primary-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-primary-800 hover:to-primary-700 transition shadow-lg"
          >
            💾 Spara Inställningar
          </button>
        </div>
      </div>
    </div>
  );
}

function LogoUploadBox({
  title,
  description,
  currentLogo,
  onUpload,
  uploading,
}: {
  title: string;
  description: string;
  currentLogo: string;
  onUpload: () => void;
  uploading: boolean;
}) {
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-600 transition">
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
        disabled={uploading}
        className="bg-primary-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {uploading ? 'Laddar upp...' : currentLogo ? 'Byt Logga' : 'Ladda upp'}
      </button>
    </div>
  );
}

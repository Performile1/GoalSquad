'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BoxIcon, CheckIcon, AlertIcon } from '@/app/components/BrandIcons';

interface ParsedRow {
  sku: string;
  name: string;
  price: number;
  stock?: number;
  description?: string;
  currency?: string;
}

// Minimal CSV parser supporting quoted fields and comma/semicolon delimiters.
function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';

  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        out.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out.map((c) => c.trim());
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase());
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

const HEADER_ALIASES: Record<string, keyof ParsedRow> = {
  sku: 'sku', artikelnummer: 'sku', 'artikel-nr': 'sku',
  name: 'name', namn: 'name', produktnamn: 'name', title: 'name',
  price: 'price', pris: 'price', 'pris (kr)': 'price',
  stock: 'stock', lager: 'stock', antal: 'stock', 'stock_quantity': 'stock',
  description: 'description', beskrivning: 'description',
  currency: 'currency', valuta: 'currency',
};

export default function MerchantProductImport() {
  const params = useParams();
  const router = useRouter();
  const merchantId = params.id as string;

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFile = async (file: File) => {
    setResult(null);
    setErrors([]);
    setFileName(file.name);
    const text = await file.text();
    const { headers, rows: rawRows } = parseCsv(text);

    if (headers.length === 0) {
      setErrors(['Filen verkar vara tom.']);
      setRows([]);
      return;
    }

    // Map headers to canonical fields.
    const colMap: Record<number, keyof ParsedRow> = {};
    headers.forEach((h, i) => {
      const mapped = HEADER_ALIASES[h];
      if (mapped) colMap[i] = mapped;
    });

    const mappedFields = Object.values(colMap);
    const missing = ['sku', 'name', 'price'].filter((f) => !mappedFields.includes(f as keyof ParsedRow));
    if (missing.length > 0) {
      setErrors([`Saknar obligatoriska kolumner: ${missing.join(', ')}. Hittade: ${headers.join(', ')}`]);
      setRows([]);
      return;
    }

    const parsed: ParsedRow[] = [];
    const rowErrors: string[] = [];
    rawRows.forEach((cols, idx) => {
      const row: any = {};
      Object.entries(colMap).forEach(([colIdx, field]) => {
        row[field] = cols[Number(colIdx)];
      });
      const price = parseFloat(String(row.price).replace(',', '.'));
      const stock = row.stock != null && row.stock !== '' ? parseInt(String(row.stock), 10) : undefined;

      if (!row.sku || !row.name) {
        rowErrors.push(`Rad ${idx + 2}: SKU och namn krävs.`);
        return;
      }
      if (isNaN(price) || price < 0) {
        rowErrors.push(`Rad ${idx + 2}: ogiltigt pris "${row.price}".`);
        return;
      }
      parsed.push({
        sku: String(row.sku),
        name: String(row.name),
        price,
        stock: stock != null && !isNaN(stock) ? stock : undefined,
        description: row.description ? String(row.description) : undefined,
        currency: row.currency ? String(row.currency).toUpperCase() : undefined,
      });
    });

    setErrors(rowErrors);
    setRows(parsed);
  };

  const handleUpload = async () => {
    if (rows.length === 0) return;
    setUploading(true);
    setResult(null);
    try {
      const res = await fetch('/api/merchants/bulk/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          products: rows,
          idempotencyKey: `import_${merchantId}_${Date.now()}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Import misslyckades');
      }
      setResult({ success: true, message: data.message || `${rows.length} produkter importerade.` });
      setTimeout(() => router.push(`/merchants/${merchantId}/products`), 1500);
    } catch (e: any) {
      setResult({ success: false, message: e.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Link href={`/merchants/${merchantId}/products`} className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">
          ← Tillbaka till produkter
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-blue-100"><BoxIcon size={32} className="icon-brand" /></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Importera produkter (CSV)</h1>
            <p className="text-gray-600">Ladda upp en CSV-fil för att skapa/uppdatera produkter i bulk.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">1. Filformat</h2>
          <p className="text-sm text-gray-600 mb-3">
            Obligatoriska kolumner: <code className="bg-gray-100 px-1 rounded">sku</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">name</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">price</code>. Valfria:{' '}
            <code className="bg-gray-100 px-1 rounded">stock</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">description</code>,{' '}
            <code className="bg-gray-100 px-1 rounded">currency</code>. Svenska rubriker (namn, pris, lager) stöds också.
          </p>
          <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto">
sku,name,price,stock,description{'\n'}ABC-1,Fotboll stl 5,249,120,Matchboll{'\n'}ABC-2,Träningsväst,99,50,Reflexväst
          </pre>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">2. Välj fil</h2>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-10 cursor-pointer hover:border-primary-500 transition">
            <BoxIcon size={40} className="text-gray-400 mb-3" />
            <span className="text-sm text-gray-600">{fileName || 'Klicka för att välja en .csv-fil'}</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </label>
        </div>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <AlertIcon size={18} /> {errors.length} problem hittades
            </div>
            <ul className="text-sm text-red-600 list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
              {errors.slice(0, 20).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {rows.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">3. Förhandsvisning ({rows.length} giltiga rader)</h2>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">SKU</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Namn</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Pris</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Lager</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-500">Valuta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.slice(0, 100).map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-700">{r.sku}</td>
                      <td className="px-3 py-2 text-gray-900">{r.name}</td>
                      <td className="px-3 py-2 text-gray-700">{r.price}</td>
                      <td className="px-3 py-2 text-gray-700">{r.stock ?? '-'}</td>
                      <td className="px-3 py-2 text-gray-500">{r.currency ?? 'SEK'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {result && (
          <div className={`rounded-xl p-4 mb-6 flex items-center gap-2 font-semibold ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {result.success ? <CheckIcon size={18} /> : <AlertIcon size={18} />}
            {result.message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Link href={`/merchants/${merchantId}/products`} className="px-6 py-3 rounded-xl font-semibold text-gray-700 border-2 border-gray-200 hover:bg-gray-50 transition">
            Avbryt
          </Link>
          <button
            onClick={handleUpload}
            disabled={rows.length === 0 || uploading}
            className="px-6 py-3 rounded-xl font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: '#003B3D' }}
          >
            {uploading ? 'Importerar...' : `Importera ${rows.length || ''} produkter`}
          </button>
        </div>
      </div>
    </div>
  );
}

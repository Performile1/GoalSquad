'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WarehouseSelector } from '@/app/components/WarehouseMap';

export default function OrderFlowPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      const data = await response.json();
      setOrder(data.order);
      
      // Determine current step based on order status
      if (data.order.status === 'pending_moq') setCurrentStep(2);
      else if (data.order.status === 'processing') setCurrentStep(3);
      else if (data.order.status === 'shipped') setCurrentStep(4);
      else if (data.order.status === 'delivered') setCurrentStep(5);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4 animate-bounce">📦</div>
          <p className="text-xl text-gray-600">Laddar orderflöde...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-2xl font-bold text-gray-900">Order hittades inte</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      number: 1,
      title: 'Beställning mottagen',
      description: 'Din beställning har registrerats',
      icon: '🛒',
      status: 'completed',
    },
    {
      number: 2,
      title: 'Väntar på MOQ',
      description: 'Samlar beställningar för att nå minsta antal',
      icon: '⏳',
      status: currentStep >= 2 ? 'active' : 'pending',
      details: order.moq_items?.map((item: any) => ({
        product: item.product_name,
        current: item.current_quantity,
        target: item.target_quantity,
        percentage: Math.round((item.current_quantity / item.target_quantity) * 100),
      })),
    },
    {
      number: 3,
      title: 'Konsolideringslager',
      description: 'Produkter plockas och förpackas',
      icon: '🏭',
      status: currentStep >= 3 ? 'active' : 'pending',
      warehouse: order.warehouse,
    },
    {
      number: 4,
      title: 'På väg',
      description: 'Paketet är skickat',
      icon: '🚚',
      status: currentStep >= 4 ? 'active' : 'pending',
      tracking: order.tracking_number,
    },
    {
      number: 5,
      title: 'Levererat',
      description: 'Paketet har anlänt',
      icon: '✅',
      status: currentStep >= 5 ? 'completed' : 'pending',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📦 Ditt Orderflöde
          </h1>
          <p className="text-gray-600">
            Order #{order.order_number} • {order.items?.length || 0} produkter
          </p>
        </div>

        {/* Visual Flow */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            🔄 Så här fungerar det
          </h2>

          {/* Flow Diagram */}
          <div className="relative">
            {/* Connection Lines */}
            <div className="absolute top-16 left-0 right-0 h-1 bg-gray-200 hidden md:block"></div>
            <div 
              className="absolute top-16 left-0 h-1 bg-primary-900 transition-all duration-1000 hidden md:block"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {steps.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Step Circle */}
                  <div className="flex flex-col items-center mb-4">
                    <div
                      className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl mb-3 transition-all ${
                        step.status === 'completed'
                          ? 'bg-green-500 text-white shadow-lg scale-110'
                          : step.status === 'active'
                          ? 'bg-primary-900 text-white shadow-lg scale-110 animate-pulse'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {step.icon}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        step.status === 'completed' || step.status === 'active'
                          ? 'bg-primary-900 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Step Info */}
                  <div className="text-center">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {step.description}
                    </p>

                    {/* Step Details */}
                    {step.status === 'active' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 bg-primary-50 rounded-lg text-left"
                      >
                        {step.details && (
                          <div className="space-y-2">
                            {step.details.map((detail: any, i: number) => (
                              <div key={i}>
                                <div className="text-xs font-semibold text-primary-900 mb-1">
                                  {detail.product}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-primary-900 h-2 rounded-full transition-all"
                                      style={{ width: `${detail.percentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs font-bold text-primary-900">
                                    {detail.current}/{detail.target}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {step.warehouse && (
                          <WarehouseSelector
                            postalCode={order.shipping_postal_code}
                          />
                        )}

                        {step.tracking && (
                          <div className="text-sm">
                            <div className="font-semibold text-primary-900 mb-1">
                              Spårningsnummer:
                            </div>
                            <div className="font-mono text-primary-900">
                              {step.tracking}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: How it works */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              💡 Så fungerar sambeställning
            </h3>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="text-4xl">1️⃣</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Du beställer
                  </h4>
                  <p className="text-sm text-gray-600">
                    Din beställning registreras och skickas till närmaste konsolideringslager
                    baserat på ditt postnummer.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-4xl">2️⃣</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Andra beställer också
                  </h4>
                  <p className="text-sm text-gray-600">
                    Systemet samlar beställningar från flera kunder i ditt område tills minsta
                    antal (MOQ) uppnås för varje produkt.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-4xl">3️⃣</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Företaget skickar till lager
                  </h4>
                  <p className="text-sm text-gray-600">
                    När MOQ uppnås skickar företaget produkterna till konsolideringslagret
                    där de plockas ihop med andra produkter.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-4xl">4️⃣</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Lagret förpackar
                  </h4>
                  <p className="text-sm text-gray-600">
                    Lagerpartnern plockar ihop alla dina produkter i ett paket och
                    använder företagets förpackningsmaterial.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="text-4xl">5️⃣</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    Leverans till dig
                  </h4>
                  <p className="text-sm text-gray-600">
                    Paketet skickas direkt till din förening eller hem. Alla som väntade
                    på MOQ får rabatt!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Benefits */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">
                ✨ Fördelar med sambeställning
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">💰</div>
                  <div>
                    <h4 className="font-bold mb-1">Lägre priser</h4>
                    <p className="text-sm text-green-50">
                      Automatisk rabatt när MOQ uppnås (ofta 10-20%)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-3xl">🌍</div>
                  <div>
                    <h4 className="font-bold mb-1">Mindre miljöpåverkan</h4>
                    <p className="text-sm text-green-50">
                      Färre transporter = lägre CO2-utsläpp
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-3xl">📦</div>
                  <div>
                    <h4 className="font-bold mb-1">Effektiv logistik</h4>
                    <p className="text-sm text-green-50">
                      Allt i ett paket istället för många små
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-3xl">🤝</div>
                  <div>
                    <h4 className="font-bold mb-1">Stödjer lokalt</h4>
                    <p className="text-sm text-green-50">
                      Hjälper små företag nå fler kunder
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-50 rounded-2xl border-2 border-primary-600 p-6">
              <h4 className="font-bold text-primary-900 mb-3">
                📊 Din beställning
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-primary-800">Produkter:</span>
                  <span className="font-bold text-primary-900">{order.items?.length || 0} st</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-800">Lagerpartner:</span>
                  <span className="font-bold text-primary-900">{order.warehouse?.city || 'Tilldelar...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary-800">Beräknad leverans:</span>
                  <span className="font-bold text-primary-900">
                    {order.estimated_delivery_date || '5-10 dagar'}
                  </span>
                </div>
                {order.moq_discount && (
                  <div className="flex justify-between pt-2 border-t border-primary-200">
                    <span className="text-primary-800">MOQ-rabatt:</span>
                    <span className="font-bold text-green-600">-{order.moq_discount}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

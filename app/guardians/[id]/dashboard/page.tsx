'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';

interface GuardianData {
  fullName: string;
  email: string;
  children: ChildSeller[];
}

interface ChildSeller {
  id: string;
  fullName: string;
  age: number;
  shopUrl: string;
  currentLevel: number;
  totalSales: number;
  totalOrders: number;
  treasuryBalance: {
    held: number;
    available: number;
    total: number;
  };
  recentOrders: Order[];
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function GuardianDashboard() {
  const params = useParams();
  const guardianId = params.id as string;
  
  const [data, setData] = useState<GuardianData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuardianData();
  }, [guardianId]);

  const fetchGuardianData = async () => {
    try {
      const response = await fetch(`/api/guardians/${guardianId}/dashboard`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch guardian data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-indigo-600">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-red-600">Guardian not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Guardian Dashboard
          </h1>
          <p className="text-gray-600">Welcome, {data.fullName}</p>
        </motion.div>

        {/* Children Overview */}
        <div className="space-y-6">
          {data.children.map((child, index) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              {/* Child Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-3xl">
                    👤
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{child.fullName}</h2>
                    <p className="text-gray-600">Age: {child.age} • Level {child.currentLevel}</p>
                    <p className="text-sm text-blue-600">goalsquad.shop/{child.shopUrl}</p>
                  </div>
                </div>
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
                  View Full Dashboard
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Sales</div>
                  <div className="text-2xl font-bold text-green-600">
                    {child.totalSales.toLocaleString()} NOK
                  </div>
                  <div className="text-xs text-gray-500">{child.totalOrders} orders</div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Available</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {child.treasuryBalance.available.toLocaleString()} NOK
                  </div>
                  <div className="text-xs text-gray-500">Ready for payout</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {child.treasuryBalance.held.toLocaleString()} NOK
                  </div>
                  <div className="text-xs text-gray-500">30-day hold</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Total Balance</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {child.treasuryBalance.total.toLocaleString()} NOK
                  </div>
                  <div className="text-xs text-gray-500">All funds</div>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Recent Orders</h3>
                <div className="space-y-2">
                  {child.recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-semibold">{order.orderNumber}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          {order.totalAmount.toLocaleString()} NOK
                        </div>
                        <div className={`text-sm ${
                          order.status === 'delivered' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                  {child.recentOrders.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No orders yet
                    </div>
                  )}
                </div>
              </div>

              {/* Parental Controls */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Parental Controls</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold transition">
                    🔒 Privacy Settings
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold transition">
                    💰 Payout Settings
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold transition">
                    📊 View Activity
                  </button>
                  <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-semibold transition">
                    ⚙️ Account Settings
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {data.children.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No children registered
              </h3>
              <p className="text-gray-600 mb-6">
                Register your child as a seller to get started
              </p>
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
                Register Child
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

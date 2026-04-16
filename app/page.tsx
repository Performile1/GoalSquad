'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 mb-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              GoalSquad
            </motion.h1>
            
            <motion.p
              className="text-2xl md:text-3xl text-gray-700 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Community Commerce, Powered by You
            </motion.p>
            
            <motion.p
              className="text-lg text-gray-600 max-w-2xl mx-auto mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              The global 4PL and Fintech platform that splits revenue fairly, 
              ships smartly, and builds communities through commerce.
            </motion.p>

            <motion.div
              className="flex gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link
                href="/merchants/onboard"
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Become a Merchant
              </Link>
              <Link
                href="/products"
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl border-2 border-blue-600"
              >
                Handla nu
              </Link>
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="mt-24 grid md:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[
              {
                title: 'The Split Engine',
                description: 'Triple-dip margins: Sales, Handling, and Shipping spreads calculated in real-time.',
                icon: '💰',
              },
              {
                title: 'Distributed Logistics',
                description: 'Multi-origin shipping with hub consolidation for optimal delivery.',
                icon: '🚚',
              },
              {
                title: 'Audit Trail',
                description: 'Immutable signatures for every transaction. Trust built-in.',
                icon: '🔒',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-40 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </div>
    </main>
  )
}

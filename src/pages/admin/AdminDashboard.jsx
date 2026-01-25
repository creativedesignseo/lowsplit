import { Helmet } from 'react-helmet-async'
import { TrendingUp, Users, Package, AlertCircle } from 'lucide-react'

const AdminDashboard = () => {
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - LowSplit</title>
      </Helmet>

      <div className="space-y-6">
        <h1 className="text-3xl font-black text-gray-900">Dashboard Overview</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
                </div>
                <div className="text-2xl font-black text-gray-900">€1,250.00</div>
                <div className="text-xs text-green-600 font-medium">+15% vs last month</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Active Users</span>
                </div>
                <div className="text-2xl font-black text-gray-900">843</div>
                <div className="text-xs text-gray-400 font-medium">+12 new today</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <Package className="w-5 h-5 text-purple-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Active Accounts</span>
                </div>
                <div className="text-2xl font-black text-gray-900">42</div>
                <div className="text-xs text-red-500 font-medium">3 low stock</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2 text-gray-500">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Issues</span>
                </div>
                <div className="text-2xl font-black text-gray-900">5</div>
                <div className="text-xs text-gray-400 font-medium">Requires attention</div>
            </div>
        </div>
      </div>
    </>
  )
}

export default AdminDashboard

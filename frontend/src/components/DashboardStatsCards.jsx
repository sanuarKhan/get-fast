const DashboardStatsCards = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total Parcels",
      value: stats?.parcels?.total || 0,
      icon: "📦",
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      iconBg: "bg-blue-500",
    },
    {
      title: "Pending",
      value: stats?.parcels?.pending || 0,
      icon: "⏳",
      color: "yellow",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      iconBg: "bg-yellow-500",
    },
    {
      title: "In Transit",
      value: stats?.parcels?.inTransit || 0,
      icon: "🚚",
      color: "indigo",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      iconBg: "bg-indigo-500",
    },
    {
      title: "Delivered",
      value: stats?.parcels?.delivered || 0,
      icon: "✅",
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      iconBg: "bg-green-500",
    },
    {
      title: "Failed",
      value: stats?.parcels?.failed || 0,
      icon: "❌",
      color: "red",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      iconBg: "bg-red-500",
    },
    {
      title: "Today's Bookings",
      value: stats?.parcels?.daily || 0,
      icon: "📅",
      color: "purple",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      iconBg: "bg-purple-500",
    },
    {
      title: "Total Customers",
      value: stats?.users?.totalCustomers || 0,
      icon: "👥",
      color: "pink",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600",
      iconBg: "bg-pink-500",
    },
    {
      title: "Active Agents",
      value: stats?.users?.activeAgents || 0,
      icon: "🚴",
      color: "teal",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600",
      iconBg: "bg-teal-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg shadow-sm p-6 transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${card.textColor} mb-1`}>
                {card.title}
              </p>
              <p className="text-3xl font-bold text-gray-900">
                {card.value.toLocaleString()}
              </p>
            </div>
            <div
              className={`w-14 h-14 ${card.iconBg} rounded-full flex items-center justify-center text-2xl shadow-lg`}
            >
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Financial Stats Component
export const FinancialStatsCards = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  const financialCards = [
    {
      title: "Daily COD Amount",
      value: `৳${(stats?.financials?.dailyCODAmount || 0).toLocaleString()}`,
      icon: "💰",
      bgColor: "bg-gradient-to-br from-green-400 to-green-600",
      change: "+12.5%",
      changeType: "increase",
    },
    {
      title: "Total COD Collected",
      value: `৳${(stats?.financials?.totalCODAmount || 0).toLocaleString()}`,
      icon: "💵",
      bgColor: "bg-gradient-to-br from-emerald-400 to-emerald-600",
      change: "+8.2%",
      changeType: "increase",
    },
    {
      title: "Total Revenue",
      value: `৳${(stats?.financials?.totalRevenue || 0).toLocaleString()}`,
      icon: "📈",
      bgColor: "bg-gradient-to-br from-blue-400 to-blue-600",
      change: "+15.3%",
      changeType: "increase",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {financialCards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-lg shadow-lg p-6 text-white`}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium opacity-90">{card.title}</p>
            <span className="text-3xl">{card.icon}</span>
          </div>
          <p className="text-3xl font-bold mb-2">{card.value}</p>
          <div className="flex items-center text-sm">
            <span
              className={`px-2 py-1 rounded ${
                card.changeType === "increase"
                  ? "bg-white bg-opacity-20"
                  : "bg-red-500 bg-opacity-50"
              }`}
            >
              {card.changeType === "increase" ? "↑" : "↓"} {card.change}
            </span>
            <span className="ml-2 opacity-75">vs last month</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStatsCards;

import { useState, useEffect } from "react";

const DailyFinanceTracker = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries, setEntries] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount ONLY
  useEffect(() => {
    const saved = localStorage.getItem("dailyFinanceTracker");
    console.log("📂 Loading from localStorage:", saved);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("✅ Data loaded successfully:", parsed);
        setEntries(parsed);
      } catch (error) {
        console.error("❌ Error parsing data:", error);
      }
    } else {
      console.log("ℹ️ No saved data found");
    }
    
    setIsLoaded(true);
  }, []); // Empty dependency array - runs only once on mount

  // Save data to localStorage whenever entries change (but not on initial load)
  useEffect(() => {
    if (isLoaded && Object.keys(entries).length >= 0) {
      console.log("💾 Saving to localStorage:", entries);
      localStorage.setItem("dailyFinanceTracker", JSON.stringify(entries));
      
      // Verify save
      const verification = localStorage.getItem("dailyFinanceTracker");
      console.log("🔍 Verification:", verification);
    }
  }, [entries, isLoaded]);

  // Generate dates for the month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      days.push({
        day,
        date: currentDate,
        dateStr: currentDate.toISOString().split("T")[0],
      });
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);

  // Get entry for specific date
  const getEntry = (dateStr) => {
    return entries[dateStr] || { ganancias: 0, gastos: 0 };
  };

  // Update entry
  const updateEntry = (dateStr, field, value) => {
    const numValue = parseFloat(value) || 0;
    setEntries((prev) => ({
      ...prev,
      [dateStr]: {
        ...getEntry(dateStr),
        [field]: numValue,
      },
    }));
  };

  // Calculate daily balance
  const getDailyBalance = (dateStr) => {
    const entry = getEntry(dateStr);
    return entry.ganancias - entry.gastos;
  };

  // Calculate totals
  const calculateTotals = () => {
    let totalGanancias = 0;
    let totalGastos = 0;

    days.forEach((day) => {
      const entry = getEntry(day.dateStr);
      totalGanancias += entry.ganancias;
      totalGastos += entry.gastos;
    });

    return {
      ganancias: totalGanancias,
      gastos: totalGastos,
      balance: totalGanancias - totalGastos,
    };
  };

  const totals = calculateTotals();

  // Navigate months
  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Export to Excel (CSV)
  const exportToExcel = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const monthName = currentMonth.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });

    // Create CSV content with UTF-8 BOM
    let csv = "\uFEFF";
    csv += `Reporte Financiero - ${monthName}\n\n`;
    csv += "#,Fecha,Ganancias,Gastos,Balance Diario\n";

    days.forEach((day) => {
      const entry = getEntry(day.dateStr);
      const balance = getDailyBalance(day.dateStr);
      csv += `${day.day},${formatDate(day.date)},${entry.ganancias},${entry.gastos},${balance}\n`;
    });

    csv += `\nTOTAL,,${totals.ganancias},${totals.gastos},${totals.balance}\n`;

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `finanzas_${year}_${month.toString().padStart(2, "0")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Handle cell click
  const handleCellClick = (dateStr, field) => {
    setEditingCell({ dateStr, field });
  };

  // Handle cell blur
  const handleCellBlur = () => {
    setEditingCell(null);
  };

  // Handle input change
  const handleInputChange = (dateStr, field, value) => {
    updateEntry(dateStr, field, value);
  };

  const monthName = currentMonth.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Daily Finance Tracker
            </h1>
            <button
              onClick={exportToExcel}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export to Excel
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-gray-700 capitalize">
                {monthName}
              </h2>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
              >
                Today
              </button>
            </div>

            <button
              onClick={nextMonth}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-700 font-medium">
                Total Ganancias
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${formatCurrency(totals.ganancias)}
              </div>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700 font-medium">
                Total Gastos
              </div>
              <div className="text-2xl font-bold text-red-600">
                ${formatCurrency(totals.gastos)}
              </div>
            </div>
            <div
              className={`border-2 rounded-lg p-4 ${
                totals.balance >= 0
                  ? "bg-blue-50 border-blue-200"
                  : "bg-orange-50 border-orange-200"
              }`}
            >
              <div
                className={`text-sm font-medium ${
                  totals.balance >= 0 ? "text-blue-700" : "text-orange-700"
                }`}
              >
                Balance Total
              </div>
              <div
                className={`text-2xl font-bold ${
                  totals.balance >= 0 ? "text-blue-600" : "text-orange-600"
                }`}
              >
                ${formatCurrency(totals.balance)}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="px-4 py-3 text-left font-semibold border-r border-gray-600">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-semibold border-r border-gray-600">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-right font-semibold border-r border-gray-600">
                    Ganancias
                  </th>
                  <th className="px-4 py-3 text-right font-semibold border-r border-gray-600">
                    Gastos
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Balance Diario
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => {
                  const entry = getEntry(day.dateStr);
                  const balance = getDailyBalance(day.dateStr);
                  const isToday =
                    day.dateStr === new Date().toISOString().split("T")[0];

                  return (
                    <tr
                      key={day.dateStr}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        isToday ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 border-r border-gray-200 text-gray-600 font-medium">
                        {day.day}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200 text-gray-700">
                        {formatDate(day.date)}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200 text-right">
                        {editingCell?.dateStr === day.dateStr &&
                        editingCell?.field === "ganancias" ? (
                          <input
                            type="number"
                            value={entry.ganancias || ""}
                            onChange={(e) =>
                              handleInputChange(
                                day.dateStr,
                                "ganancias",
                                e.target.value
                              )
                            }
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellBlur();
                            }}
                            autoFocus
                            className="w-full text-right px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() =>
                              handleCellClick(day.dateStr, "ganancias")
                            }
                            className={`cursor-pointer px-2 py-1 rounded hover:bg-green-50 ${
                              entry.ganancias > 0
                                ? "text-green-600 font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {entry.ganancias > 0
                              ? formatCurrency(entry.ganancias)
                              : "0"}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200 text-right">
                        {editingCell?.dateStr === day.dateStr &&
                        editingCell?.field === "gastos" ? (
                          <input
                            type="number"
                            value={entry.gastos || ""}
                            onChange={(e) =>
                              handleInputChange(
                                day.dateStr,
                                "gastos",
                                e.target.value
                              )
                            }
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellBlur();
                            }}
                            autoFocus
                            className="w-full text-right px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
                          />
                        ) : (
                          <div
                            onClick={() =>
                              handleCellClick(day.dateStr, "gastos")
                            }
                            className={`cursor-pointer px-2 py-1 rounded hover:bg-red-50 ${
                              entry.gastos > 0
                                ? "text-red-600 font-semibold"
                                : "text-gray-400"
                            }`}
                          >
                            {entry.gastos > 0
                              ? formatCurrency(entry.gastos)
                              : "0"}
                          </div>
                        )}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold ${
                          balance > 0
                            ? "text-blue-600"
                            : balance < 0
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      >
                        {formatCurrency(balance)}
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-green-100 font-bold border-t-4 border-gray-800">
                  <td colSpan="2" className="px-4 py-4 text-gray-800">
                    TOTAL
                  </td>
                  <td className="px-4 py-4 text-right text-green-700 border-r border-gray-200">
                    {formatCurrency(totals.ganancias)}
                  </td>
                  <td className="px-4 py-4 text-right text-red-700 border-r border-gray-200">
                    {formatCurrency(totals.gastos)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right ${
                      totals.balance >= 0 ? "text-blue-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(totals.balance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Click on any Ganancias or Gastos cell to
            edit the amount. Press Enter or click outside to save. Your data is saved automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyFinanceTracker; 
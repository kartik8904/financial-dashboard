"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "INCOME" | "EXPENSE";
  createdAt: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (user) {
      fetchData();
    }
  }, [isLoaded, user, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/transactions?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpenses;

  const monthlyData = transactions.reduce((acc, t) => {
    const month = new Date(t.createdAt).toLocaleString("default", { month: "short" });
    const existing = acc.find((item) => item.name === month);
    if (existing) {
      if (t.type === "INCOME") existing.income += t.amount;
      else existing.expenses += t.amount;
    } else {
      acc.push({
        name: month,
        income: t.type === "INCOME" ? t.amount : 0,
        expenses: t.type === "EXPENSE" ? t.amount : 0,
      });
    }
    return acc;
  }, [] as { name: string; income: number; expenses: number }[]);

  const categoryExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce<{ [key: string]: number }>((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.entries(categoryExpenses).map(([key, value]) => ({
    name: key,
    value,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  }));

  const handlePeriodChange = (newPeriod: "week" | "month" | "year") => {
    setPeriod(newPeriod);
    fetchData();
  };

  if (!isLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5" />
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as "week" | "month" | "year")}
            className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {[
          { title: "Total Income", value: totalIncome, icon: TrendingUp, color: "green" },
          { title: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "red" },
          { title: "Net Savings", value: netSavings, icon: DollarSign, color: "blue" },
        ].map((card, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <card.icon className={`text-${card.color}-500 w-6 h-6`} />
              <div className="ml-4">
                <p className="text-gray-500">{card.title}</p>
                <h3 className="text-xl font-bold">${card.value.toLocaleString()}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Income vs Expenses Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="income" fill="#10B981" />
            <Bar dataKey="expenses" fill="#EF4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={pieData} dataKey="value" innerRadius={80} outerRadius={110} paddingAngle={5}>
              {pieData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

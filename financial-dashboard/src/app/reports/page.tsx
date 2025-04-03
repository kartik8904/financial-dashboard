"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "INCOME" | "EXPENSE";
  createdAt: string;
}

interface CategoryExpense {
  name: string;
  value: number;
  color: string;
}

export default function ReportsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"month" | "year">("month");
  const [reportType, setReportType] = useState<"income-expense" | "category-breakdown">("income-expense");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (user) {
      fetchTransactions();
    }
  }, [isLoaded, user, router, period]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions?period=${period}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const pieData: CategoryExpense[] = Object.entries(categoryExpenses).map(([key, value]) => ({
    name: key,
    value,
    color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
  }));

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <div className="flex space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as "month" | "year")}
            className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md"
          >
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as "income-expense" | "category-breakdown")}
            className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md"
          >
            <option value="income-expense">Income vs Expenses</option>
            <option value="category-breakdown">Category Breakdown</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">
            {reportType === "income-expense" ? "Income vs Expenses" : "Expense Breakdown"}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            {reportType === "income-expense" ? (
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" fill="#10B981" />
                <Bar dataKey="expenses" fill="#EF4444" />
              </BarChart>
            ) : (
              <PieChart>
                <Pie 
                  data={pieData} 
                  dataKey="value" 
                  innerRadius={80} 
                  outerRadius={110} 
                  paddingAngle={5}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Income</span>
              <span className="font-bold text-green-600">${totalIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Expenses</span>
              <span className="font-bold text-red-600">${totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Net Savings</span>
              <span className={`font-bold ${totalIncome - totalExpenses >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${(totalIncome - totalExpenses).toLocaleString()}
              </span>
            </div>
            {reportType === "category-breakdown" && (
              <div>
                <h4 className="text-md font-semibold mb-2">Top Expense Categories</h4>
                {pieData
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 3)
                  .map((category) => (
                    <div key={category.name} className="flex justify-between text-sm">
                      <span>{category.name}</span>
                      <span>${category.value.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
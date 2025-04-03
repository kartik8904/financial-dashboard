"use client";

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CSVLink } from "react-csv";
import { 
  Download, 
  Upload, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  Filter
} from "lucide-react";
import * as XLSX from 'xlsx';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "INCOME" | "EXPENSE";
  createdAt: string;
}

interface FormData {
  description: string;
  amount: string;
  category: string;
  type: "INCOME" | "EXPENSE";
}

export default function TransactionsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Transaction>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterType, setFilterType] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<FormData>({
    description: "",
    amount: "",
    category: "",
    type: "EXPENSE"
  });

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (user) {
      fetchTransactions();
    }
  }, [isLoaded, user, router]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/transactions");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch transactions: ${response.status}`);
      }
      
      const data = await response.json();
      setTransactions(data);
      setError("");
    } catch (err: any) {
      setError(`Failed to load transactions: ${err.message}`);
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    transactions.forEach(transaction => {
      if (transaction.category) {
        uniqueCategories.add(transaction.category);
      }
    });
    return Array.from(uniqueCategories);
  }, [transactions]);

  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      setError("Description is required");
      return false;
    }
    
    if (!formData.amount || isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount greater than 0");
      return false;
    }
    
    if (!formData.category.trim()) {
      setError("Category is required");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
   
    try {
      setIsLoading(true);
      
      const method = editingTransaction ? "PUT" : "POST";
      const url = editingTransaction 
        ? `/api/transactions?id=${editingTransaction.id}` 
        : "/api/transactions";
      
      const payload = {
        ...(editingTransaction && { id: editingTransaction.id }),
        userId: user?.id,
        description: formData.description.trim(),
        category: formData.category.trim(),
        amount: parseFloat(formData.amount),
        type: formData.type,
      };
      
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
     
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${editingTransaction ? 'update' : 'create'} transaction: ${response.status}`);
      }
     
      // Reset form and refresh transactions
      setFormData({
        description: "",
        amount: "",
        category: "",
        type: "EXPENSE"
      });
      setEditingTransaction(null);
      setShowModal(false);
      await fetchTransactions();
      
      // Show success message (could be implemented with a toast notification)
      console.log(`Transaction ${editingTransaction ? 'updated' : 'added'} successfully`);
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      setError(`Failed to save transaction: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
   
    try {
      setIsLoading(true);
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: "DELETE",
      });
     
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete transaction: ${response.status}`);
      }
     
      await fetchTransactions();
      console.log("Transaction deleted successfully");
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      setError(`Failed to delete transaction: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      description: transaction.description,
      amount: Math.abs(transaction.amount).toString(),
      category: transaction.category,
      type: transaction.type
    });
    setShowModal(true);
    setError(""); // Clear any previous errors
  };

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleCategoryFilter = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(transactions.map(tx => ({
      Date: new Date(tx.createdAt).toLocaleDateString(),
      Description: tx.description,
      Category: tx.category,
      Amount: tx.amount,
      Type: tx.type
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, "transactions.xlsx");
  };

  const importTransactions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        try {
          if (!evt.target) return;
          
          const binaryStr = evt.target.result;
          const workbook = XLSX.read(binaryStr, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet);
          
          if (!Array.isArray(data) || data.length === 0) {
            throw new Error("No valid data found in the file");
          }
          
          setIsLoading(true);
          
          const importedTransactions = data.map((row: any) => ({
            description: (row.Description || row.description || "").toString(),
            category: (row.Category || row.category || "").toString(),
            amount: parseFloat(row.Amount || row.amount || 0),
            type: ((row.Type || row.type || "EXPENSE").toString().toUpperCase() === "INCOME") 
              ? "INCOME" : "EXPENSE"
          }));
          
          // Send imported data to API
          const promises = importedTransactions.map(tx => 
            fetch("/api/transactions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...tx,
                userId: user?.id
              }),
            }).then(response => {
              if (!response.ok) throw new Error(`Import failed: ${response.status}`);
              return response;
            })
          );
          
          await Promise.all(promises);
          await fetchTransactions();
          alert(`Successfully imported ${importedTransactions.length} transactions`);
        } catch (error: any) {
          console.error("Error importing transactions:", error);
          setError(`Failed to import transactions: ${error.message}`);
        } finally {
          setIsLoading(false);
          // Reset the input to allow reimporting the same file
          e.target.value = '';
        }
      };
      
      reader.readAsBinaryString(file);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => {
        // Text search
        const matchesSearch = 
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Type filter
        const matchesType = 
          filterType === "ALL" || 
          tx.type === filterType;
        
        // Category filter
        const matchesCategory = 
          selectedCategories.length === 0 || 
          selectedCategories.includes(tx.category);
        
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => {
        if (sortField === "amount") {
          return sortDirection === "asc" 
            ? a.amount - b.amount 
            : b.amount - a.amount;
        } else if (sortField === "createdAt") {
          return sortDirection === "asc" 
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else {
          const aValue = a[sortField]?.toString().toLowerCase() || "";
          const bValue = b[sortField]?.toString().toLowerCase() || "";
          return sortDirection === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
      });
  }, [transactions, searchTerm, sortField, sortDirection, filterType, selectedCategories]);

  const csvData = useMemo(() => {
    return filteredTransactions.map(tx => ({
      Date: new Date(tx.createdAt).toLocaleDateString(),
      Description: tx.description,
      Category: tx.category,
      Amount: tx.type === "EXPENSE" ? `-${Math.abs(tx.amount).toFixed(2)}` : tx.amount.toFixed(2),
      Type: tx.type
    }));
  }, [filteredTransactions]);

  // Display loading spinner
  if (!isLoaded || (isLoading && transactions.length === 0)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Error message display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4 relative">
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError("")}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            <span className="text-xl">&times;</span>
          </button>
        </div>
      )}
      
      {/* Header with actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-2xl font-bold">Transactions</h1>
          
          <div className="flex flex-wrap gap-2">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filter dropdown */}
            <div className="relative inline-block">
              <button
                className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </button>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as "ALL" | "INCOME" | "EXPENSE")}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="INCOME">Income Only</option>
                <option value="EXPENSE">Expenses Only</option>
              </select>
            </div>
            
            {/* Import/Export buttons */}
            <div className="flex space-x-2">
              <button 
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                disabled={isLoading || transactions.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </button>
              
              <CSVLink 
                data={csvData} 
                filename={"transactions.csv"}
                className={`inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md ${
                  (isLoading || transactions.length === 0) ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </CSVLink>
              
              <div className="relative">
                <button 
                  onClick={() => document.getElementById('fileInput')?.click()}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </button>
                <input 
                  id="fileInput"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={importTransactions}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
              
              <button
                onClick={() => {
                  setEditingTransaction(null);
                  setFormData({
                    description: "",
                    amount: "",
                    category: "",
                    type: "EXPENSE"
                  });
                  setError("");
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </button>
            </div>
          </div>
        </div>
        
        {/* Category filter chips */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryFilter(category)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategories.includes(category)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date</span>
                    {sortField === "createdAt" ? (
                      sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("description")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Description</span>
                    {sortField === "description" ? (
                      sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("category")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    {sortField === "category" ? (
                      sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Amount</span>
                    {sortField === "amount" ? (
                      sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading && transactions.length > 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700">
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                      transaction.type === "EXPENSE" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                    }`}>
                      {transaction.type === "EXPENSE" ? "-" : "+"} 
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as "INCOME" | "EXPENSE" })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                >
                  <option value="EXPENSE">Expense</option>
                  <option value="INCOME">Income</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                    list="categoryOptions"
                    disabled={isLoading}
                  />
                  <datalist id="categoryOptions">
                    {categories.map(category => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <div className="animate-spin h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></div>
                      {editingTransaction ? "Updating..." : "Adding..."}
                    </span>
                  ) : (
                    editingTransaction ? "Update" : "Add"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


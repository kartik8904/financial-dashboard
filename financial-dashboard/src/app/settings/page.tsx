"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [budgetAlertThreshold, setBudgetAlertThreshold] = useState(80);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    // Load settings from localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    const savedNotifications = localStorage.getItem('notificationsEnabled') === 'true';
    const savedBudgetThreshold = parseInt(localStorage.getItem('budgetAlertThreshold') || '80');

    setDarkMode(savedDarkMode);
    setCurrency(savedCurrency);
    setNotificationsEnabled(savedNotifications);
    setBudgetAlertThreshold(savedBudgetThreshold);

    // Apply dark mode
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
    localStorage.setItem('currency', currency);
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
    localStorage.setItem('budgetAlertThreshold', budgetAlertThreshold.toString());

    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    alert('Settings saved successfully!');
  };

  if (!isLoaded || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">App Settings</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <span>Dark Mode</span>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                />
                <div className={`
                  w-10 h-4 ${darkMode ? 'bg-blue-600' : 'bg-gray-400'} 
                  rounded-full shadow-inner transition
                `}></div>
                <div className={`
                  dot absolute left-0 top-1/2 transform -translate-y-1/2 
                  w-6 h-6 bg-white rounded-full shadow 
                  transition-all ${darkMode ? 'translate-x-full' : ''}
                `}></div>
              </div>
            </label>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="currency">Default Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-md"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span>Budget Notifications</span>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={notificationsEnabled}
                    onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                  />
                  <div className={`
                    w-10 h-4 ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-400'} 
                    rounded-full shadow-inner transition
                  `}></div>
                  <div className={`
                    dot absolute left-0 top-1/2 transform -translate-y-1/2 
                    w-6 h-6 bg-white rounded-full shadow 
                    transition-all ${notificationsEnabled ? 'translate-x-full' : ''}
                  `}></div>
                </div>
              </label>
            </div>

            {notificationsEnabled && (
              <div className="flex items-center justify-between">
                <label htmlFor="budgetThreshold">Budget Alert Threshold (%)</label>
                <input
                  id="budgetThreshold"
                  type="range"
                  min="50"
                  max="100"
                  value={budgetAlertThreshold}
                  onChange={(e) => setBudgetAlertThreshold(parseInt(e.target.value))}
                  className="w-1/2"
                />
                <span>{budgetAlertThreshold}%</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Account</h2>
          <div className="space-y-4">
            <div>
              <strong>Name:</strong> {user.fullName}
            </div>
            <div>
              <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
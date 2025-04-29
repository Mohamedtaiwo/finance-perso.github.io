import { useState, useEffect } from 'react';
import Overview from './components/Overview';
import IncomeTab from './components/IncomeTab';
import SubscriptionsTab from './components/SubscriptionsTab';
import ExpensesTab from './components/ExpensesTab';
import SavingsTab from './components/SavingsTab';
import DebtsTab from './components/DebtsTab';
import ReceivablesTab from './components/ReceivablesTab';

const Dashboard = () => {
  const [financialData, setFinancialData] = useState({
    income: [],
    subscriptions: [],
    expenses: [],
    savings: { current: 0, goal: 0, targetDate: null },
    debts: [],
    receivables: []
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    // Charger les données financières du localStorage
    const storedData = localStorage.getItem('financialData');
    if (storedData) {
      setFinancialData(JSON.parse(storedData));
    }
  }, []);

  // Calcul des montants totaux
  const calculateTotals = () => {
    const totalIncome = financialData.income.reduce((sum, item) => sum + item.amount, 0);
    const totalSubscriptions = financialData.subscriptions.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = financialData.expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalDebts = financialData.debts.reduce((sum, item) => sum + item.remainingAmount, 0);
    const totalReceivables = financialData.receivables.reduce((sum, item) => sum + item.amount, 0);
    
    const monthlyBalance = totalIncome - totalSubscriptions - totalExpenses;
    const currentSavings = financialData.savings.current;
    
    return {
      totalIncome,
      totalSubscriptions,
      totalExpenses,
      totalDebts,
      totalReceivables,
      monthlyBalance,
      currentSavings
    };
  };

  const logout = () => {
    localStorage.setItem('isLoggedIn', 'false');
    window.location.reload();
  };

  // Fonction pour mettre à jour les données financières
  const updateFinancialData = (category, newData) => {
    const updatedData = { ...financialData, [category]: newData };
    setFinancialData(updatedData);
    localStorage.setItem('financialData', JSON.stringify(updatedData));
  };

  // Fonction pour afficher le contenu en fonction de l'onglet actif
  const renderTabContent = () => {
    switch(activeTab) {
      case 'overview':
        return <Overview totals={calculateTotals()} />;
      case 'income':
        return <IncomeTab income={financialData.income} updateData={updateFinancialData} />;
      case 'subscriptions':
        return <SubscriptionsTab subscriptions={financialData.subscriptions} updateData={updateFinancialData} />;
      case 'expenses':
        return <ExpensesTab expenses={financialData.expenses} updateData={updateFinancialData} />;
      case 'savings':
        return <SavingsTab savings={financialData.savings} updateData={updateFinancialData} />;
      case 'debts':
        return <DebtsTab debts={financialData.debts} updateData={updateFinancialData} />;
      case 'receivables':
        return <ReceivablesTab receivables={financialData.receivables} updateData={updateFinancialData} />;
      default:
        return <Overview totals={calculateTotals()} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              className="md:hidden mr-2 p-2"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Finance Manager</h1>
          </div>
          <button 
            className="px-3 py-1 bg-indigo-800 hover:bg-indigo-900 rounded"
            onClick={logout}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar pour navigation */}
        <aside className={`bg-indigo-800 text-white w-64 flex-shrink-0 ${showSidebar ? 'block' : 'hidden'} md:block transition-all duration-300 ease-in-out fixed md:static h-full z-10`}>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button 
                  className={`w-full text-left py-2 px-4 rounded ${activeTab === 'overview' ? 'bg-indigo-900' : 'hover:bg-indigo-700'}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Vue d'ensemble
                </button>
              </li>
              <li>
                <button 
                  className={`w-full text-left py-2 px-4 rounded ${activeTab === 'income' ? 'bg-indigo-900' : 'hover:bg-indigo-700'}`}
                  onClick={() => setActiveTab('income')}
                >
                  Revenus
                </button>
              </li>
              <li>
                <button 
                  className={`w-full text-left py-2 px-4 rounded ${activeTab === 'subscriptions' ? 'bg-indigo-900' : 'hover:bg-indigo-700'}`}
                  onClick={() => setActiveTab('subscriptions')}
                >
                  Abonnements
                </button>
              </li>
              <li>
                <button 
                  className={`w-full text-left py-2 px-4 rounded ${activeTab === 'expenses' ? 'bg-indigo-900' : 'hover:bg-indigo-700'}`}
                  onClick={() => setActiveTab('expenses')}
                >
                  Dépenses
                </button>
              </li>
              <li>
                <button 
                  className={`w-full text-left py-2 px-4 rounded ${activeTab === 'savings' ? 'bg-indigo-900' : 'hover:bg-indigo-700'}`}
                  onClick={() => setActiveTab('savings')}
                >
                  Épargne
                </button>
              </li>
              <li>
                <button 
                  className={`w-full text-left py-2 px-4 rounded ${activeTab === 'debts' ? 'bg-indigo-900' : 'hover:bg-indigo-700'}`}
                  onClick={() => setActiveTab('debts')}
                >
                  Dettes
                </button>
              </li>
              <li>
                <button 
                  className={`w-full text-left py-2 px-4 rounded ${activeTab === 'receivables' ? 'bg-indigo-900' : 'hover:bg-indigo-700'}`}
                  onClick={() => setActiveTab('receivables')}
                >
                  À recevoir
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
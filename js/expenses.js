/**
 * Fichier de gestion des dépenses quotidiennes
 * Ce fichier gère l'ajout, la modification et la suppression des dépenses
 */

// Initialiser la page des dépenses
function initExpensesPage() {
    // Récupérer les données financières
    let financeData = window.Storage.getUserFinanceData();
    
    // Si les données n'existent pas, les initialiser
    if (!financeData) {
        financeData = window.Storage.initializeUserFinanceData();
    }
    
    if (!financeData) {
        console.error('Impossible de charger ou d\'initialiser les données financières');
        return;
    }
    
    // Mettre à jour la page avec les données
    updateExpensesPage(financeData);
    
    // Initialiser les gestionnaires d'événements
    initExpensesEventListeners();
}

// Mettre à jour la page des dépenses avec les dernières données
function updateExpensesPage(financeData) {
    // S'assurer que la structure existe
    if (!financeData.expenses) {
        financeData.expenses = [];
    }
    
    // Effacer et mettre à jour le tableau des dépenses
    const tableBody = document.getElementById('expenses-body');
    
    // Si le tableau n'existe pas encore sur la page, ne rien faire
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Obtenir seulement les dépenses du mois en cours
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    let totalMonthExpenses = 0;
    
    // Trier les dépenses par date (les plus récentes en premier)
    const sortedExpenses = [...financeData.expenses].sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedExpenses.forEach(expense => {
        if (!expense.date) return;
        
        const expDate = new Date(expense.date);
        const row = document.createElement('tr');
        
        const descCell = document.createElement('td');
        descCell.textContent = expense.description || '';
        descCell.setAttribute('data-label', 'Description');
        row.appendChild(descCell);
        
        const amountCell = document.createElement('td');
        amountCell.textContent = window.Storage.formatCurrency(expense.amount || 0);
        amountCell.classList.add('amount', 'negative');
        amountCell.setAttribute('data-label', 'Montant');
        row.appendChild(amountCell);
        
        const categoryCell = document.createElement('td');
        let categoryText = '';
        switch(expense.category) {
            case 'food': categoryText = 'Alimentation'; break;
            case 'transport': categoryText = 'Transport'; break;
            case 'leisure': categoryText = 'Loisirs'; break;
            case 'shopping': categoryText = 'Shopping'; break;
            case 'health': categoryText = 'Santé'; break;
            default: categoryText = 'Autre';
        }
        categoryCell.textContent = categoryText;
        categoryCell.setAttribute('data-label', 'Catégorie');
        row.appendChild(categoryCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = expDate.toLocaleDateString('fr-FR');
        dateCell.setAttribute('data-label', 'Date');
        row.appendChild(dateCell);
        
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('table-actions');
        actionsCell.setAttribute('data-label', 'Actions');
        
        const editBtn = document.createElement('span');
        editBtn.classList.add('action-icon');
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Modifier';
        editBtn.addEventListener('click', function() {
            editExpense(expense);
        });
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('action-icon', 'delete-icon');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Supprimer';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
                deleteExpense(expense.id);
            }
        });
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
        
        // Ajouter au total mensuel si la dépense est de ce mois-ci
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            totalMonthExpenses += expense.amount || 0;
        }
    });
    
    // Mettre à jour le total des dépenses pour ce mois
    const expensesTotalElement = document.getElementById('expenses-total');
    if (expensesTotalElement) {
        expensesTotalElement.textContent = window.Storage.formatCurrency(totalMonthExpenses);
    }
    
    // Mettre à jour le tableau de bord après la mise à jour des dépenses
    if (window.Dashboard) {
        if (typeof window.Dashboard.updateDashboardSummary === 'function') {
            window.Dashboard.updateDashboardSummary(financeData);
        }
        
        // Vérifier le solde et alerter si nécessaire
        if (typeof window.Dashboard.checkBalanceAndAlert === 'function') {
            window.Dashboard.checkBalanceAndAlert(financeData);
        }
    }
}

// Initialiser les gestionnaires d'événements pour la page des dépenses
function initExpensesEventListeners() {
    // Bouton d'ajout de dépense
    const addExpenseBtn = document.getElementById('add-expense-btn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {
            openExpenseModal();
        });
    }
    
    // Fermeture de la modale
    const closeExpenseModal = document.getElementById('close-expense-modal');
    if (closeExpenseModal) {
        closeExpenseModal.addEventListener('click', function() {
            document.getElementById('expense-modal').style.display = 'none';
        });
    }
    
    // Bouton d'annulation
    const cancelExpense = document.getElementById('cancel-expense');
    if (cancelExpense) {
        cancelExpense.addEventListener('click', function() {
            document.getElementById('expense-modal').style.display = 'none';
        });
    }
    
    // Formulaire d'ajout/modification de dépense
    const expenseForm = document.getElementById('expense-form');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveExpense();
        });
    }
}

// Ouvrir la modale d'ajout/modification de dépense
function openExpenseModal(expense = null) {
    const modalTitle = document.getElementById('expense-modal-title');
    const expenseForm = document.getElementById('expense-form');
    
    if (!modalTitle || !expenseForm) return;
    
    // Réinitialiser le formulaire
    expenseForm.reset();
    
    if (expense) {
        // Mode édition
        modalTitle.textContent = 'Modifier la dépense';
        document.getElementById('expense-description').value = expense.description || '';
        document.getElementById('expense-amount').value = expense.amount || 0;
        document.getElementById('expense-category').value = expense.category || 'other';
        document.getElementById('expense-date').value = expense.date || '';
        expenseForm.setAttribute('data-id', expense.id);
    } else {
        // Mode ajout
        modalTitle.textContent = 'Ajouter une dépense';
        const dateInput = document.getElementById('expense-date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        expenseForm.removeAttribute('data-id');
    }
    
    const modal = document.getElementById('expense-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Enregistrer une dépense (ajout ou modification)
function saveExpense() {
    const descriptionInput = document.getElementById('expense-description');
    const amountInput = document.getElementById('expense-amount');
    const categoryInput = document.getElementById('expense-category');
    const dateInput = document.getElementById('expense-date');
    const expenseForm = document.getElementById('expense-form');
    
    if (!descriptionInput || !amountInput || !categoryInput || !dateInput || !expenseForm) return;
    
    const description = descriptionInput.value;
    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const expenseId = expenseForm.getAttribute('data-id');
    
    let financeData = window.Storage.getUserFinanceData();
    
    // Si les données n'existent pas, les initialiser
    if (!financeData) {
        financeData = window.Storage.initializeUserFinanceData();
    }
    
    if (!financeData) return;
    
    // S'assurer que la structure expenses existe
    if (!financeData.expenses) {
        financeData.expenses = [];
    }
    
    if (expenseId) {
        // Mode édition
        const expenseIndex = financeData.expenses.findIndex(expense => expense.id && expense.id.toString() === expenseId);
        if (expenseIndex !== -1) {
            financeData.expenses[expenseIndex] = {
                ...financeData.expenses[expenseIndex],
                description,
                amount,
                category,
                date
            };
        }
    } else {
        // Mode ajout
        const newExpense = {
            id: Date.now(),
            description,
            amount,
            category,
            date
        };
        
        financeData.expenses.push(newExpense);
    }
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateExpensesPage(financeData);
    
    // Fermer la modale
    const modal = document.getElementById('expense-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Afficher une notification
    if (window.Dashboard && typeof window.Dashboard.showNotification === 'function') {
        window.Dashboard.showNotification(
            expenseId ? 'Dépense modifiée avec succès' : 'Dépense ajoutée avec succès', 
            'success'
        );
    }
}

// Modifier une dépense existante
function editExpense(expense) {
    openExpenseModal(expense);
}

// Supprimer une dépense
function deleteExpense(expenseId) {
    let financeData = window.Storage.getUserFinanceData();
    
    if (!financeData || !financeData.expenses) return;
    
    financeData.expenses = financeData.expenses.filter(expense => expense.id !== expenseId);
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateExpensesPage(financeData);
    
    // Afficher une notification
    if (window.Dashboard && typeof window.Dashboard.showNotification === 'function') {
        window.Dashboard.showNotification('Dépense supprimée avec succès', 'success');
    }
}

// Obtenir les statistiques de dépenses par catégorie pour le mois courant
function getExpenseStatsByCategory() {
    let financeData = window.Storage.getUserFinanceData();
    
    if (!financeData || !financeData.expenses) return {};
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Initialiser les catégories
    const categories = {
        food: { label: 'Alimentation', amount: 0, color: '#4ade80' },
        transport: { label: 'Transport', amount: 0, color: '#60a5fa' },
        leisure: { label: 'Loisirs', amount: 0, color: '#f59e0b' },
        shopping: { label: 'Shopping', amount: 0, color: '#8b5cf6' },
        health: { label: 'Santé', amount: 0, color: '#ec4899' },
        other: { label: 'Autre', amount: 0, color: '#6b7280' }
    };
    
    // Calculer le montant pour chaque catégorie
    financeData.expenses.forEach(expense => {
        if (!expense.date) return;
        
        const expDate = new Date(expense.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            const category = expense.category || 'other';
            if (categories[category]) {
                categories[category].amount += expense.amount || 0;
            } else {
                categories.other.amount += expense.amount || 0;
            }
        }
    });
    
    return categories;
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Expenses = {
    initExpensesPage,
    updateExpensesPage,
    openExpenseModal,
    saveExpense,
    editExpense,
    deleteExpense,
    getExpenseStatsByCategory
};

// Initialiser la page des dépenses au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Si nous sommes sur la page app.html, initialiser la page des dépenses
    if (document.getElementById('expenses')) {
        initExpensesPage();
    }
});
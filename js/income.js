/**
 * Fichier de gestion des revenus
 * Ce fichier gère l'ajout, la modification et la suppression des revenus
 */

// Initialiser la page de revenus
function initIncomePage() {
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
    updateIncomePage(financeData);
    
    // Initialiser les gestionnaires d'événements
    initIncomeEventListeners();
}

// Mettre à jour la page de revenus avec les dernières données
function updateIncomePage(financeData) {
    // S'assurer que la structure existe
    if (!financeData.income) {
        financeData.income = { salary: 0, otherIncome: [] };
    }
    if (!financeData.income.otherIncome) {
        financeData.income.otherIncome = [];
    }
    
    // Mettre à jour la valeur du salaire
    const salaryElement = document.getElementById('salary-value');
    if (salaryElement) {
        salaryElement.textContent = window.Storage.formatCurrency(financeData.income.salary || 0);
    }
    
    // Effacer et mettre à jour le tableau des autres revenus
    const tableBody = document.getElementById('other-income-body');
    
    // Si le tableau n'existe pas encore sur la page, ne rien faire
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    financeData.income.otherIncome.forEach(income => {
        const row = document.createElement('tr');
        
        const descCell = document.createElement('td');
        descCell.textContent = income.description || '';
        descCell.setAttribute('data-label', 'Description');
        row.appendChild(descCell);
        
        const amountCell = document.createElement('td');
        amountCell.textContent = window.Storage.formatCurrency(income.amount || 0);
        amountCell.classList.add('amount', 'positive');
        amountCell.setAttribute('data-label', 'Montant');
        row.appendChild(amountCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = income.date ? new Date(income.date).toLocaleDateString('fr-FR') : '';
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
            editIncome(income);
        });
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('action-icon', 'delete-icon');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Supprimer';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce revenu ?')) {
                deleteIncome(income.id);
            }
        });
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
    });
    
    // Mettre à jour le tableau de bord après la mise à jour des revenus
    if (window.Dashboard && typeof window.Dashboard.updateDashboardSummary === 'function') {
        window.Dashboard.updateDashboardSummary(financeData);
    }
}

// Initialiser les gestionnaires d'événements pour la page de revenus
function initIncomeEventListeners() {
    // Bouton d'ajout de revenu
    const addIncomeBtn = document.getElementById('add-income-btn');
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', function() {
            openIncomeModal();
        });
    }
    
    // Bouton d'édition du salaire
    const editSalaryBtn = document.getElementById('edit-salary-btn');
    if (editSalaryBtn) {
        editSalaryBtn.addEventListener('click', function() {
            openSalaryModal();
        });
    }
    
    // Fermeture des modales
    const closeIncomeModal = document.getElementById('close-income-modal');
    if (closeIncomeModal) {
        closeIncomeModal.addEventListener('click', function() {
            document.getElementById('income-modal').style.display = 'none';
        });
    }
    
    const closeSalaryModal = document.getElementById('close-salary-modal');
    if (closeSalaryModal) {
        closeSalaryModal.addEventListener('click', function() {
            document.getElementById('salary-modal').style.display = 'none';
        });
    }
    
    // Boutons d'annulation
    const cancelIncome = document.getElementById('cancel-income');
    if (cancelIncome) {
        cancelIncome.addEventListener('click', function() {
            document.getElementById('income-modal').style.display = 'none';
        });
    }
    
    const cancelSalary = document.getElementById('cancel-salary');
    if (cancelSalary) {
        cancelSalary.addEventListener('click', function() {
            document.getElementById('salary-modal').style.display = 'none';
        });
    }
    
    // Formulaire d'ajout/modification de revenu
    const incomeForm = document.getElementById('income-form');
    if (incomeForm) {
        incomeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveIncome();
        });
    }
    
    // Formulaire de modification du salaire
    const salaryForm = document.getElementById('salary-form');
    if (salaryForm) {
        salaryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSalary();
        });
    }
}

// Ouvrir la modale d'ajout/modification de revenu
function openIncomeModal(income = null) {
    const modalTitle = document.getElementById('income-modal-title');
    const incomeForm = document.getElementById('income-form');
    
    if (!modalTitle || !incomeForm) return;
    
    // Réinitialiser le formulaire
    incomeForm.reset();
    
    if (income) {
        // Mode édition
        modalTitle.textContent = 'Modifier le revenu';
        document.getElementById('income-description').value = income.description || '';
        document.getElementById('income-amount').value = income.amount || 0;
        document.getElementById('income-date').value = income.date || '';
        incomeForm.setAttribute('data-id', income.id);
    } else {
        // Mode ajout
        modalTitle.textContent = 'Ajouter un revenu';
        const dateInput = document.getElementById('income-date');
        if (dateInput) {
            dateInput.valueAsDate = new Date();
        }
        incomeForm.removeAttribute('data-id');
    }
    
    const modal = document.getElementById('income-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Ouvrir la modale de modification du salaire
function openSalaryModal() {
    let financeData = window.Storage.getUserFinanceData();
    
    // Si les données n'existent pas, les initialiser
    if (!financeData) {
        financeData = window.Storage.initializeUserFinanceData();
    }
    
    if (!financeData) return;
    
    // S'assurer que la structure income existe
    if (!financeData.income) {
        financeData.income = { salary: 0, otherIncome: [] };
    }
    
    const salaryInput = document.getElementById('salary-amount');
    if (salaryInput) {
        salaryInput.value = financeData.income.salary || 0;
    }
    
    const modal = document.getElementById('salary-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Enregistrer un revenu (ajout ou modification)
function saveIncome() {
    const descriptionInput = document.getElementById('income-description');
    const amountInput = document.getElementById('income-amount');
    const dateInput = document.getElementById('income-date');
    const incomeForm = document.getElementById('income-form');
    
    if (!descriptionInput || !amountInput || !dateInput || !incomeForm) return;
    
    const description = descriptionInput.value;
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const incomeId = incomeForm.getAttribute('data-id');
    
    let financeData = window.Storage.getUserFinanceData();
    
    // Si les données n'existent pas, les initialiser
    if (!financeData) {
        financeData = window.Storage.initializeUserFinanceData();
    }
    
    if (!financeData) return;
    
    // S'assurer que la structure income existe
    if (!financeData.income) {
        financeData.income = { salary: 0, otherIncome: [] };
    }
    if (!financeData.income.otherIncome) {
        financeData.income.otherIncome = [];
    }
    
    if (incomeId) {
        // Mode édition
        const incomeIndex = financeData.income.otherIncome.findIndex(income => income.id && income.id.toString() === incomeId);
        if (incomeIndex !== -1) {
            financeData.income.otherIncome[incomeIndex] = {
                ...financeData.income.otherIncome[incomeIndex],
                description,
                amount,
                date
            };
        }
    } else {
        // Mode ajout
        const newIncome = {
            id: Date.now(),
            description,
            amount,
            date
        };
        
        financeData.income.otherIncome.push(newIncome);
    }
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateIncomePage(financeData);
    
    // Fermer la modale
    const modal = document.getElementById('income-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Afficher une notification
    if (window.Dashboard && typeof window.Dashboard.showNotification === 'function') {
        window.Dashboard.showNotification(
            incomeId ? 'Revenu modifié avec succès' : 'Revenu ajouté avec succès', 
            'success'
        );
    }
}

// Enregistrer le salaire
function saveSalary() {
    const salaryInput = document.getElementById('salary-amount');
    if (!salaryInput) return;
    
    const salaryAmount = parseFloat(salaryInput.value);
    
    let financeData = window.Storage.getUserFinanceData();
    
    // Si les données n'existent pas, les initialiser
    if (!financeData) {
        financeData = window.Storage.initializeUserFinanceData();
    }
    
    if (!financeData) return;
    
    // S'assurer que la structure income existe
    if (!financeData.income) {
        financeData.income = { salary: 0, otherIncome: [] };
    }
    
    financeData.income.salary = salaryAmount;
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateIncomePage(financeData);
    
    // Fermer la modale
    const modal = document.getElementById('salary-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Afficher une notification
    if (window.Dashboard && typeof window.Dashboard.showNotification === 'function') {
        window.Dashboard.showNotification('Salaire mis à jour avec succès', 'success');
    }
}

// Modifier un revenu existant
function editIncome(income) {
    openIncomeModal(income);
}

// Supprimer un revenu
function deleteIncome(incomeId) {
    let financeData = window.Storage.getUserFinanceData();
    
    if (!financeData || !financeData.income || !financeData.income.otherIncome) return;
    
    financeData.income.otherIncome = financeData.income.otherIncome.filter(income => income.id !== incomeId);
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateIncomePage(financeData);
    
    // Afficher une notification
    if (window.Dashboard && typeof window.Dashboard.showNotification === 'function') {
        window.Dashboard.showNotification('Revenu supprimé avec succès', 'success');
    }
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Income = {
    initIncomePage,
    updateIncomePage,
    openIncomeModal,
    openSalaryModal,
    saveIncome,
    saveSalary,
    editIncome,
    deleteIncome
};

// Initialiser la page de revenus au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Si nous sommes sur la page app.html, initialiser la page de revenus
    if (document.getElementById('income')) {
        initIncomePage();
    }
});
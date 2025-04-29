/**
 * Fichier de gestion des dettes
 * Ce fichier gère l'ajout, la modification et le remboursement des dettes
 */

// Initialiser la page des dettes
function initDebtPage() {
    // Récupérer les données financières
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) {
        console.error('Impossible de charger les données financières');
        return;
    }
    
    // Mettre à jour la page avec les données
    updateDebtPage(financeData);
    
    // Initialiser les gestionnaires d'événements
    initDebtEventListeners();
}

// Mettre à jour la page des dettes avec les dernières données
function updateDebtPage(financeData) {
    // Effacer et mettre à jour le tableau des dettes
    const tableBody = document.getElementById('debt-body');
    tableBody.innerHTML = '';
    
    // Si le tableau n'existe pas encore sur la page, ne rien faire
    if (!tableBody) return;
    
    let totalDebt = 0;
    
    // Trier les dettes par montant restant (du plus grand au plus petit)
    const sortedDebts = [...financeData.debt].sort((a, b) => {
        return b.remainingAmount - a.remainingAmount;
    });
    
    sortedDebts.forEach(debt => {
        const row = document.createElement('tr');
        
        const descCell = document.createElement('td');
        descCell.textContent = debt.description;
        descCell.setAttribute('data-label', 'Description');
        row.appendChild(descCell);
        
        const initialCell = document.createElement('td');
        initialCell.textContent = window.Storage.formatCurrency(debt.initialAmount);
        initialCell.setAttribute('data-label', 'Montant initial');
        row.appendChild(initialCell);
        
        const remainingCell = document.createElement('td');
        remainingCell.textContent = window.Storage.formatCurrency(debt.remainingAmount);
        remainingCell.classList.add('amount', 'negative');
        remainingCell.setAttribute('data-label', 'Montant restant');
        row.appendChild(remainingCell);
        
        const rateCell = document.createElement('td');
        rateCell.textContent = `${debt.interestRate}%`;
        rateCell.setAttribute('data-label', 'Taux d\'intérêt');
        row.appendChild(rateCell);
        
        const paymentCell = document.createElement('td');
        paymentCell.textContent = window.Storage.formatCurrency(debt.monthlyPayment);
        paymentCell.setAttribute('data-label', 'Paiement mensuel');
        row.appendChild(paymentCell);
        
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('table-actions');
        actionsCell.setAttribute('data-label', 'Actions');
        
        const payBtn = document.createElement('span');
        payBtn.classList.add('action-icon');
        payBtn.innerHTML = '💸';
        payBtn.title = 'Effectuer un paiement';
        payBtn.addEventListener('click', function() {
            makeDebtPayment(debt);
        });
        actionsCell.appendChild(payBtn);
        
        const editBtn = document.createElement('span');
        editBtn.classList.add('action-icon');
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Modifier';
        editBtn.addEventListener('click', function() {
            editDebt(debt);
        });
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('action-icon', 'delete-icon');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Supprimer';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette dette ?')) {
                deleteDebt(debt.id);
            }
        });
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
        
        totalDebt += debt.remainingAmount;
    });
    
    // Mettre à jour le total des dettes
    document.getElementById('debt-total').textContent = window.Storage.formatCurrency(totalDebt);
    
    // Mettre à jour le tableau de bord après la mise à jour des dettes
    if (window.Dashboard) {
        window.Dashboard.updateDashboardSummary(financeData);
    }
}

// Initialiser les gestionnaires d'événements pour la page des dettes
function initDebtEventListeners() {
    // Bouton d'ajout de dette
    const addDebtBtn = document.getElementById('add-debt-btn');
    if (addDebtBtn) {
        addDebtBtn.addEventListener('click', function() {
            openDebtModal();
        });
    }
    
    // Fermeture de la modale
    const closeDebtModal = document.getElementById('close-debt-modal');
    if (closeDebtModal) {
        closeDebtModal.addEventListener('click', function() {
            document.getElementById('debt-modal').style.display = 'none';
        });
    }
    
    // Bouton d'annulation
    const cancelDebt = document.getElementById('cancel-debt');
    if (cancelDebt) {
        cancelDebt.addEventListener('click', function() {
            document.getElementById('debt-modal').style.display = 'none';
        });
    }
    
    // Formulaire d'ajout/modification de dette
    const debtForm = document.getElementById('debt-form');
    if (debtForm) {
        debtForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveDebt();
        });
    }
}

// Ouvrir la modale d'ajout/modification de dette
function openDebtModal(debt = null) {
    const modalTitle = document.getElementById('debt-modal-title');
    const debtForm = document.getElementById('debt-form');
    
    // Réinitialiser le formulaire
    debtForm.reset();
    
    if (debt) {
        // Mode édition
        modalTitle.textContent = 'Modifier la dette';
        document.getElementById('debt-description').value = debt.description;
        document.getElementById('debt-initial').value = debt.initialAmount;
        document.getElementById('debt-remaining').value = debt.remainingAmount;
        document.getElementById('debt-rate').value = debt.interestRate;
        document.getElementById('debt-payment').value = debt.monthlyPayment;
        debtForm.setAttribute('data-id', debt.id);
    } else {
        // Mode ajout
        modalTitle.textContent = 'Ajouter une dette';
        debtForm.removeAttribute('data-id');
    }
    
    document.getElementById('debt-modal').style.display = 'flex';
}

// Enregistrer une dette (ajout ou modification)
function saveDebt() {
    const description = document.getElementById('debt-description').value;
    const initialAmount = parseFloat(document.getElementById('debt-initial').value);
    const remainingAmount = parseFloat(document.getElementById('debt-remaining').value);
    const interestRate = parseFloat(document.getElementById('debt-rate').value);
    const monthlyPayment = parseFloat(document.getElementById('debt-payment').value);
    const debtForm = document.getElementById('debt-form');
    const debtId = debtForm.getAttribute('data-id');
    
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    if (debtId) {
        // Mode édition
        const debtIndex = financeData.debt.findIndex(debt => debt.id.toString() === debtId);
        if (debtIndex !== -1) {
            financeData.debt[debtIndex] = {
                ...financeData.debt[debtIndex],
                description,
                initialAmount,
                remainingAmount,
                interestRate,
                monthlyPayment
            };
        }
    } else {
        // Mode ajout
        const newDebt = {
            id: Date.now(),
            description,
            initialAmount,
            remainingAmount,
            interestRate,
            monthlyPayment
        };
        
        financeData.debt.push(newDebt);
    }
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateDebtPage(financeData);
    
    // Fermer la modale
    document.getElementById('debt-modal').style.display = 'none';
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification(
            debtId ? 'Dette modifiée avec succès' : 'Dette ajoutée avec succès', 
            'success'
        );
    }
}

// Effectuer un paiement sur une dette
function makeDebtPayment(debt) {
    const payment = prompt('Entrez le montant du paiement :', debt.monthlyPayment);
    if (payment === null) return;
    
    const paymentAmount = parseFloat(payment);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        alert('Veuillez entrer un montant valide.');
        return;
    }
    
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    const debtIndex = financeData.debt.findIndex(d => d.id === debt.id);
    if (debtIndex === -1) return;
    
    // Mettre à jour le montant restant
    financeData.debt[debtIndex].remainingAmount = Math.max(0, financeData.debt[debtIndex].remainingAmount - paymentAmount);
    
    // Si la dette est entièrement remboursée, demander si elle doit être supprimée
    if (financeData.debt[debtIndex].remainingAmount === 0) {
        if (confirm('Cette dette est entièrement remboursée. Voulez-vous la supprimer de la liste ?')) {
            financeData.debt = financeData.debt.filter(d => d.id !== debt.id);
            
            // Afficher une notification
            if (window.Dashboard) {
                window.Dashboard.showNotification('Dette entièrement remboursée et supprimée', 'success');
            }
        }
    } else {
        // Afficher une notification
        if (window.Dashboard) {
            window.Dashboard.showNotification(`Paiement de ${window.Storage.formatCurrency(paymentAmount)} effectué avec succès`, 'success');
        }
    }
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateDebtPage(financeData);
}

// Modifier une dette existante
function editDebt(debt) {
    openDebtModal(debt);
}

// Supprimer une dette
function deleteDebt(debtId) {
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    financeData.debt = financeData.debt.filter(debt => debt.id !== debtId);
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateDebtPage(financeData);
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification('Dette supprimée avec succès', 'success');
    }
}

// Calculer le temps restant pour rembourser une dette
function calculateTimeToPayOff(debt) {
    if (debt.monthlyPayment <= 0 || debt.remainingAmount <= 0) {
        return {
            months: 0,
            totalInterest: 0
        };
    }
    
    let balance = debt.remainingAmount;
    let months = 0;
    let totalInterest = 0;
    const monthlyInterestRate = debt.interestRate / 100 / 12;
    
    while (balance > 0 && months < 1200) { // Maximum 100 ans (1200 mois)
        // Calculer les intérêts pour ce mois
        const monthlyInterest = balance * monthlyInterestRate;
        totalInterest += monthlyInterest;
        
        // Appliquer le paiement
        balance = balance + monthlyInterest - debt.monthlyPayment;
        
        months++;
    }
    
    return {
        months,
        totalInterest
    };
}

// Calculer la stratégie optimale de remboursement (méthode de l'avalanche ou boule de neige)
function calculateOptimalPayoffStrategy(debts, additionalPayment = 0) {
    // Si pas de dettes, retourner des tableaux vides
    if (!debts || debts.length === 0) {
        return {
            avalancheStrategy: [],
            snowballStrategy: []
        };
    }
    
    // Copier les dettes pour ne pas modifier l'original
    const debtsForAvalanche = JSON.parse(JSON.stringify(debts));
    const debtsForSnowball = JSON.parse(JSON.stringify(debts));
    
    // Stratégie de l'avalanche : trier par taux d'intérêt (du plus élevé au plus bas)
    const avalancheStrategy = debtsForAvalanche.sort((a, b) => b.interestRate - a.interestRate);
    
    // Stratégie de la boule de neige : trier par montant restant (du plus petit au plus grand)
    const snowballStrategy = debtsForSnowball.sort((a, b) => a.remainingAmount - b.remainingAmount);
    
    return {
        avalancheStrategy,
        snowballStrategy
    };
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Debt = {
    initDebtPage,
    updateDebtPage,
    openDebtModal,
    saveDebt,
    makeDebtPayment,
    editDebt,
    deleteDebt,
    calculateTimeToPayOff,
    calculateOptimalPayoffStrategy
};

// Initialiser la page des dettes au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Si nous sommes sur la page app.html, initialiser la page des dettes
    if (document.getElementById('debt')) {
        initDebtPage();
    }
});
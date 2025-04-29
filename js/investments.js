/**
 * Fichier de gestion des investissements
 * Ce fichier gère le suivi et les calculs liés aux investissements
 */

// Initialiser la page des investissements
function initInvestmentsPage() {
    // Récupérer les données financières
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) {
        console.error('Impossible de charger les données financières');
        return;
    }
    
    // Mettre à jour la page avec les données
    updateInvestmentsPage(financeData);
    
    // Initialiser les gestionnaires d'événements
    initInvestmentsEventListeners();
}

// Mettre à jour la page des investissements avec les dernières données
function updateInvestmentsPage(financeData) {
    // Mettre à jour la valeur des investissements actuels
    document.getElementById('current-investments').textContent = window.Storage.formatCurrency(financeData.investments.current);
    
    // Mettre à jour la capacité d'investissement mensuelle
    const investmentCapacity = calculateInvestmentCapacity(financeData);
    financeData.investments.monthly = investmentCapacity;
    document.getElementById('monthly-investment-capacity').textContent = window.Storage.formatCurrency(investmentCapacity);
    
    // Sauvegarder la mise à jour de la capacité d'investissement
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour le tableau de bord
    if (window.Dashboard) {
        window.Dashboard.updateDashboardSummary(financeData);
    }
}

// Initialiser les gestionnaires d'événements pour la page des investissements
function initInvestmentsEventListeners() {
    // Bouton de modification des investissements actuels
    const editInvestmentsBtn = document.getElementById('edit-investments-btn');
    if (editInvestmentsBtn) {
        editInvestmentsBtn.addEventListener('click', function() {
            openInvestmentsModal();
        });
    }
    
    // Fermeture de la modale
    const closeInvestmentsModal = document.getElementById('close-investments-modal');
    if (closeInvestmentsModal) {
        closeInvestmentsModal.addEventListener('click', function() {
            document.getElementById('investments-modal').style.display = 'none';
        });
    }
    
    // Bouton d'annulation
    const cancelInvestments = document.getElementById('cancel-investments');
    if (cancelInvestments) {
        cancelInvestments.addEventListener('click', function() {
            document.getElementById('investments-modal').style.display = 'none';
        });
    }
    
    // Formulaire de modification des investissements
    const investmentsForm = document.getElementById('investments-form');
    if (investmentsForm) {
        investmentsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveInvestments();
        });
    }
}

// Ouvrir la modale de modification des investissements
function openInvestmentsModal() {
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    document.getElementById('investments-amount').value = financeData.investments.current;
    document.getElementById('investments-modal').style.display = 'flex';
}

// Enregistrer les investissements actuels
function saveInvestments() {
    const investmentsAmount = parseFloat(document.getElementById('investments-amount').value);
    
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    financeData.investments.current = investmentsAmount;
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateInvestmentsPage(financeData);
    
    // Fermer la modale
    document.getElementById('investments-modal').style.display = 'none';
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification('Investissements mis à jour avec succès', 'success');
    }
}

// Calculer la capacité d'investissement mensuelle
function calculateInvestmentCapacity(financeData) {
    // Calculer le total des revenus
    const income = financeData.income.salary;
    const otherIncome = financeData.income.otherIncome.reduce((total, item) => total + item.amount, 0);
    const totalIncome = income + otherIncome;
    
    // Calculer le total des dépenses fixes (abonnements)
    const subscriptionExpenses = financeData.subscriptions.reduce((total, sub) => {
        if (sub.frequency === 'monthly') {
            return total + sub.amount;
        } else if (sub.frequency === 'quarterly') {
            return total + (sub.amount / 3);
        } else if (sub.frequency === 'yearly') {
            return total + (sub.amount / 12);
        }
        return total;
    }, 0);
    
    // Calculer le total des dépenses quotidiennes pour ce mois
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const dailyExpenses = financeData.expenses.reduce((total, exp) => {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            return total + exp.amount;
        }
        return total;
    }, 0);
    
    // Récupérer les paiements mensuels de dettes
    const debtPayments = financeData.debt.reduce((total, debt) => total + debt.monthlyPayment, 0);
    
    // Calculer l'épargne mensuelle nécessaire pour les objectifs
    let monthlySavingsGoal = 0;
    if (window.Savings && typeof window.Savings.calculateTotalMonthlySavingsNeeded === 'function') {
        monthlySavingsGoal = window.Savings.calculateTotalMonthlySavingsNeeded();
    } else {
        financeData.savings.goals.forEach(goal => {
            const targetDate = new Date(goal.targetDate);
            const today = new Date();
            const monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                                  (targetDate.getMonth() - today.getMonth());
            if (monthsRemaining > 0) {
                monthlySavingsGoal += goal.targetAmount / monthsRemaining;
            }
        });
    }
    
    // Calculer le montant disponible pour l'investissement
    const availableForInvestment = totalIncome - subscriptionExpenses - dailyExpenses - debtPayments - monthlySavingsGoal;
    
    // Renvoyer le maximum de 0 ou le montant calculé
    return Math.max(0, availableForInvestment);
}

// Simuler la croissance des investissements sur une période donnée
function simulateInvestmentGrowth(initialAmount, monthlyContribution, years, annualInterestRate) {
    const months = years * 12;
    const monthlyInterestRate = annualInterestRate / 12 / 100;
    
    let futureValue = initialAmount;
    let totalContributions = initialAmount;
    let interestEarned = 0;
    
    const timeline = [];
    
    for (let i = 1; i <= months; i++) {
        // Ajouter la contribution mensuelle
        futureValue += monthlyContribution;
        totalContributions += monthlyContribution;
        
        // Calculer les intérêts pour ce mois
        const monthlyInterest = futureValue * monthlyInterestRate;
        futureValue += monthlyInterest;
        interestEarned += monthlyInterest;
        
        // Ajouter un point dans la chronologie tous les 12 mois (1 an)
        if (i % 12 === 0) {
            timeline.push({
                year: i / 12,
                value: futureValue,
                contributions: totalContributions,
                interest: interestEarned
            });
        }
    }
    
    return {
        futureValue,
        totalContributions,
        interestEarned,
        timeline
    };
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Investments = {
    initInvestmentsPage,
    updateInvestmentsPage,
    openInvestmentsModal,
    saveInvestments,
    calculateInvestmentCapacity,
    simulateInvestmentGrowth
};

// Initialiser la page des investissements au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Si nous sommes sur la page app.html, initialiser la page des investissements
    if (document.getElementById('investments')) {
        initInvestmentsPage();
    }
});
/**
 * Fichier de gestion de l'épargne
 * Ce fichier gère les objectifs d'épargne et le suivi de l'épargne actuelle
 */

// Initialiser la page d'épargne
function initSavingsPage() {
    // Récupérer les données financières
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) {
        console.error('Impossible de charger les données financières');
        return;
    }
    
    // Mettre à jour la page avec les données
    updateSavingsPage(financeData);
    
    // Initialiser les gestionnaires d'événements
    initSavingsEventListeners();
}

// Mettre à jour la page d'épargne avec les dernières données
function updateSavingsPage(financeData) {
    // Mettre à jour la valeur d'épargne actuelle
    document.getElementById('current-savings').textContent = window.Storage.formatCurrency(financeData.savings.current);
    
    // Effacer et mettre à jour les objectifs d'épargne
    const goalsContainer = document.getElementById('savings-goals');
    if (!goalsContainer) return;
    
    goalsContainer.innerHTML = '';
    
    if (financeData.savings.goals.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'summary-card';
        emptyMessage.innerHTML = '<div class="card-title">Aucun objectif d\'épargne</div>' +
                                '<div class="card-subtitle">Ajoutez un objectif pour commencer à planifier votre épargne</div>';
        goalsContainer.appendChild(emptyMessage);
    } else {
        // Trier les objectifs par date cible (les plus proches en premier)
        const sortedGoals = [...financeData.savings.goals].sort((a, b) => {
            return new Date(a.targetDate) - new Date(b.targetDate);
        });
        
        sortedGoals.forEach(goal => {
            const goalCard = document.createElement('div');
            goalCard.classList.add('summary-card');
            goalCard.style.marginBottom = '1rem';
            
            const header = document.createElement('div');
            header.classList.add('card-header');
            
            const title = document.createElement('div');
            title.classList.add('card-title');
            title.textContent = goal.description;
            header.appendChild(title);
            
            const deleteBtn = document.createElement('span');
            deleteBtn.classList.add('action-icon', 'delete-icon');
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = 'Supprimer';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.addEventListener('click', function() {
                if (confirm('Êtes-vous sûr de vouloir supprimer cet objectif ?')) {
                    deleteGoal(goal.id);
                }
            });
            header.appendChild(deleteBtn);
            goalCard.appendChild(header);
            
            // Montant cible et date
            const valueDiv = document.createElement('div');
            valueDiv.classList.add('card-value');
            valueDiv.textContent = window.Storage.formatCurrency(goal.targetAmount);
            goalCard.appendChild(valueDiv);
            
            const dateDiv = document.createElement('div');
            dateDiv.classList.add('card-subtitle');
            
            const targetDate = new Date(goal.targetDate);
            const today = new Date();
            const monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                                   (targetDate.getMonth() - today.getMonth());
            
            let monthlyAmount = 0;
            if (monthsRemaining > 0) {
                monthlyAmount = goal.targetAmount / monthsRemaining;
            }
            
            dateDiv.textContent = `Objectif pour le ${targetDate.toLocaleDateString('fr-FR')} ${monthsRemaining > 0 ? `(${monthsRemaining} mois restants)` : '(Date dépassée)'}`;
            goalCard.appendChild(dateDiv);
            
            // Épargne mensuelle nécessaire
            const monthlyDiv = document.createElement('div');
            monthlyDiv.style.marginTop = '0.5rem';
            monthlyDiv.textContent = `Épargne mensuelle nécessaire : ${window.Storage.formatCurrency(monthlyAmount)}`;
            goalCard.appendChild(monthlyDiv);
            
            // Barre de progression
            const progressContainer = document.createElement('div');
            progressContainer.classList.add('progress-container');
            progressContainer.style.marginTop = '1rem';
            
            const progressBar = document.createElement('div');
            progressBar.classList.add('progress-bar');
            
            // Calculer le pourcentage de progression (épargne actuelle vs montant cible)
            const progressPercent = Math.min(100, (financeData.savings.current / goal.targetAmount) * 100);
            progressBar.style.width = `${progressPercent}%`;
            
            // Changement de couleur en fonction de la progression
            if (progressPercent < 30) {
                progressBar.style.backgroundColor = '#ef4444'; // Rouge
            } else if (progressPercent < 70) {
                progressBar.style.backgroundColor = '#f59e0b'; // Orange
            }
            
            progressContainer.appendChild(progressBar);
            goalCard.appendChild(progressContainer);
            
            // Pourcentage de progression
            const progressText = document.createElement('div');
            progressText.style.fontSize = '0.8rem';
            progressText.style.color = '#6c757d';
            progressText.style.marginTop = '0.3rem';
            progressText.textContent = `${Math.round(progressPercent)}% atteint`;
            goalCard.appendChild(progressText);
            
            // Bouton d'édition de l'objectif
            const editBtn = document.createElement('button');
            editBtn.classList.add('action-button');
            editBtn.textContent = 'Modifier';
            editBtn.style.marginTop = '1rem';
            editBtn.addEventListener('click', function() {
                editGoal(goal);
            });
            goalCard.appendChild(editBtn);
            
            goalsContainer.appendChild(goalCard);
        });
    }
    
    // Mettre à jour le tableau de bord après la mise à jour de l'épargne
    if (window.Dashboard) {
        window.Dashboard.updateDashboardSummary(financeData);
    }
}

// Initialiser les gestionnaires d'événements pour la page d'épargne
function initSavingsEventListeners() {
    // Bouton de modification de l'épargne actuelle
    const editSavingsBtn = document.getElementById('edit-savings-btn');
    if (editSavingsBtn) {
        editSavingsBtn.addEventListener('click', function() {
            openSavingsModal();
        });
    }
    
    // Bouton d'ajout d'objectif d'épargne
    const addGoalBtn = document.getElementById('add-goal-btn');
    if (addGoalBtn) {
        addGoalBtn.addEventListener('click', function() {
            openGoalModal();
        });
    }
    
    // Fermeture des modales
    const closeSavingsModal = document.getElementById('close-savings-modal');
    if (closeSavingsModal) {
        closeSavingsModal.addEventListener('click', function() {
            document.getElementById('savings-modal').style.display = 'none';
        });
    }
    
    const closeGoalModal = document.getElementById('close-goal-modal');
    if (closeGoalModal) {
        closeGoalModal.addEventListener('click', function() {
            document.getElementById('goal-modal').style.display = 'none';
        });
    }
    
    // Boutons d'annulation
    const cancelSavings = document.getElementById('cancel-savings');
    if (cancelSavings) {
        cancelSavings.addEventListener('click', function() {
            document.getElementById('savings-modal').style.display = 'none';
        });
    }
    
    const cancelGoal = document.getElementById('cancel-goal');
    if (cancelGoal) {
        cancelGoal.addEventListener('click', function() {
            document.getElementById('goal-modal').style.display = 'none';
        });
    }
    
    // Formulaires
    const savingsForm = document.getElementById('savings-form');
    if (savingsForm) {
        savingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSavings();
        });
    }
    
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGoal();
        });
    }
}

// Ouvrir la modale de modification de l'épargne actuelle
function openSavingsModal() {
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    document.getElementById('savings-amount').value = financeData.savings.current;
    document.getElementById('savings-modal').style.display = 'flex';
}

// Ouvrir la modale d'ajout/modification d'objectif d'épargne
function openGoalModal(goal = null) {
    const modalTitle = document.getElementById('goal-modal-title');
    const goalForm = document.getElementById('goal-form');
    
    // Réinitialiser le formulaire
    goalForm.reset();
    
    if (goal) {
        // Mode édition
        modalTitle.textContent = 'Modifier l\'objectif d\'épargne';
        document.getElementById('goal-description').value = goal.description;
        document.getElementById('goal-amount').value = goal.targetAmount;
        document.getElementById('goal-date').value = goal.targetDate;
        goalForm.setAttribute('data-id', goal.id);
    } else {
        // Mode ajout
        modalTitle.textContent = 'Ajouter un objectif d\'épargne';
        
        // Définir une date cible par défaut (6 mois à partir d'aujourd'hui)
        const defaultDate = new Date();
        defaultDate.setMonth(defaultDate.getMonth() + 6);
        document.getElementById('goal-date').valueAsDate = defaultDate;
        
        goalForm.removeAttribute('data-id');
    }
    
    document.getElementById('goal-modal').style.display = 'flex';
}

// Enregistrer l'épargne actuelle
function saveSavings() {
    const savingsAmount = parseFloat(document.getElementById('savings-amount').value);
    
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    financeData.savings.current = savingsAmount;
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateSavingsPage(financeData);
    
    // Fermer la modale
    document.getElementById('savings-modal').style.display = 'none';
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification('Épargne mise à jour avec succès', 'success');
    }
}

// Enregistrer un objectif d'épargne (ajout ou modification)
function saveGoal() {
    const description = document.getElementById('goal-description').value;
    const targetAmount = parseFloat(document.getElementById('goal-amount').value);
    const targetDate = document.getElementById('goal-date').value;
    const goalForm = document.getElementById('goal-form');
    const goalId = goalForm.getAttribute('data-id');
    
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    if (goalId) {
        // Mode édition
        const goalIndex = financeData.savings.goals.findIndex(goal => goal.id.toString() === goalId);
        if (goalIndex !== -1) {
            financeData.savings.goals[goalIndex] = {
                ...financeData.savings.goals[goalIndex],
                description,
                targetAmount,
                targetDate
            };
        }
    } else {
        // Mode ajout
        const newGoal = {
            id: Date.now(),
            description,
            targetAmount,
            targetDate,
            currentAmount: 0
        };
        
        financeData.savings.goals.push(newGoal);
    }
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateSavingsPage(financeData);
    
    // Fermer la modale
    document.getElementById('goal-modal').style.display = 'none';
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification(
            goalId ? 'Objectif d\'épargne modifié avec succès' : 'Objectif d\'épargne ajouté avec succès', 
            'success'
        );
    }
}

// Modifier un objectif d'épargne existant
function editGoal(goal) {
    openGoalModal(goal);
}

// Supprimer un objectif d'épargne
function deleteGoal(goalId) {
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    financeData.savings.goals = financeData.savings.goals.filter(goal => goal.id !== goalId);
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateSavingsPage(financeData);
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification('Objectif d\'épargne supprimé avec succès', 'success');
    }
}

// Calculer l'épargne mensuelle totale nécessaire pour atteindre tous les objectifs
function calculateTotalMonthlySavingsNeeded() {
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return 0;
    
    let totalMonthlySavingsNeeded = 0;
    
    financeData.savings.goals.forEach(goal => {
        const targetDate = new Date(goal.targetDate);
        const today = new Date();
        const monthsRemaining = (targetDate.getFullYear() - today.getFullYear()) * 12 + 
                              (targetDate.getMonth() - today.getMonth());
        
        if (monthsRemaining > 0) {
            totalMonthlySavingsNeeded += goal.targetAmount / monthsRemaining;
        }
    });
    
    return totalMonthlySavingsNeeded;
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Savings = {
    initSavingsPage,
    updateSavingsPage,
    openSavingsModal,
    openGoalModal,
    saveSavings,
    saveGoal,
    editGoal,
    deleteGoal,
    calculateTotalMonthlySavingsNeeded
};

// Initialiser la page d'épargne au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Si nous sommes sur la page app.html, initialiser la page d'épargne
    if (document.getElementById('savings')) {
        initSavingsPage();
    }
});
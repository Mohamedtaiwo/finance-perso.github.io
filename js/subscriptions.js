/**
 * Fichier de gestion des abonnements
 * Ce fichier gère l'ajout, la modification et la suppression des abonnements récurrents
 */

// Initialiser la page des abonnements
function initSubscriptionsPage() {
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
    updateSubscriptionsPage(financeData);
    
    // Initialiser les gestionnaires d'événements
    initSubscriptionsEventListeners();
}

// Mettre à jour la page des abonnements avec les dernières données
function updateSubscriptionsPage(financeData) {
    // S'assurer que la structure existe
    if (!financeData.subscriptions) {
        financeData.subscriptions = [];
    }
    
    // Effacer et mettre à jour le tableau des abonnements
    const tableBody = document.getElementById('subscriptions-body');
    
    // Si le tableau n'existe pas encore sur la page, ne rien faire
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Calculer le total mensuel des abonnements
    let totalMonthlySubscriptions = 0;
    
    financeData.subscriptions.forEach(subscription => {
        const row = document.createElement('tr');
        
        const serviceCell = document.createElement('td');
        serviceCell.textContent = subscription.service || '';
        serviceCell.setAttribute('data-label', 'Service');
        row.appendChild(serviceCell);
        
        const amountCell = document.createElement('td');
        amountCell.textContent = window.Storage.formatCurrency(subscription.amount || 0);
        amountCell.classList.add('amount', 'negative');
        amountCell.setAttribute('data-label', 'Montant');
        row.appendChild(amountCell);
        
        const frequencyCell = document.createElement('td');
        let frequencyText = '';
        let monthlyEquivalent = 0;
        
        if (subscription.frequency === 'monthly') {
            frequencyText = 'Mensuel';
            monthlyEquivalent = subscription.amount || 0;
        } else if (subscription.frequency === 'quarterly') {
            frequencyText = 'Trimestriel';
            monthlyEquivalent = (subscription.amount || 0) / 3;
        } else if (subscription.frequency === 'yearly') {
            frequencyText = 'Annuel';
            monthlyEquivalent = (subscription.amount || 0) / 12;
        }
        
        totalMonthlySubscriptions += monthlyEquivalent;
        frequencyCell.textContent = frequencyText;
        frequencyCell.setAttribute('data-label', 'Fréquence');
        row.appendChild(frequencyCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = subscription.date ? new Date(subscription.date).toLocaleDateString('fr-FR') : '';
        dateCell.setAttribute('data-label', 'Date de prélèvement');
        row.appendChild(dateCell);
        
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('table-actions');
        actionsCell.setAttribute('data-label', 'Actions');
        
        const editBtn = document.createElement('span');
        editBtn.classList.add('action-icon');
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Modifier';
        editBtn.addEventListener('click', function() {
            editSubscription(subscription);
        });
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('action-icon', 'delete-icon');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Supprimer';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) {
                deleteSubscription(subscription.id);
            }
        });
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
    });
    
    // Mettre à jour le total des abonnements mensuels
    const subscriptionsTotalElement = document.getElementById('subscriptions-total');
    if (subscriptionsTotalElement) {
        subscriptionsTotalElement.textContent = window.Storage.formatCurrency(totalMonthlySubscriptions);
    }
    
    // Mettre à jour le tableau de bord après la mise à jour des abonnements
    if (window.Dashboard && typeof window.Dashboard.updateDashboardSummary === 'function') {
        window.Dashboard.updateDashboardSummary(financeData);
    }
}

// Initialiser les gestionnaires d'événements pour la page des abonnements
function initSubscriptionsEventListeners() {
    // Bouton d'ajout d'abonnement
    const addSubscriptionBtn = document.getElementById('add-subscription-btn');
    if (addSubscriptionBtn) {
        addSubscriptionBtn.addEventListener('click', function() {
            openSubscriptionModal();
        });
    }
    
    // Fermeture de la modale
    const closeSubscriptionModal = document.getElementById('close-subscription-modal');
    if (closeSubscriptionModal) {
        closeSubscriptionModal.addEventListener('click', function() {
            document.getElementById('subscription-modal').style.display = 'none';
        });
    }
    
    // Bouton d'annulation
    const cancelSubscription = document.getElementById('cancel-subscription');
    if (cancelSubscription) {
        cancelSubscription.addEventListener('click', function() {
            document.getElementById('subscription-modal').style.display = 'none';
        });
    }
    
    // Formulaire d'ajout/modification d'abonnement
    const subscriptionForm = document.getElementById('subscription-form');
    if (subscriptionForm) {
        subscriptionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveSubscription();
        });
    }
}

// Ouvrir la modale d'ajout/modification d'abonnement
function openSubscriptionModal(subscription = null) {
    const modalTitle = document.getElementById('subscription-modal-title');
    const subscriptionForm = document.getElementById('subscription-form');
    
    if (!modalTitle || !subscriptionForm) return;
    
    // Réinitialiser le formulaire
    subscriptionForm.reset();
    
    if (subscription) {
        // Mode édition
        modalTitle.textContent = 'Modifier l\'abonnement';
        document.getElementById('subscription-service').value = subscription.service || '';
        document.getElementById('subscription-amount').value = subscription.amount || 0;
        document.getElementById('subscription-frequency').value = subscription.frequency || 'monthly';
        document.getElementById('subscription-date').value = subscription.date || '';
        subscriptionForm.setAttribute('data-id', subscription.id);
    } else {
        // Mode ajout
        modalTitle.textContent = 'Ajouter un abonnement';
        document.getElementById('subscription-date').valueAsDate = new Date();
        subscriptionForm.removeAttribute('data-id');
    }
    
    const modal = document.getElementById('subscription-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Enregistrer un abonnement (ajout ou modification)
function saveSubscription() {
    const serviceInput = document.getElementById('subscription-service');
    const amountInput = document.getElementById('subscription-amount');
    const frequencyInput = document.getElementById('subscription-frequency');
    const dateInput = document.getElementById('subscription-date');
    const subscriptionForm = document.getElementById('subscription-form');
    
    if (!serviceInput || !amountInput || !frequencyInput || !dateInput || !subscriptionForm) return;
    
    const service = serviceInput.value;
    const amount = parseFloat(amountInput.value);
    const frequency = frequencyInput.value;
    const date = dateInput.value;
    const subscriptionId = subscriptionForm.getAttribute('data-id');
    
    let financeData = window.Storage.getUserFinanceData();
    
    // Si les données n'existent pas, les initialiser
    if (!financeData) {
        financeData = window.Storage.initializeUserFinanceData();
    }
    
    if (!financeData) return;
    
    // S'assurer que la structure subscriptions existe
    if (!financeData.subscriptions) {
        financeData.subscriptions = [];
    }
    
    if (subscriptionId) {
        // Mode édition
        const subscriptionIndex = financeData.subscriptions.findIndex(subscription => subscription.id && subscription.id.toString() === subscriptionId);
        if (subscriptionIndex !== -1) {
            financeData.subscriptions[subscriptionIndex] = {
                ...financeData.subscriptions[subscriptionIndex],
                service,
                amount,
                frequency,
                date
            };
        }
    } else {
        // Mode ajout
        const newSubscription = {
            id: Date.now(),
            service,
            amount,
            frequency,
            date
        };
        
        financeData.subscriptions.push(newSubscription);
    }
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateSubscriptionsPage(financeData);
    
    // Fermer la modale
    const modal = document.getElementById('subscription-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Afficher une notification
    if (window.Dashboard && typeof window.Dashboard.showNotification === 'function') {
        window.Dashboard.showNotification(
            subscriptionId ? 'Abonnement modifié avec succès' : 'Abonnement ajouté avec succès', 
            'success'
        );
    }
}

// Modifier un abonnement existant
function editSubscription(subscription) {
    openSubscriptionModal(subscription);
}

// Supprimer un abonnement
function deleteSubscription(subscriptionId) {
    let financeData = window.Storage.getUserFinanceData();
    
    if (!financeData || !financeData.subscriptions) return;
    
    financeData.subscriptions = financeData.subscriptions.filter(subscription => subscription.id !== subscriptionId);
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateSubscriptionsPage(financeData);
    
    // Afficher une notification
    if (window.Dashboard && typeof window.Dashboard.showNotification === 'function') {
        window.Dashboard.showNotification('Abonnement supprimé avec succès', 'success');
    }
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Subscriptions = {
    initSubscriptionsPage,
    updateSubscriptionsPage,
    openSubscriptionModal,
    saveSubscription,
    editSubscription,
    deleteSubscription
};

// Initialiser la page des abonnements au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Si nous sommes sur la page app.html, initialiser la page des abonnements
    if (document.getElementById('subscriptions')) {
        initSubscriptionsPage();
    }
});
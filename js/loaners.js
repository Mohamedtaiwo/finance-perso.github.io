/**
 * Fichier de gestion des prêts aux autres
 * Ce fichier gère l'ajout, la modification et le suivi des prêts d'argent à d'autres personnes
 */

// Initialiser la page des prêts
function initLoanersPage() {
    // Récupérer les données financières
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) {
        console.error('Impossible de charger les données financières');
        return;
    }
    
    // Mettre à jour la page avec les données
    updateLoanersPage(financeData);
    
    // Initialiser les gestionnaires d'événements
    initLoanersEventListeners();
}

// Mettre à jour la page des prêts avec les dernières données
function updateLoanersPage(financeData) {
    // Effacer et mettre à jour le tableau des prêts
    const tableBody = document.getElementById('loaners-body');
    tableBody.innerHTML = '';
    
    // Si le tableau n'existe pas encore sur la page, ne rien faire
    if (!tableBody) return;
    
    let totalLoans = 0;
    
    // Trier les prêts par date (les plus récents en premier)
    const sortedLoaners = [...financeData.loaners].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });
    
    sortedLoaners.forEach(loaner => {
        const row = document.createElement('tr');
        
        const personCell = document.createElement('td');
        personCell.textContent = loaner.person;
        personCell.setAttribute('data-label', 'Personne');
        row.appendChild(personCell);
        
        const amountCell = document.createElement('td');
        amountCell.textContent = window.Storage.formatCurrency(loaner.amount);
        amountCell.classList.add('amount', 'positive');
        amountCell.setAttribute('data-label', 'Montant');
        row.appendChild(amountCell);
        
        const dateCell = document.createElement('td');
        dateCell.textContent = new Date(loaner.date).toLocaleDateString('fr-FR');
        dateCell.setAttribute('data-label', 'Date');
        row.appendChild(dateCell);
        
        const descCell = document.createElement('td');
        descCell.textContent = loaner.description;
        descCell.setAttribute('data-label', 'Description');
        row.appendChild(descCell);
        
        const actionsCell = document.createElement('td');
        actionsCell.classList.add('table-actions');
        actionsCell.setAttribute('data-label', 'Actions');
        
        const repaidBtn = document.createElement('span');
        repaidBtn.classList.add('action-icon');
        repaidBtn.innerHTML = '✅';
        repaidBtn.title = 'Marquer comme remboursé';
        repaidBtn.addEventListener('click', function() {
            if (confirm(`Marquer le prêt de ${window.Storage.formatCurrency(loaner.amount)} à ${loaner.person} comme remboursé ?`)) {
                markLoanAsRepaid(loaner.id);
            }
        });
        actionsCell.appendChild(repaidBtn);
        
        const reminderBtn = document.createElement('span');
        reminderBtn.classList.add('action-icon');
        reminderBtn.innerHTML = '📩';
        reminderBtn.title = 'Envoyer un rappel';
        reminderBtn.addEventListener('click', function() {
            sendLoanReminder(loaner);
        });
        actionsCell.appendChild(reminderBtn);
        
        const editBtn = document.createElement('span');
        editBtn.classList.add('action-icon');
        editBtn.innerHTML = '✏️';
        editBtn.title = 'Modifier';
        editBtn.addEventListener('click', function() {
            editLoaner(loaner);
        });
        actionsCell.appendChild(editBtn);
        
        const deleteBtn = document.createElement('span');
        deleteBtn.classList.add('action-icon', 'delete-icon');
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Supprimer';
        deleteBtn.addEventListener('click', function() {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce prêt ?')) {
                deleteLoaner(loaner.id);
            }
        });
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        tableBody.appendChild(row);
        
        totalLoans += loaner.amount;
    });
    
    // Mettre à jour le total des prêts
    document.getElementById('loaners-total').textContent = window.Storage.formatCurrency(totalLoans);
    
    // Mettre à jour le tableau de bord après la mise à jour des prêts
    if (window.Dashboard) {
        window.Dashboard.updateDashboardSummary(financeData);
    }
}

// Initialiser les gestionnaires d'événements pour la page des prêts
function initLoanersEventListeners() {
    // Bouton d'ajout de prêt
    const addLoanerBtn = document.getElementById('add-loaner-btn');
    if (addLoanerBtn) {
        addLoanerBtn.addEventListener('click', function() {
            openLoanerModal();
        });
    }
    
    // Fermeture de la modale
    const closeLoanerModal = document.getElementById('close-loaner-modal');
    if (closeLoanerModal) {
        closeLoanerModal.addEventListener('click', function() {
            document.getElementById('loaner-modal').style.display = 'none';
        });
    }
    
    // Bouton d'annulation
    const cancelLoaner = document.getElementById('cancel-loaner');
    if (cancelLoaner) {
        cancelLoaner.addEventListener('click', function() {
            document.getElementById('loaner-modal').style.display = 'none';
        });
    }
    
    // Formulaire d'ajout/modification de prêt
    const loanerForm = document.getElementById('loaner-form');
    if (loanerForm) {
        loanerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveLoaner();
        });
    }
}

// Ouvrir la modale d'ajout/modification de prêt
function openLoanerModal(loaner = null) {
    const modalTitle = document.getElementById('loaner-modal-title');
    const loanerForm = document.getElementById('loaner-form');
    
    // Réinitialiser le formulaire
    loanerForm.reset();
    
    if (loaner) {
        // Mode édition
        modalTitle.textContent = 'Modifier le prêt';
        document.getElementById('loaner-person').value = loaner.person;
        document.getElementById('loaner-amount').value = loaner.amount;
        document.getElementById('loaner-date').value = loaner.date;
        document.getElementById('loaner-description').value = loaner.description;
        loanerForm.setAttribute('data-id', loaner.id);
    } else {
        // Mode ajout
        modalTitle.textContent = 'Ajouter un prêt';
        document.getElementById('loaner-date').valueAsDate = new Date();
        loanerForm.removeAttribute('data-id');
    }
    
    document.getElementById('loaner-modal').style.display = 'flex';
}

// Enregistrer un prêt (ajout ou modification)
function saveLoaner() {
    const person = document.getElementById('loaner-person').value;
    const amount = parseFloat(document.getElementById('loaner-amount').value);
    const date = document.getElementById('loaner-date').value;
    const description = document.getElementById('loaner-description').value;
    const loanerForm = document.getElementById('loaner-form');
    const loanerId = loanerForm.getAttribute('data-id');
    
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    if (loanerId) {
        // Mode édition
        const loanerIndex = financeData.loaners.findIndex(loaner => loaner.id.toString() === loanerId);
        if (loanerIndex !== -1) {
            financeData.loaners[loanerIndex] = {
                ...financeData.loaners[loanerIndex],
                person,
                amount,
                date,
                description
            };
        }
    } else {
        // Mode ajout
        const newLoaner = {
            id: Date.now(),
            person,
            amount,
            date,
            description
        };
        
        financeData.loaners.push(newLoaner);
    }
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateLoanersPage(financeData);
    
    // Fermer la modale
    document.getElementById('loaner-modal').style.display = 'none';
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification(
            loanerId ? 'Prêt modifié avec succès' : 'Prêt ajouté avec succès', 
            'success'
        );
    }
}

// Marquer un prêt comme remboursé
function markLoanAsRepaid(loanerId) {
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    // Trouver le prêt pour obtenir ses détails avant de le supprimer
    const loaner = financeData.loaners.find(loan => loan.id === loanerId);
    if (!loaner) return;
    
    // Supprimer le prêt de la liste
    financeData.loaners = financeData.loaners.filter(loan => loan.id !== loanerId);
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateLoanersPage(financeData);
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification(`Prêt de ${window.Storage.formatCurrency(loaner.amount)} à ${loaner.person} marqué comme remboursé`, 'success');
    }
}

// Envoyer un rappel pour un prêt
function sendLoanReminder(loaner) {
    // Cette fonction simule l'envoi d'un rappel (en réalité, elle génère seulement un modèle de message)
    
    // Créer le texte du rappel
    const loanDate = new Date(loaner.date).toLocaleDateString('fr-FR');
    const reminderText = `Bonjour ${loaner.person},\n\nJe te rappelle le prêt de ${window.Storage.formatCurrency(loaner.amount)} que je t'ai fait le ${loanDate} pour "${loaner.description}".\n\nMerci d'avance pour ton remboursement.\n\nCordialement`;
    
    // Afficher une boîte de dialogue avec le texte du rappel
    alert(`Message à copier-coller :\n\n${reminderText}`);
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification(`Rappel généré pour ${loaner.person}`, 'info');
    }
}

// Modifier un prêt existant
function editLoaner(loaner) {
    openLoanerModal(loaner);
}

// Supprimer un prêt
function deleteLoaner(loanerId) {
    const financeData = window.Storage.getUserFinanceData();
    if (!financeData) return;
    
    financeData.loaners = financeData.loaners.filter(loaner => loaner.id !== loanerId);
    
    // Sauvegarder les données
    window.Storage.saveUserFinanceData(financeData);
    
    // Mettre à jour la page
    updateLoanersPage(financeData);
    
    // Afficher une notification
    if (window.Dashboard) {
        window.Dashboard.showNotification('Prêt supprimé avec succès', 'success');
    }
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Loaners = {
    initLoanersPage,
    updateLoanersPage,
    openLoanerModal,
    saveLoaner,
    markLoanAsRepaid,
    sendLoanReminder,
    editLoaner,
    deleteLoaner
};

// Initialiser la page des prêts au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Si nous sommes sur la page app.html, initialiser la page des prêts
    if (document.getElementById('loaners')) {
        initLoanersPage();
    }
});
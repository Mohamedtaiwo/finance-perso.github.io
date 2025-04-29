/**
 * Fichier de gestion du stockage local simplifié
 */

// Obtenir les données financières de l'utilisateur actuel
function getUserFinanceData() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        console.error('Aucun utilisateur connecté');
        return null;
    }
    
    try {
        const users = JSON.parse(localStorage.getItem('financeUsers') || '{}');
        
        // Vérifier si l'utilisateur existe
        if (!users[currentUser]) {
            console.warn('Utilisateur non trouvé, création d\'un nouvel utilisateur');
            users[currentUser] = {
                password: 'default',
                financeData: createEmptyFinanceData()
            };
            localStorage.setItem('financeUsers', JSON.stringify(users));
        }
        
        // Vérifier si les données financières existent
        if (!users[currentUser].financeData) {
            console.warn('Données financières non trouvées, initialisation');
            users[currentUser].financeData = createEmptyFinanceData();
            localStorage.setItem('financeUsers', JSON.stringify(users));
        }
        
        return users[currentUser].financeData;
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        return null;
    }
}

// Créer une structure de données financières vide
function createEmptyFinanceData() {
    return {
        income: {
            salary: 0,
            otherIncome: []
        },
        subscriptions: [],
        expenses: [],
        savings: {
            current: 0,
            goals: []
        },
        investments: {
            monthly: 0,
            current: 0
        },
        debt: [],
        loaners: []
    };
}

// Sauvegarder les données financières de l'utilisateur actuel
function saveUserFinanceData(financeData) {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        console.error('Aucun utilisateur connecté');
        return false;
    }
    
    try {
        const users = JSON.parse(localStorage.getItem('financeUsers') || '{}');
        
        // Créer l'utilisateur s'il n'existe pas
        if (!users[currentUser]) {
            users[currentUser] = {
                password: 'default'
            };
        }
        
        // Sauvegarder les données financières
        users[currentUser].financeData = financeData;
        localStorage.setItem('financeUsers', JSON.stringify(users));
        
        console.log('Données sauvegardées avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des données:', error);
        return false;
    }
}

// Formater un montant en devise
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Storage = {
    getUserFinanceData,
    saveUserFinanceData,
    createEmptyFinanceData,
    formatCurrency
};

// Vérifier si le localStorage est disponible
(function() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('localStorage est disponible');
    } catch (e) {
        console.error('localStorage n\'est pas disponible:', e);
        alert('Votre navigateur ne supporte pas le stockage local, l\'application ne fonctionnera pas correctement.');
    }
})();
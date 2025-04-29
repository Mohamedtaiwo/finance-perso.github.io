// Initialiser le tableau de bord
function initDashboard() {
    // Vérifier si l'utilisateur est connecté
    if (window.Auth && !window.Auth.checkAuthentication()) {
        return;
    }

    // Charger les données financières
    loadDashboardData();

    // Initialiser la navigation
    initNavigation();

    // Initialiser les boutons de déconnexion et le menu mobile
    initAppControls();

    // Exposer la fonction de mise à jour du dashboard dans l'objet window
    window.updateDashboard = loadDashboardData;
}

// Initialiser la navigation (menus latéraux et passage d'une section à une autre)
function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function () {
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('active');
            });

            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');

            updatePageTitle();

            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('active');
            }
        });
    });
}

// Initialiser les contrôles de l'application (déconnexion, menu mobile)
function initAppControls() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        document.getElementById('user-email').textContent = currentUser;
    }

    document.getElementById('logout-btn').addEventListener('click', function () {
        if (window.Auth) {
            window.Auth.logout();
        } else {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        }
    });

    document.querySelector('.mobile-menu-toggle').addEventListener('click', function () {
        document.querySelector('.sidebar').classList.toggle('active');
    });
}

// Mettre à jour le titre de la page en fonction de la section active
function updatePageTitle() {
    const activeSection = document.querySelector('section.active');
    if (activeSection) {
        const sectionTitle = activeSection.querySelector('.page-title')?.textContent ||
            activeSection.querySelector('.section-title')?.textContent ||
            'FinanceHelper';
        document.title = `${sectionTitle} - FinanceHelper`;
    }
}

// Fonction pour créer une notification temporaire
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }

    notificationContainer.appendChild(notification);

    notification.style.backgroundColor = type === 'success' ? '#4ade80' :
        type === 'error' ? '#ef4444' :
            type === 'warning' ? '#f59e0b' : '#60a5fa';
    notification.style.color = 'white';
    notification.style.padding = '12px 16px';
    notification.style.borderRadius = '8px';
    notification.style.marginBottom = '10px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    notification.style.animation = 'slideIn 0.3s forwards';

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => {
            notification.remove();
            if (notificationContainer.children.length === 0) {
                notificationContainer.remove();
            }
        }, 300);
    }, 3000);
}

// Vérifier le solde et alerter l'utilisateur si nécessaire
function checkBalanceAndAlert(financeData) {
    const income = financeData.income.salary;
    const otherIncome = financeData.income.otherIncome.reduce((total, item) => total + item.amount, 0);
    const totalIncome = income + otherIncome;

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

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const dailyExpenses = financeData.expenses.reduce((total, exp) => {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            return total + exp.amount;
        }
        return total;
    }, 0);

    const totalExpenses = subscriptionExpenses + dailyExpenses;
    const balance = totalIncome - totalExpenses;

    const warningThreshold = totalIncome * 0.2;
    const dangerThreshold = totalIncome * 0.1;

    if (balance <= 0) {
        showNotification('Attention ! Votre solde est négatif. Vous devriez arrêter de dépenser immédiatement.', 'error');
    } else if (balance <= dangerThreshold) {
        showNotification('Votre solde est très bas. Il est fortement recommandé de limiter vos dépenses.', 'error');
    } else if (balance <= warningThreshold) {
        showNotification('Votre solde diminue. Pensez à réduire vos dépenses si possible.', 'warning');
    }
}

// Exemple de calcul de capacité d’investissement
function calculateInvestmentCapacity(financeData) {
    const income = financeData.income.salary;
    const otherIncome = financeData.income.otherIncome.reduce((total, item) => total + item.amount, 0);
    const totalIncome = income + otherIncome;

    const fixedExpenses = financeData.subscriptions.reduce((total, sub) => {
        if (sub.frequency === 'monthly') {
            return total + sub.amount;
        } else if (sub.frequency === 'quarterly') {
            return total + (sub.amount / 3);
        } else if (sub.frequency === 'yearly') {
            return total + (sub.amount / 12);
        }
        return total;
    }, 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const variableExpenses = financeData.expenses.reduce((total, exp) => {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
            return total + exp.amount;
        }
        return total;
    }, 0);

    const availableForInvestment = totalIncome - (fixedExpenses + variableExpenses);
    return Math.max(0, availableForInvestment);
}

// Charger les données du tableau de bord (exemple fictif)
function loadDashboardData() {
    const financeData = JSON.parse(localStorage.getItem('financeData')) || {
        income: {
            salary: 2000,
            otherIncome: []
        },
        subscriptions: [],
        expenses: []
    };

    updateDashboardSummary(financeData);
    checkBalanceAndAlert(financeData);
}

// Exemple de mise à jour du résumé
function updateDashboardSummary(financeData) {
    document.getElementById('salary-amount').textContent = financeData.income.salary + ' €';
    document.getElementById('other-income-amount').textContent = financeData.income.otherIncome.reduce((sum, i) => sum + i.amount, 0) + ' €';
    document.getElementById('subscription-total').textContent = financeData.subscriptions.reduce((sum, s) => sum + s.amount, 0) + ' €';
    document.getElementById('expense-total').textContent = financeData.expenses.reduce((sum, e) => sum + e.amount, 0) + ' €';
    document.getElementById('investment-capacity').textContent = calculateInvestmentCapacity(financeData) + ' €';
}

// Exporter les fonctions pour qu'elles soient disponibles globalement
window.Dashboard = {
    initDashboard,
    loadDashboardData,
    updateDashboardSummary,
    calculateInvestmentCapacity,
    showNotification,
    checkBalanceAndAlert
};

// Démarrer le tableau de bord au chargement de la page
document.addEventListener('DOMContentLoaded', function () {
    initDashboard();
});

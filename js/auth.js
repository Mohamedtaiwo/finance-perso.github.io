/**
 * Fichier de gestion de l'authentification
 * Ce fichier gère la connexion, l'inscription et la sécurité de l'application
 */

// Vérifier si l'utilisateur est connecté
function checkAuthentication() {
    const currentUser = sessionStorage.getItem('currentUser');
    // Vérifier si on est sur la page index.html (page de login)
    const isLoginPage = window.location.pathname.endsWith('/index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname === '';
    
    if (!currentUser && !isLoginPage) {
        // Rediriger vers la page de connexion si non connecté et pas déjà sur la page de login
        window.location.href = 'index.html';
        return false;
    } else if (currentUser && isLoginPage) {
        // Rediriger vers l'application si déjà connecté et sur la page de login
        window.location.href = 'app.html';
        return true;
    }
    
    return !!currentUser;
}

// Se connecter avec email et mot de passe
function login(email, password) {
    // Récupérer la liste des utilisateurs depuis le localStorage
    const users = JSON.parse(localStorage.getItem('financeUsers') || '{}');
    
    // Vérifier si l'utilisateur existe
    if (!users[email]) {
        return {
            success: false,
            message: 'Aucun compte trouvé avec cette adresse email'
        };
    }
    
    // Vérifier le mot de passe
    if (users[email].password !== password) {
        return {
            success: false,
            message: 'Mot de passe incorrect'
        };
    }
    
    // Connexion réussie
    sessionStorage.setItem('currentUser', email);
    
    // S'assurer que la structure de données financières existe
    if (!users[email].financeData) {
        users[email].financeData = {
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
        
        localStorage.setItem('financeUsers', JSON.stringify(users));
    }
    
    return {
        success: true,
        message: 'Connexion réussie!'
    };
}

// Créer un nouveau compte
function register(email, password, confirmPassword) {
    // Validation basique
    if (!email || !password || !confirmPassword) {
        return {
            success: false,
            message: 'Veuillez remplir tous les champs'
        };
    }
    
    if (!validateEmail(email)) {
        return {
            success: false,
            message: 'Veuillez saisir une adresse email valide'
        };
    }
    
    if (password !== confirmPassword) {
        return {
            success: false,
            message: 'Les mots de passe ne correspondent pas'
        };
    }
    
    // Vérifier la force du mot de passe
    if (password.length < 8) {
        return {
            success: false,
            message: 'Le mot de passe doit contenir au moins 8 caractères'
        };
    }
    
    // Récupérer la liste des utilisateurs depuis le localStorage
    const users = JSON.parse(localStorage.getItem('financeUsers') || '{}');
    
    // Vérifier si l'utilisateur existe déjà
    if (users[email]) {
        return {
            success: false,
            message: 'Un compte avec cette adresse email existe déjà'
        };
    }
    
    // Créer un nouvel utilisateur avec les données financières par défaut
    users[email] = {
        password: password, // Dans une vraie application, il faudrait hasher ce mot de passe
        financeData: {
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
        }
    };
    
    // Sauvegarder dans le localStorage
    localStorage.setItem('financeUsers', JSON.stringify(users));
    
    return {
        success: true,
        message: 'Compte créé avec succès! Vous pouvez maintenant vous connecter.'
    };
}

// Se déconnecter
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Vérifier si l'email est valide
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Évaluer la force du mot de passe
function evaluatePasswordStrength(password) {
    let strength = 0;
    let feedback = '';
    
    // Vérifier la longueur
    if (password.length === 0) {
        return {
            strength: 0,
            feedback: ''
        };
    } else if (password.length < 8) {
        strength = 1;
        feedback = 'Trop court - Au moins 8 caractères requis';
    } else if (password.length >= 8) {
        strength += 1;
    }
    
    if (password.length >= 12) {
        strength += 1;
    }
    
    // Vérifier les caractères spéciaux
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
        strength += 1;
    } else {
        feedback = 'Ajoutez des lettres minuscules et majuscules';
    }
    
    // Vérifier les chiffres
    if (password.match(/\d/)) {
        strength += 1;
    } else {
        feedback += feedback ? ' et des chiffres' : 'Ajoutez des chiffres';
    }
    
    // Vérifier les caractères spéciaux
    if (password.match(/[^a-zA-Z\d]/)) {
        strength += 1;
    } else {
        feedback += feedback ? ' et des caractères spéciaux' : 'Ajoutez des caractères spéciaux';
    }
    
    // Déterminer le niveau de force
    let strengthClass = '';
    if (strength <= 2) {
        strengthClass = 'strength-weak';
        if (!feedback) feedback = 'Faible - Ajoutez différents types de caractères';
    } else if (strength <= 4) {
        strengthClass = 'strength-medium';
        if (!feedback) feedback = 'Moyen - Continuez d\'améliorer votre mot de passe';
    } else {
        strengthClass = 'strength-strong';
        feedback = 'Fort - Excellent choix de mot de passe!';
    }
    
    return {
        strength: strength,
        strengthClass: strengthClass,
        feedback: feedback
    };
}

// Initialiser les gestionnaires d'événements pour la page de connexion/inscription
function initAuthPage() {
    // Détecter si nous sommes sur la page de connexion
    const isLoginPage = window.location.pathname.endsWith('/index.html') || 
                        window.location.pathname === '/' || 
                        window.location.pathname === '';
    
    if (!isLoginPage) {
        return;
    }
    
    // Vérifier si l'utilisateur est déjà connecté
    if (checkAuthentication()) {
        return;
    }
    
    // Vérification de l'existence des éléments avant d'ajouter des écouteurs d'événements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const passwordInput = document.getElementById('reg-password');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    
    // Gestionnaire pour le bouton de connexion
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const statusMessage = document.getElementById('login-status');
            
            if (!email || !password) {
                if (statusMessage) {
                    statusMessage.textContent = 'Veuillez remplir tous les champs';
                    statusMessage.className = 'status-message error';
                }
                return;
            }
            
            const result = login(email, password);
            
            if (statusMessage) {
                statusMessage.textContent = result.message;
                statusMessage.className = 'status-message ' + (result.success ? 'success' : 'error');
            }
            
            if (result.success) {
                setTimeout(() => {
                    window.location.href = 'app.html';
                }, 1000);
            }
        });
    }
    
    // Gestionnaire pour le bouton d'inscription
    if (registerButton) {
        registerButton.addEventListener('click', function() {
            const email = document.getElementById('reg-email')?.value;
            const password = document.getElementById('reg-password')?.value;
            const confirmPassword = document.getElementById('reg-confirm-password')?.value;
            const statusMessage = document.getElementById('register-status');
            
            if (!email || !password || !confirmPassword) {
                if (statusMessage) {
                    statusMessage.textContent = 'Veuillez remplir tous les champs';
                    statusMessage.className = 'status-message error';
                }
                return;
            }
            
            const result = register(email, password, confirmPassword);
            
            if (statusMessage) {
                statusMessage.textContent = result.message;
                statusMessage.className = 'status-message ' + (result.success ? 'success' : 'error');
            }
            
            if (result.success) {
                // Réinitialiser les champs et passer au formulaire de connexion après un délai
                if (document.getElementById('reg-email')) document.getElementById('reg-email').value = '';
                if (document.getElementById('reg-password')) document.getElementById('reg-password').value = '';
                if (document.getElementById('reg-confirm-password')) document.getElementById('reg-confirm-password').value = '';
                
                const strengthMeter = document.getElementById('password-strength');
                const feedback = document.getElementById('password-feedback');
                
                if (strengthMeter) {
                    strengthMeter.className = '';
                    strengthMeter.style.width = '0%';
                }
                
                if (feedback) {
                    feedback.textContent = '';
                }
                
                setTimeout(() => {
                    if (registerForm) registerForm.style.display = 'none';
                    if (loginForm) loginForm.style.display = 'block';
                    if (statusMessage) {
                        statusMessage.className = 'status-message';
                        statusMessage.textContent = '';
                    }
                }, 2000);
            }
        });
    }
    
    // Évaluation en temps réel de la force du mot de passe
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strengthMeter = document.getElementById('password-strength');
            const feedback = document.getElementById('password-feedback');
            
            if (!strengthMeter || !feedback) return;
            
            const evaluation = evaluatePasswordStrength(password);
            
            // Supprimer toutes les classes
            strengthMeter.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
            
            if (password.length === 0) {
                strengthMeter.style.width = '0%';
                feedback.textContent = '';
                return;
            }
            
            strengthMeter.classList.add(evaluation.strengthClass);
            feedback.textContent = evaluation.feedback;
        });
    }
    
    // Bascule pour afficher/masquer le mot de passe
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (!input) return;
            
            if (input.type === 'password') {
                input.type = 'text';
                this.textContent = '🔒';
            } else {
                input.type = 'password';
                this.textContent = '👁️';
            }
        });
    });
    
    // Basculer entre les formulaires de connexion et d'inscription
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function() {
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function() {
            if (registerForm) registerForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        });
    }
}

// Exporter les fonctions pour qu'elles soient disponibles dans d'autres fichiers
window.Auth = {
    checkAuthentication,
    login,
    register,
    logout,
    validateEmail,
    evaluatePasswordStrength,
    initAuthPage
};

// Initialiser la page d'authentification au chargement
document.addEventListener('DOMContentLoaded', function() {
    initAuthPage();
});
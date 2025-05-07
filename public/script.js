document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const serviceSelection = document.getElementById('serviceSelection');
    const ticketDisplay = document.getElementById('ticketDisplay');
    const serviceButtons = document.querySelectorAll('.service-btn');
    const ticketNumSpan = document.getElementById('ticketNum');
    const waitingCountSpan = document.getElementById('waitingCount');
    const estimatedTimeSpan = document.getElementById('estimatedTime');
    const statusBar = document.getElementById('statusBar');
    const newTicketBtn = document.getElementById('newTicketBtn');
    
    let currentTicket = null;
    let queueUpdateInterval = null;

    // Simuler la connexion
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Simulation de vérification (en production, faire une requête au serveur)
        if (username && password) {
            loginSection.classList.add('hidden');
            serviceSelection.classList.remove('hidden');
        }
    });

    // Sélection de service
    serviceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const service = this.getAttribute('data-service');
            getTicket(service);
        });
    });

    // Nouveau ticket
    newTicketBtn.addEventListener('click', function() {
        clearInterval(queueUpdateInterval);
        ticketDisplay.classList.add('hidden');
        serviceSelection.classList.remove('hidden');
    });

    // Fonction pour obtenir un ticket
    function getTicket(service) {
        // Envoyer une requête au serveur pour obtenir un ticket
        fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ service: service })
        })
        .then(response => response.json())
        .then(data => {
            currentTicket = data;
            updateTicketDisplay();
            serviceSelection.classList.add('hidden');
            ticketDisplay.classList.remove('hidden');
            
            // Mettre à jour la file d'attente toutes les 10 secondes
            queueUpdateInterval = setInterval(updateQueueStatus, 10000);
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert('Erreur lors de la création du ticket');
        });
    }

    // Mettre à jour l'affichage du ticket
    function updateTicketDisplay() {
        if (!currentTicket) return;
        
        ticketNumSpan.textContent = currentTicket.ticketNumber;
        waitingCountSpan.textContent = currentTicket.queuePosition;
        estimatedTimeSpan.textContent = Math.round(currentTicket.queuePosition * 2.5); // Estimation: 2.5 min par personne
        
        // Calculer la progression (simulation)
        const progress = Math.max(0, 100 - (currentTicket.queuePosition * 5));
        statusBar.style.width = `${progress}%`;
    }

    // Mettre à jour la position dans la file d'attente
    function updateQueueStatus() {
        if (!currentTicket) return;
        
        fetch(`/api/tickets/${currentTicket.id}/status`)
        .then(response => response.json())
        .then(data => {
            currentTicket.queuePosition = data.queuePosition;
            updateTicketDisplay();
            
            // Si c'est votre tour, afficher une alerte
            if (data.queuePosition === 0) {
                clearInterval(queueUpdateInterval);
                alert('C\'est votre tour! Veuillez vous présenter au guichet.');
            }
        })
        .catch(error => {
            console.error('Erreur de mise à jour:', error);
        });
    }
});
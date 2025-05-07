document.addEventListener('DOMContentLoaded', () => {
    // Références aux éléments DOM
    const DOM = {
      loginForm: document.getElementById('loginForm'),
      loginSection: document.getElementById('loginSection'),
      serviceSelection: document.getElementById('serviceSelection'),
      ticketDisplay: document.getElementById('ticketDisplay'),
      serviceButtons: document.querySelectorAll('.service-btn'),
      ticketNum: document.getElementById('ticketNum'),
      waitingCount: document.getElementById('waitingCount'),
      estimatedTime: document.getElementById('estimatedTime'),
      statusBar: document.getElementById('statusBar'),
      newTicketBtn: document.getElementById('newTicketBtn')
    };
  
    // Configuration
    const config = {
      updateInterval: 10000, // 10 secondes
      avgProcessTime: 2.5 // minutes par personne
    };
  
    // État de l'application
    const state = {
      currentTicket: null,
      queueUpdateInterval: null
    };
  
    // Initialisation
    function init() {
      setupEventListeners();
    }
  
    function setupEventListeners() {
      // Connexion
      DOM.loginForm.addEventListener('submit', handleLogin);
  
      // Sélection de service
      DOM.serviceButtons.forEach(btn => {
        btn.addEventListener('click', () => handleServiceSelection(btn.dataset.service));
      });
  
      // Nouveau ticket
      DOM.newTicketBtn.addEventListener('click', handleNewTicket);
    }
  
    // Gestionnaires d'événements
    async function handleLogin(e) {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
  
      if (username && password) {
        DOM.loginSection.classList.add('hidden');
        DOM.serviceSelection.classList.remove('hidden');
      }
    }
  
    async function handleServiceSelection(service) {
      try {
        const ticket = await getTicket(service);
        state.currentTicket = ticket;
        updateTicketDisplay();
        startQueueUpdates();
        DOM.serviceSelection.classList.add('hidden');
        DOM.ticketDisplay.classList.remove('hidden');
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la création du ticket');
      }
    }
  
    function handleNewTicket() {
      clearInterval(state.queueUpdateInterval);
      DOM.ticketDisplay.classList.add('hidden');
      DOM.serviceSelection.classList.remove('hidden');
    }
  
    // Fonctions principales
    async function getTicket(service) {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service })
      });
  
      if (!response.ok) {
        throw new Error(`Erreur HTTP! statut: ${response.status}`);
      }
  
      return await response.json();
    }
  
    function startQueueUpdates() {
      state.queueUpdateInterval = setInterval(updateQueueStatus, config.updateInterval);
    }
  
    async function updateQueueStatus() {
      if (!state.currentTicket) return;
  
      try {
        const response = await fetch(`/api/tickets/${state.currentTicket.id}/status`);
        const data = await response.json();
  
        state.currentTicket.queuePosition = data.queuePosition;
        updateTicketDisplay();
  
        if (data.queuePosition === 0) {
          clearInterval(state.queueUpdateInterval);
          alert('C\'est votre tour! Veuillez vous présenter au guichet.');
        }
      } catch (error) {
        console.error('Erreur de mise à jour:', error);
      }
    }
  
    // Fonctions d'affichage
    function updateTicketDisplay() {
      DOM.ticketNum.textContent = state.currentTicket.ticketNumber;
      DOM.waitingCount.textContent = state.currentTicket.queuePosition;
      DOM.estimatedTime.textContent = Math.round(state.currentTicket.queuePosition * config.avgProcessTime);
      
      const progress = Math.max(0, 100 - (state.currentTicket.queuePosition * 5));
      DOM.statusBar.style.width = `${progress}%`;
    }
  
    // Démarrer l'application
    init();
  });
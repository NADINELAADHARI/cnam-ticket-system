// Importation des modules
const express = require('express');
const path = require('path');
const cors = require('cors');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Autorise les requêtes cross-origin
app.use(express.json()); // Permet de parser le JSON
app.use(express.static(path.join(__dirname, 'public'))); // Serve les fichiers statiques

// Simulation de base de données
let tickets = [];
let counters = {
  assurance: 1,
  remboursement: 1,
  carte: 1,
  autre: 1
};

// Routes API
/**
 * Crée un nouveau ticket
 * POST /api/tickets
 * Body: { service: 'assurance' | 'remboursement' | 'carte' | 'autre' }
 */
app.post('/api/tickets', (req, res) => {
  const { service } = req.body;
  
  if (!service || !counters[service]) {
    return res.status(400).json({ error: 'Service invalide' });
  }
  
  const ticketNumber = `${service.toUpperCase().substring(0, 3)}-${counters[service]++}`;
  const queuePosition = Math.floor(Math.random() * 15) + 3; // Simulation aléatoire

  const newTicket = {
    id: Date.now().toString(),
    ticketNumber,
    service,
    queuePosition,
    createdAt: new Date()
  };
  
  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

/**
 * Récupère le statut d'un ticket
 * GET /api/tickets/:id/status
 */
app.get('/api/tickets/:id/status', (req, res) => {
  const ticketId = req.params.id;
  const ticket = tickets.find(t => t.id === ticketId);
  
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket non trouvé' });
  }
  
  // Simulation de progression
  ticket.queuePosition = Math.max(0, ticket.queuePosition - Math.floor(Math.random() * 3));
  
  res.json({
    queuePosition: ticket.queuePosition,
    estimatedTime: ticket.queuePosition * 2.5 // Estimation en minutes
  });
});

// Route fallback pour l'application frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Erreur serveur!');
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
  console.log(`URL: http://localhost:${PORT}`);
});
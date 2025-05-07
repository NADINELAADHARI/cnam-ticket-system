require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration MongoDB (version moderne)
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000
};

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
  .then(() => console.log('✅ Connecté à MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Erreur MongoDB:', err.message);
    process.exit(1);
  });

// Schéma et Modèle Ticket
const ticketSchema = new mongoose.Schema({
  service: {
    type: String,
    required: true,
    enum: ['assurance', 'remboursement', 'carte', 'autre'],
    // Supprimez le `uppercase: true` et ajoutez :
    lowercase: true // Convertit automatiquement en minuscules
  },
  numero: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['en_attente', 'en_cours', 'traité'],
    default: 'en_attente'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Création du modèle (important: avant les routes)
const Ticket = mongoose.model('Ticket', ticketSchema);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://cnam-ticket-system.onrender.com/' 
    : 'http://localhost:3000'
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Routes
app.post('/api/tickets', async (req, res) => {
  try {
    let { service } = req.body;
    
    // Conversion en minuscules
    service = service.toLowerCase();
    
    if (!['assurance', 'remboursement', 'carte', 'autre'].includes(service)) {
      return res.status(400).json({ error: 'Service invalide' });
    }

    const lastTicket = await Ticket.findOne({ service }).sort({ numero: -1 });
    const nextNum = lastTicket ? lastTicket.numero + 1 : 1;

    const newTicket = await Ticket.create({
      service,
      numero: nextNum
    });

    const queuePosition = await Ticket.countDocuments({ 
      service, 
      status: 'en_attente',
      createdAt: { $lt: newTicket.createdAt } 
    });

    res.status(201).json({
      // Modifiez cette ligne :
      ticketNumber: `${service.toUpperCase().slice(0, 3)}-${nextNum}`,
      queuePosition,
      estimatedTime: queuePosition * 2.5
    });

  } catch (err) {
    console.error('Erreur création ticket:', err);
    res.status(500).json({ 
      error: 'Erreur serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get('/api/tickets/:id/status', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'ID de ticket invalide' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket introuvable' });

    const queuePosition = await Ticket.countDocuments({ 
      service: ticket.service,
      status: 'en_attente',
      createdAt: { $lt: ticket.createdAt } 
    });

    res.json({
      ticketNumber: `${ticket.service.slice(0, 3).toUpperCase()}-${ticket.numero}`,
      queuePosition,
      estimatedTime: queuePosition * 2.5,
      status: ticket.status
    });

  } catch (err) {
    console.error('Erreur vérification ticket:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/admin', async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: 1 });
  res.json({
    total: tickets.length,
    en_attente: tickets.filter(t => t.status === 'en_attente').length,
    tickets: tickets.map(t => ({
      id: t._id,
      ticket: `${t.service.slice(0, 3).toUpperCase()}-${t.numero}`,
      status: t.status,
      createdAt: t.createdAt
    }))
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
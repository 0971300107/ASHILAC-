// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const WebSocket = require('ws');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
mongoose.connect('mongodb://localhost:27017/ashilac', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Modèles MongoDB
const UserSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'member' },
    profile: {
        phone: String,
        location: String,
        interests: [String]
    }
});

const EventSchema = new mongoose.Schema({
    title: String,
    description: String,
    date: Date,
    location: String,
    capacity: Number,
    price: Number,
    category: String,
    image: String,
    registrations: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date, default: Date.now },
        participants: Number
    }]
});

const FormationSchema = new mongoose.Schema({
    title: String,
    description: String,
    duration: String,
    level: String,
    instructor: String,
    schedule: [{
        day: String,
        time: String
    }],
    students: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        progress: Number,
        completed: Boolean
    }]
});

const models = {
    User: mongoose.model('User', UserSchema),
    Event: mongoose.model('Event', EventSchema),
    Formation: mongoose.model('Formation', FormationSchema)
};

// Routes API

// Authentification
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new models.User({
            name,
            email,
            password: hashedPassword
        });
        
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, 'votre_secret_jwt');
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await models.User.findOne({ email });
        
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        
        const token = jwt.sign({ userId: user._id }, 'votre_secret_jwt');
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Événements
app.get('/api/events', async (req, res) => {
    try {
        const events = await models.Event.find().populate('registrations.user');
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/events/:id/reservations', async (req, res) => {
    try {
        const event = await models.Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Événement non trouvé' });
        
        // Vérifier la capacité
        const totalParticipants = event.registrations.reduce((sum, reg) => sum + reg.participants, 0);
        if (totalParticipants + req.body.participants > event.capacity) {
            return res.status(400).json({ message: 'Capacité maximale atteinte' });
        }
        
        event.registrations.push({
            user: req.body.userId,
            participants: req.body.participants
        });
        
        await event.save();
        res.json({ message: 'Réservation confirmée' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Formations
app.get('/api/formations', async (req, res) => {
    try {
        const formations = await models.Formation.find().populate('students.user');
        res.json(formations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/formations/:id/register', async (req, res) => {
    try {
        const formation = await models.Formation.findById(req.params.id);
        formation.students.push({
            user: req.body.userId,
            progress: 0,
            completed: false
        });
        
        await formation.save();
        res.json({ message: 'Inscription confirmée' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Dashboard
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const [members, events, formations] = await Promise.all([
            models.User.countDocuments(),
            models.Event.countDocuments(),
            models.Formation.countDocuments()
        ]);
        
        res.json({
            members,
            events,
            formations,
            revenue: 1250000 // Exemple
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// WebSocket pour le chat
const wss = new WebSocket.Server({ port: 8080 });
const chatClients = new Set();

wss.on('connection', (ws) => {
    chatClients.add(ws);
    
    ws.on('message', (message) => {
        // Diffuser le message à tous les clients
        chatClients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
    
    ws.on('close', () => {
        chatClients.delete(ws);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
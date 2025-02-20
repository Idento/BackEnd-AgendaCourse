import express, { json } from 'express';
import homeroute from './routes/home.js';
import { createTable } from './utils/database.js';
import planningRouter from './routes/planning.js';
import driverRouter from './routes/driver.js';
import settingsRouter from './routes/settings.js';
import cors from 'cors';

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}))

createTable();

app.use(json()); // Pour parser les corps des requêtes en JSON

// Importez vos routes ici
app.use('/', homeroute)
app.use('/Plannings', planningRouter);
app.use('/Planningsdeschauffeurs', driverRouter);
app.use('/parametres', settingsRouter);


export default app;
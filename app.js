import express, { json } from 'express';
import homeroute from './routes/home';
import { createTable } from './utils/database';
import planningRouter from './routes/planning';
import driverRouter from './routes/driver';
import settingsRouter from './routes/settings';

const app = express();

createTable();

app.use(json()); // Pour parser les corps des requêtes en JSON

// Importez vos routes ici
app.use('/', homeroute)
app.use('/Plannings', planningRouter);
app.use('/Planningsdeschauffeurs', driverRouter);
app.use('/Parametres', settingsRouter);


export default app;
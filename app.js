import express, { json } from 'express';

const app = express();

app.use(json()); // Pour parser les corps des requêtes en JSON

// Importez vos routes ici

export default app;

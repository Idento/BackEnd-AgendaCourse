import express, { json } from 'express';
import homeroute from './routes/home.js';
import { createTable } from './utils/database.js';
import planningRouter from './routes/planning.js';
import driverRouter from './routes/driver.js';
import settingsRouter from './routes/settings.js';
import loginRouter from './routes/login.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createUserTable } from './utils/logindb.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
export const sessionMiddleware = session({
    secret: 'secret_key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 14400000
    }
})
export const corsOptions = cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
})
app.use(corsOptions)
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'dist')));






createTable();
createUserTable();

app.use(json()); // Pour parser les corps des requêtes en JSON

// Importez vos routes ici
app.use('/', loginRouter)
app.use('/Home', homeroute)
app.use('/Plannings', planningRouter);
app.use('/Planningsdeschauffeurs', driverRouter);
app.use('/parametres', settingsRouter);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

export default app;
import express, { json } from 'express';
import homeroute from './routes/home.js';
import { createTable } from './utils/database.js';
import planningRouter from './routes/planning.js';
import driverRouter from './routes/driver.js';
import settingsRouter from './routes/settings.js';
import bddmanageRouter from './routes/bddmanage.js';
import loginRouter from './routes/login.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createUserTable } from './utils/logindb.js';

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


createTable();
createUserTable();

app.use(json()); // Pour parser les corps des requêtes en JSON

// Importez vos routes ici
app.use('/', loginRouter)
app.use('/Home', homeroute)
app.use('/Plannings', planningRouter);
app.use('/Planningsdeschauffeurs', driverRouter);
app.use('/parametres', settingsRouter);
app.use('/bddmanage', bddmanageRouter);

export default app;
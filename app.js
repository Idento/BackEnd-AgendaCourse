import './utils/logger.js'
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
import { createSavedTable } from './utils/savedb.js';
import { savePlanning } from './utils/storeToSaveDB.js';
import { checkAll } from './utils/checkAll.js';


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
createSavedTable();
savePlanning();
checkAll();

app.use(json());


app.use('/api/', loginRouter)
app.use('/api/Home', homeroute)
app.use('/api/Plannings', planningRouter);
app.use('/api/Planningsdeschauffeurs', driverRouter);
app.use('/api/parametres', settingsRouter);
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

export default app;
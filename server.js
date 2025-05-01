import app, { corsOptions, sessionMiddleware } from './app.js'; // Importez la configuration de l'app
import http from 'http';
import { Server as SocketIo } from 'socket.io';
import { frequentHomeUpdate, frequentPlanningUpdate } from './utils/frequentUpdate.js';

const normalizePort = val => {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }
    if (port >= 0) {
        return port;
    }
    return false;
};
const port = normalizePort(process.env.PORT || '3001');
app.set('port', port);

const errorHandler = error => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges.');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use.');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const server = http.createServer(app);
const io = new SocketIo(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type'],
        credentials: true
    }
});

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});
io.on('connection', (socket) => {
    const session = socket.request.session;
    console.log('a user connected');

    if (session && session.user) {

        socket.intervals = {};

        socket.on('pageLocation', (data) => {
            clearInterval(socket.intervals['homeUpdate']);

            if (data === 'home') {
                socket.emit('homeDataUpdate', frequentHomeUpdate());
                console.log('ajout de l\'intervalle homeUpdate');

                socket.intervals['homeDataUpdate'] = setInterval(() => {
                    const data = frequentHomeUpdate();
                    console.log('homeDataUpdate');
                    socket.emit('homeDataUpdate', data);
                }, 60000);
            }
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
            clearInterval(socket.intervals['homeDataUpdate']);
            console.log('homeUpdate cleared');
            clearInterval(socket.intervals['planningUpdate']);
        });
    }
});

server.on('error', errorHandler);
server.on('listening', () => {
    const address = server.address();
    const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
    console.log('Listening on ' + bind);
});

server.listen(port);
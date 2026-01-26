const express = require('express');
const createReservationRouter = require('./controllers/reservation-router');
const createRoomRouter = require('./controllers/room-router');
const config = require('./config');

const tokenExtractor = require ( './middlewares/tokenExtractor' );

const loginRouter = require('./controllers/login-router')
const usersRouter = require( './controllers/user-router' );

const app = express();
const PORT = config.PORT;

app.use(express.json());
app.use(tokenExtractor);

// In-memory data stores
let reservations = [];
let rooms = [];
let users = [];

// Disable 'X-Powered-By' header for security
app.disable('x-powered-by')

// Use the routers
app.use( '/api/login', loginRouter );
app.use('/api/reservations', createReservationRouter(reservations, rooms));
app.use('/api/rooms', createRoomRouter(rooms));
app.use('/api/users', usersRouter(users));

// Start the server

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const createReservationRouter = require('./controllers/reservation-router');
const createRoomRouter = require('./controllers/room-router');
const config = require('./config');

const app = express();
const PORT = config.PORT;

app.use(express.json());

let reservations = [];
let rooms = [];

// Disable 'X-Powered-By' header for security
app.disable('x-powered-by')

// Use the routers
app.use('/api/reservations', createReservationRouter(reservations));
app.use('/api/rooms', createRoomRouter(rooms));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

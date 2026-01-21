const express = require('express');
const createReservationRouter = require('./reservation-router');
const config = require('./config');

const app = express();
const PORT = config.PORT;

app.use(express.json());

let reservations = [];

// Use the reservation router
app.use('/api/reservations', createReservationRouter(reservations));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

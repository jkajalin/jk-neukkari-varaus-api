const router = require('express').Router();
// Import data stores
const { reservations, rooms } = require('../models/data-stores');
const { users } = require('../models/user-model');

router.post('/resetAll', (req, res) => {
    // Clear all data stores
    reservations.length = 0;
    rooms.length = 0;
    users.length = 0;

    response.status(204).end();
});

router.post('/resetReservations', (req, res) => {
    // Clear only reservations
    reservations.length = 0;

    response.status(204).end();
});

router.post('/resetRooms', (req, res) => {
    // Clear only rooms
    rooms.length = 0;

    response.status(204).end();
});

router.post('/resetUsers', (req, res) => {
    // Clear only users
    users.length = 0;

    response.status(204).end();
});

module.exports = router;
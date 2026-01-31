const router = require('express').Router();
// Import data stores
const { reservations, rooms } = require('../models/data-stores');
const { users } = require('../models/user-model');

// Endpoint to reset all data stores for testing purposes
    /*
    * Pre-conditions: None
    * Post-conditions: reservations, rooms, and users arrays are cleared, response sent with 204 status
    */
router.post('/resetAll', (req, res) => {

    // Clear all data stores
    reservations.length = 0;
    rooms.length = 0;
    users.length = 0;

    res.status(204).end();
});

// Endpoint to reset Reservations
    /*
    * Pre-conditions: None
    * Post-conditions: reservations array is cleared, response sent with 204 status
    */
router.post('/resetReservations', (req, res) => {

    // Clear only reservations
    reservations.length = 0;

    res.status(204).end();
});

// Endpoint to reset Rooms
    /*
    * Pre-conditions: None
    * Post-conditions: rooms array is cleared, response sent with 204 status
    */
router.post('/resetRooms', (req, res) => {

    // Clear only rooms
    rooms.length = 0;

    res.status(204).end();
});

// Endpoint to reset Users
    /*
    * Pre-conditions: None
    * Post-conditions: users array is cleared, response sent with 204 status
    */
router.post('/resetUsers', (req, res) => {

    // Clear only users
    users.length = 0;

    res.status(204).end();
});

module.exports = router;
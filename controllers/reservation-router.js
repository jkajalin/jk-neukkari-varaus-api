const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { reservations, rooms } = require('../models/data-stores');

/*
* Pre-conditions: None
* Post-conditions: Returns an Express router configured with reservation routes
*/
function createReservationRouter() {
    const router = express.Router();

    // Create a reservation
    /*
    * Pre-conditions: req.body contains roomId, startTime, endTime; roomId exists in rooms; startTime < endTime; startTime >= now; no overlapping reservations for the room
    * Post-conditions: A new reservation object is added to the reservations array with a unique id, response sent with 201 status and the reservation data
    */
    router.post('/', (req, res) => {

        const { roomId, startTime, endTime } = req.body;
        
        // Validate required fields
        if (!roomId || !startTime || !endTime) {
            return res.status(400).json({ message: 'Room ID, startTime, and endTime are required.' });
        }

        // Check if room exists
        const room = rooms.find(r => r.id === roomId);
        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Check if start time is before end time
        if (start >= end) {
            return res.status(400).json({ message: 'Start time must be before end time.' });
        }

        // Check if the reservation is in the past
        if (start < now) {
            return res.status(400).json({ message: 'Reservation cannot be in the past.' });
        }

        // Check for overlapping reservations
        const overlapping = reservations.some(reservation => 
            reservation.roomId === roomId && 
            ((start < new Date(reservation.endTime)) && (end > new Date(reservation.startTime)))
        );

        if (overlapping) {
            return res.status(400).json({ message: 'Room is already reserved for this time.' });
        }

        // Add the reservation
        const newReservation = { roomId, startTime, endTime, id: uuidv4() };
        reservations.push(newReservation);
        res.status(201).json({ message: 'Reservation created successfully.', reservation: newReservation });
    });

    // Cancel a reservation by ID
    /*
    * Pre-conditions: req.params.id is a valid reservation id that exists in reservations array
    * Post-conditions: The reservation with the given id is removed from the reservations array, response sent with 200 status
    */
    router.delete('/:id', (req, res) => {

        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'Reservation ID is required.' });
        }

        const initialLength = reservations.length;
        const updatedReservations = reservations.filter(reservation => 
            reservation.id !== id
        );

        if (initialLength === updatedReservations.length) {
            return res.status(404).json({ message: 'Reservation not found.' });
        }

        reservations.length = 0;
        reservations.push(...updatedReservations);
        res.status(200).json({ message: 'Reservation cancelled successfully.' });
    });

    // Get all reservations for a room
    /*
    * Pre-conditions: req.params.roomId is a valid room id
    * Post-conditions: Returns an array of reservations for the given roomId, response sent with 200 status
    */
    router.get('/:roomId', (req, res) => {

        const { roomId } = req.params;
        const roomReservations = reservations.filter(reservation => reservation.roomId === roomId);
        res.status(200).json(roomReservations);
    });

    return router;
}

module.exports = createReservationRouter;

const express = require('express');
const { v4: uuidv4 } = require('uuid');

function createReservationRouter(reservations) {
    const router = express.Router();

    // Create a reservation
    router.post('/', (req, res) => {
        const { room, startTime, endTime } = req.body;
        
        // Validate required fields
        if (!room || !startTime || !endTime) {
            return res.status(400).json({ message: 'Room, startTime, and endTime are required.' });
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
            reservation.room === room && 
            ((start < new Date(reservation.endTime)) && (end > new Date(reservation.startTime)))
        );

        if (overlapping) {
            return res.status(400).json({ message: 'Room is already reserved for this time.' });
        }

        // Add the reservation
        const newReservation = { room, startTime, endTime, id: uuidv4() };
        reservations.push(newReservation);
        res.status(201).json({ message: 'Reservation created successfully.', reservation: newReservation });
    });

    // Cancel a reservation by ID
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

    // Get all rooms
    router.get('/rooms/list', (req, res) => {
        const uniqueRooms = [...new Set(reservations.map(reservation => reservation.room))];
        const rooms = uniqueRooms.map((room, index) => ({
            id: index + 1,
            name: room
        }));
        res.status(200).json(rooms);
    });

    // Get all reservations for a room
    router.get('/:room', (req, res) => {
        const { room } = req.params;
        const roomReservations = reservations.filter(reservation => reservation.room === room);
        res.status(200).json(roomReservations);
    });

    return router;
}

module.exports = createReservationRouter;

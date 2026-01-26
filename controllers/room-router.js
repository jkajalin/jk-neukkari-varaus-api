const express = require('express');
const { v4: uuidv4 } = require('uuid');

const userExtractor = require( '../middlewares/userExtractor' )

function createRoomRouter(rooms) {
    const router = express.Router();

    // Create a new room
    router.post('/', userExtractor, async (req, res) => {
        const { name } = req.body;
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Room name is required.' });
        }

        // Check if room already exists
        const existingRoom = rooms.find(room => room.name === name);
        if (existingRoom) {
            return res.status(409).json({ message: 'Room already exists.' });
        }

        // Create new room
        const newRoom = { id: uuidv4(), name };
        rooms.push(newRoom);
        res.status(201).json({ message: 'Room created successfully.', room: newRoom });
    });

    // Delete a room by ID
    router.delete('/:id', userExtractor, async (req, res) => {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'Room ID is required.' });
        }

        const initialLength = rooms.length;
        const updatedRooms = rooms.filter(room => room.id !== id);

        if (initialLength === updatedRooms.length) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        rooms.length = 0;
        rooms.push(...updatedRooms);
        res.status(200).json({ message: 'Room deleted successfully.' });
    });

    // Get all rooms
    router.get('/', (req, res) => {
        res.status(200).json(rooms);
    });

    // Update a room by ID
    router.put('/:id', userExtractor, async (req, res) => {
        const { id } = req.params;
        const { name } = req.body;

        // Validate required fields
        if (!id) {
            return res.status(400).json({ message: 'Room ID is required.' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Room name is required.' });
        }

        // Find the room to update
        const room = rooms.find(r => r.id === id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found.' });
        }

        // Check if new name already exists (but allow same name)
        const existingRoom = rooms.find(r => r.name === name && r.id !== id);
        if (existingRoom) {
            return res.status(409).json({ message: 'Room name already exists.' });
        }

        // Update room name
        room.name = name;
        res.status(200).json({ message: 'Room updated successfully.', room });
    });

    return router;
}

module.exports = createRoomRouter;

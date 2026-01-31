const express = require('express');
const { v4: uuidv4 } = require('uuid');
const rooms = require('../models/data-stores').rooms;
const userExtractor = require( '../middlewares/userExtractor' )

/*
* Pre-conditions: None
* Post-conditions: Returns an Express router configured with room routes
*/
function createRoomRouter() {
    const router = express.Router();

    // Create a new room
    /*
    * Pre-conditions: req.body contains name; name is unique among existing rooms; user is authenticated
    * Post-conditions: A new room object is added to the rooms array with a unique id, response sent with 201 status and the room data
    */
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
    /*
    * Pre-conditions: req.params.id is a valid room id that exists in rooms array; user is authenticated
    * Post-conditions: The room with the given id is removed from the rooms array, response sent with 200 status
    */
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
    /*
    * Pre-conditions: None
    * Post-conditions: Returns an array of all rooms, response sent with 200 status
    */
    router.get('/', (req, res) => {

        res.status(200).json(rooms);
    });

    // Update a room by ID
    /*
    * Pre-conditions: req.params.id is a valid room id that exists in rooms array; req.body contains name; name is unique among other rooms; user is authenticated
    * Post-conditions: The room's name is updated, response sent with 200 status and the updated room data
    */
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

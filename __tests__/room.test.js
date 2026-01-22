const request = require('supertest');
const express = require('express');
const createRoomRouter = require('../controllers/room-router');

describe('Room Router - POST /api/rooms', () => {
    let app;
    let rooms;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        rooms = [];
        app.use('/api/rooms', createRoomRouter(rooms));
    });

    // Valid room creation
    test('Should create a room successfully', async () => {
        const response = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Room created successfully.');
        expect(response.body.room).toBeDefined();
        expect(response.body.room.name).toBe('Room A');
        expect(response.body.room.id).toBeDefined();
        expect(rooms.length).toBe(1);
    });

    // Edge case: Missing room name
    test('Should return error when room name is missing', async () => {
        const response = await request(app)
            .post('/api/rooms')
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('required');
    });

    // Edge case: Duplicate room name
    test('Should return error when room name already exists', async () => {
        // Create first room
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        // Try to create duplicate
        const response = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain('already exists');
        expect(rooms.length).toBe(1);
    });

    // Multiple rooms creation
    test('Should create multiple rooms with different names', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        const response = await request(app)
            .post('/api/rooms')
            .send({ name: 'Conference Hall' });

        expect(response.status).toBe(201);
        expect(rooms.length).toBe(3);
    });

    // UUID generation
    test('Should generate unique UUID for each room', async () => {
        const res1 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const res2 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        expect(res1.body.room.id).not.toBe(res2.body.room.id);
    });

    // Room name with special characters
    test('Should allow room names with special characters', async () => {
        const response = await request(app)
            .post('/api/rooms')
            .send({ name: 'Meeting Room - Floor 2 (Main)' });

        expect(response.status).toBe(201);
        expect(response.body.room.name).toBe('Meeting Room - Floor 2 (Main)');
    });
});

describe('Room Router - DELETE /api/rooms/:id', () => {
    let app;
    let rooms;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        rooms = [];
        app.use('/api/rooms', createRoomRouter(rooms));
    });

    // Valid room deletion
    test('Should delete a room successfully', async () => {
        const createRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const roomId = createRes.body.room.id;

        const deleteRes = await request(app)
            .delete(`/api/rooms/${roomId}`);

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toBe('Room deleted successfully.');
        expect(rooms.length).toBe(0);
    });

    // Edge case: Non-existent room ID
    test('Should return error when room ID does not exist', async () => {
        const response = await request(app)
            .delete('/api/rooms/nonexistent-id');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Room not found.');
    });

    // Multiple deletions
    test('Should delete specific room when multiple exist', async () => {
        const res1 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const res2 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        const id1 = res1.body.room.id;

        const deleteRes = await request(app)
            .delete(`/api/rooms/${id1}`);

        expect(deleteRes.status).toBe(200);
        expect(rooms.length).toBe(1);
        expect(rooms[0].name).toBe('Room B');
    });

    // Edge case: Duplicate deletion
    test('Should return error when trying to delete already deleted room', async () => {
        const createRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const roomId = createRes.body.room.id;

        // First deletion
        await request(app).delete(`/api/rooms/${roomId}`);

        // Second deletion (should fail)
        const response = await request(app)
            .delete(`/api/rooms/${roomId}`);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Room not found.');
    });
});

describe('Room Router - GET /api/rooms', () => {
    let app;
    let rooms;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        rooms = [];
        app.use('/api/rooms', createRoomRouter(rooms));
    });

    // Get empty list
    test('Should return empty array when no rooms exist', async () => {
        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    // Get single room
    test('Should return single room', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Room A');
        expect(response.body[0]).toHaveProperty('id');
    });

    // Get multiple rooms
    test('Should return multiple rooms', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Conference Hall' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
    });

    // Verify room structure
    test('Should return rooms with correct structure', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(typeof response.body[0].id).toBe('string');
        expect(typeof response.body[0].name).toBe('string');
    });

    // Get after deletion
    test('Should reflect deleted rooms in list', async () => {
        const res1 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        const id = res1.body.room.id;
        await request(app).delete(`/api/rooms/${id}`);

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Room B');
    });

    // JSON format verification
    test('Should return proper JSON format', async () => {
        await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const response = await request(app)
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.type).toMatch(/json/);
        expect(Array.isArray(response.body)).toBe(true);
    });
});

describe('Room Router - PUT /api/rooms/:id', () => {
    let app;
    let rooms;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        rooms = [];
        app.use('/api/rooms', createRoomRouter(rooms));
    });

    // Valid room update
    test('Should update room name successfully', async () => {
        const createRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const roomId = createRes.body.room.id;

        const updateRes = await request(app)
            .put(`/api/rooms/${roomId}`)
            .send({ name: 'Updated Room A' });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.message).toBe('Room updated successfully.');
        expect(updateRes.body.room.id).toBe(roomId);
        expect(updateRes.body.room.name).toBe('Updated Room A');
    });

    // Edge case: Missing room ID
    test('Should return 404 when room ID is empty string', async () => {
        // When request path is /api/rooms/, it becomes empty string for ID
        const response = await request(app)
            .put('/api/rooms/')
            .send({ name: 'New Name' });

        // Since ID is empty string, it won't find a matching room
        expect(response.status).toBe(404);
    });

    // Edge case: Missing room name
    test('Should return error when room name is missing', async () => {
        const createRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const roomId = createRes.body.room.id;

        const response = await request(app)
            .put(`/api/rooms/${roomId}`)
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('required');
    });

    // Edge case: Non-existent room ID
    test('Should return error when room ID does not exist', async () => {
        const response = await request(app)
            .put('/api/rooms/nonexistent-id')
            .send({ name: 'New Name' });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Room not found.');
    });

    // Edge case: Duplicate room name
    test('Should return error when new name already exists', async () => {
        const res1 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const res2 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        const roomId2 = res2.body.room.id;

        const response = await request(app)
            .put(`/api/rooms/${roomId2}`)
            .send({ name: 'Room A' });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain('already exists');
    });

    // Edge case: Update to same name
    test('Should allow updating room to the same name', async () => {
        const createRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const roomId = createRes.body.room.id;

        const response = await request(app)
            .put(`/api/rooms/${roomId}`)
            .send({ name: 'Room A' });

        expect(response.status).toBe(200);
        expect(response.body.room.name).toBe('Room A');
    });

    // Update multiple rooms independently
    test('Should update one room without affecting others', async () => {
        const res1 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const res2 = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room B' });

        const roomId1 = res1.body.room.id;

        const updateRes = await request(app)
            .put(`/api/rooms/${roomId1}`)
            .send({ name: 'Updated Room A' });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.room.name).toBe('Updated Room A');

        // Verify Room B is unchanged
        const listRes = await request(app).get('/api/rooms');
        const roomB = listRes.body.find(r => r.id === res2.body.room.id);
        expect(roomB.name).toBe('Room B');
    });

    // Special characters in updated name
    test('Should allow special characters in updated room name', async () => {
        const createRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const roomId = createRes.body.room.id;

        const response = await request(app)
            .put(`/api/rooms/${roomId}`)
            .send({ name: 'Conference Room - Floor 2 (Main)' });

        expect(response.status).toBe(200);
        expect(response.body.room.name).toBe('Conference Room - Floor 2 (Main)');
    });

    // Verify list reflects update
    test('Should reflect updated room name in list', async () => {
        const createRes = await request(app)
            .post('/api/rooms')
            .send({ name: 'Room A' });

        const roomId = createRes.body.room.id;

        await request(app)
            .put(`/api/rooms/${roomId}`)
            .send({ name: 'Renamed Room A' });

        const listRes = await request(app).get('/api/rooms');

        expect(listRes.body.length).toBe(1);
        expect(listRes.body[0].name).toBe('Renamed Room A');
        expect(listRes.body[0].id).toBe(roomId);
    });
});

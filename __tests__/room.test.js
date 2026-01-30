const supertest = require('supertest');
const app = require('../app');
const { users } = require('../models/user-model');
const { initialUsers } = require('./test_helper');
const { rooms, reservations } = require('../models/data-stores');

const api = supertest(app);

describe('Room API - POST /api/rooms', () => {
    let token;

    beforeEach(async () => {
        // Clear data stores
        users.length = 0;
        rooms.length = 0;
        reservations.length = 0;

        // Create initial user
        await api
            .post('/api/users')
            .send(initialUsers[0]);

        // Login to get token
        const loginRes = await api
            .post('/api/login')
            .send({ username: initialUsers[0].userName, password: initialUsers[0].password });
        token = loginRes.body.token;
    });

    // Valid room creation
    test('Should create a room successfully', async () => {
        const response = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Room created successfully.');
        expect(response.body.room).toBeDefined();
        expect(response.body.room.name).toBe('Room A');
        expect(response.body.room.id).toBeDefined();
        expect(rooms.length).toBe(1);
    });

    // Edge case: Missing room name
    test('Should return error when room name is missing', async () => {
        const response = await api
            .post('/api/rooms')
            .send({})
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('required');
    });

    // Edge case: Duplicate room name
    test('Should return error when room name already exists', async () => {
        // Create first room
        await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        // Try to create duplicate
        const response = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain('already exists');
        expect(rooms.length).toBe(1);
    });

    // Multiple rooms creation
    test('Should create multiple rooms with different names', async () => {
        await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        await api
            .post('/api/rooms')
            .send({ name: 'Room B' })
            .set({ Authorization: `bearer ${token}` });

        const response = await api
            .post('/api/rooms')
            .send({ name: 'Conference Hall' })
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(201);
        expect(rooms.length).toBe(3);
    });

    // UUID generation
    test('Should generate unique UUID for each room', async () => {
        const res1 = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const res2 = await api
            .post('/api/rooms')
            .send({ name: 'Room B' })
            .set({ Authorization: `bearer ${token}` });

        expect(res1.body.room.id).not.toBe(res2.body.room.id);
    });

    // Room name with special characters
    test('Should allow room names with special characters', async () => {
        const response = await api
            .post('/api/rooms')
            .send({ name: 'Meeting Room - Floor 2 (Main)' })
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(201);
        expect(response.body.room.name).toBe('Meeting Room - Floor 2 (Main)');
    });
});

describe('Room API - DELETE /api/rooms/:id', () => {
    let token;

    beforeEach(async () => {
        // Clear data stores
        users.length = 0;
        rooms.length = 0;
        reservations.length = 0;

        // Create initial user
        await api
            .post('/api/users')
            .send(initialUsers[0]);

        // Login to get token
        const loginRes = await api
            .post('/api/login')
            .send({ username: initialUsers[0].userName, password: initialUsers[0].password });
        token = loginRes.body.token;
    });

    // Valid room deletion
    test('Should delete a room successfully', async () => {
        const createRes = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const roomId = createRes.body.room.id;

        const deleteRes = await api
            .delete(`/api/rooms/${roomId}`)
            .set({ Authorization: `bearer ${token}` });

        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.message).toBe('Room deleted successfully.');
        expect(rooms.length).toBe(0);
    });

    // Edge case: Non-existent room ID
    test('Should return error when room ID does not exist', async () => {
        const response = await api
            .delete('/api/rooms/nonexistent-id')
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Room not found.');
    });

    // Multiple deletions
    test('Should delete specific room when multiple exist', async () => {
        const res1 = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const res2 = await api
            .post('/api/rooms')
            .send({ name: 'Room B' })
            .set({ Authorization: `bearer ${token}` });

        const id1 = res1.body.room.id;

        const deleteRes = await api
            .delete(`/api/rooms/${id1}`)
            .set({ Authorization: `bearer ${token}` });

        expect(deleteRes.status).toBe(200);
        expect(rooms.length).toBe(1);
        expect(rooms[0].name).toBe('Room B');
    });

    // Edge case: Duplicate deletion
    test('Should return error when trying to delete already deleted room', async () => {
        const createRes = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const roomId = createRes.body.room.id;

        // First deletion
        await api
            .delete(`/api/rooms/${roomId}`)
            .set({ Authorization: `bearer ${token}` });

        // Second deletion (should fail)
        const response = await api
            .delete(`/api/rooms/${roomId}`)
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Room not found.');
    });
});

describe('Room API - GET /api/rooms', () => {
    let token;

    beforeEach(async () => {
        // Clear data stores
        users.length = 0;
        rooms.length = 0;
        reservations.length = 0;

        // Create initial user
        await api
            .post('/api/users')
            .send(initialUsers[0]);

        // Login to get token
        const loginRes = await api
            .post('/api/login')
            .send({ username: initialUsers[0].userName, password: initialUsers[0].password });
        token = loginRes.body.token;
    });

    // Get empty list
    test('Should return empty array when no rooms exist', async () => {
        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    // Get single room
    test('Should return single room', async () => {
        await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Room A');
        expect(response.body[0]).toHaveProperty('id');
    });

    // Get multiple rooms
    test('Should return multiple rooms', async () => {
        await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        await api
            .post('/api/rooms')
            .send({ name: 'Room B' })
            .set({ Authorization: `bearer ${token}` });

        await api
            .post('/api/rooms')
            .send({ name: 'Conference Hall' })
            .set({ Authorization: `bearer ${token}` });

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
    });

    // Verify room structure
    test('Should return rooms with correct structure', async () => {
        await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const response = await api
            .get('/api/rooms');

        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(typeof response.body[0].id).toBe('string');
        expect(typeof response.body[0].name).toBe('string');
    });

    // Get after deletion
    test('Should reflect deleted rooms in list', async () => {
        const res1 = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        await api
            .post('/api/rooms')
            .send({ name: 'Room B' })
            .set({ Authorization: `bearer ${token}` });

        const id = res1.body.room.id;
        await api
            .delete(`/api/rooms/${id}`)
            .set({ Authorization: `bearer ${token}` });

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Room B');
    });

    // JSON format verification
    test('Should return proper JSON format', async () => {
        await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.type).toMatch(/json/);
        expect(Array.isArray(response.body)).toBe(true);
    });
});

describe('Room API - PUT /api/rooms/:id', () => {
    let token;

    beforeEach(async () => {
        // Clear data stores
        users.length = 0;
        rooms.length = 0;
        reservations.length = 0;

        // Create initial user
        await api
            .post('/api/users')
            .send(initialUsers[0]);

        // Login to get token
        const loginRes = await api
            .post('/api/login')
            .send({ username: initialUsers[0].userName, password: initialUsers[0].password });
        token = loginRes.body.token;
    });

    // Valid room update
    test('Should update room name successfully', async () => {
        const createRes = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const roomId = createRes.body.room.id;

        const updateRes = await api
            .put(`/api/rooms/${roomId}`)
            .send({ name: 'Updated Room A' })
            .set({ Authorization: `bearer ${token}` });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.message).toBe('Room updated successfully.');
        expect(updateRes.body.room.id).toBe(roomId);
        expect(updateRes.body.room.name).toBe('Updated Room A');
    });

    // Edge case: Missing room ID
    test('Should return 404 when room ID is empty string', async () => {
        // When request path is /api/rooms/, it becomes empty string for ID
        const response = await api
            .put('/api/rooms/')
            .send({ name: 'New Name' })
            .set({ Authorization: `bearer ${token}` });

        // Since ID is empty string, it won't find a matching room
        expect(response.status).toBe(404);
    });

    // Edge case: Missing room name
    test('Should return error when room name is missing', async () => {
        const createRes = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const roomId = createRes.body.room.id;

        const response = await api
            .put(`/api/rooms/${roomId}`)
            .send({})
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(400);
        expect(response.body.message).toContain('required');
    });

    // Edge case: Non-existent room ID
    test('Should return error when room ID does not exist', async () => {
        const response = await api
            .put('/api/rooms/nonexistent-id')
            .send({ name: 'New Name' })
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Room not found.');
    });

    // Edge case: Duplicate room name
    test('Should return error when new name already exists', async () => {
        const res1 = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const res2 = await api
            .post('/api/rooms')
            .send({ name: 'Room B' })
            .set({ Authorization: `bearer ${token}` });

        const roomId2 = res2.body.room.id;

        const response = await api
            .put(`/api/rooms/${roomId2}`)
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(409);
        expect(response.body.message).toContain('already exists');
    });

    // Edge case: Update to same name
    test('Should allow updating room to the same name', async () => {
        const createRes = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const roomId = createRes.body.room.id;

        const response = await api
            .put(`/api/rooms/${roomId}`)
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(200);
        expect(response.body.room.name).toBe('Room A');
    });

    // Update multiple rooms independently
    test('Should update one room without affecting others', async () => {
        const res1 = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const res2 = await api
            .post('/api/rooms')
            .send({ name: 'Room B' })
            .set({ Authorization: `bearer ${token}` });

        const roomId1 = res1.body.room.id;

        const updateRes = await api
            .put(`/api/rooms/${roomId1}`)
            .send({ name: 'Updated Room A' })
            .set({ Authorization: `bearer ${token}` });

        expect(updateRes.status).toBe(200);
        expect(updateRes.body.room.name).toBe('Updated Room A');

        // Verify Room B is unchanged
        const listRes = await api.get('/api/rooms');
        const roomB = listRes.body.find(r => r.id === res2.body.room.id);
        expect(roomB.name).toBe('Room B');
    });

    // Special characters in updated name
    test('Should allow special characters in updated room name', async () => {
        const createRes = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const roomId = createRes.body.room.id;

        const response = await api
            .put(`/api/rooms/${roomId}`)
            .send({ name: 'Conference Room - Floor 2 (Main)' })
            .set({ Authorization: `bearer ${token}` });

        expect(response.status).toBe(200);
        expect(response.body.room.name).toBe('Conference Room - Floor 2 (Main)');
    });

    // Verify list reflects update
    test('Should reflect updated room name in list', async () => {
        const createRes = await api
            .post('/api/rooms')
            .send({ name: 'Room A' })
            .set({ Authorization: `bearer ${token}` });

        const roomId = createRes.body.room.id;

        await api
            .put(`/api/rooms/${roomId}`)
            .send({ name: 'Renamed Room A' })
            .set({ Authorization: `bearer ${token}` });

        const listRes = await api.get('/api/rooms');

        expect(listRes.body.length).toBe(1);
        expect(listRes.body[0].name).toBe('Renamed Room A');
        expect(listRes.body[0].id).toBe(roomId);
    });
});

const supertest = require('supertest');
const app = require('../app');
const { users } = require('../models/user-model');
const { initialUsers } = require('./test_helper');
const { rooms, reservations } = require('../models/data-stores');

const api = supertest(app);

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

    // Helper function to create a room
    const createRoom = async (name) => {
        const response = await api
            .post('/api/rooms')
            .send({ name })
            .set({ Authorization: `bearer ${token}` });
        return response.body.room.id;
    };

    // Empty list
    test('Should return empty array when no rooms exist', async () => {
        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
    });

    // Single room
    test('Should return single room when one room exists', async () => {
        await createRoom('Room A');

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0].name).toBe('Room A');
    });

    // Multiple rooms
    test('Should return multiple rooms with correct structure', async () => {
        await createRoom('Room A');
        await createRoom('Room B');
        await createRoom('Conference Hall');

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
        expect(response.body[0].name).toBe('Room A');
        expect(response.body[1].name).toBe('Room B');
        expect(response.body[2].name).toBe('Conference Hall');
    });

    // All rooms returned
    test('Should return all created rooms', async () => {
        await createRoom('Room A');
        await createRoom('Room A 2');
        await createRoom('Room B');

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(3);
        expect(response.body.map(r => r.name)).toContain('Room A');
        expect(response.body.map(r => r.name)).toContain('Room A 2');
        expect(response.body.map(r => r.name)).toContain('Room B');
    });

    // JSON format
    test('Should return proper JSON format with correct headers', async () => {
        await createRoom('Test Room');

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.type).toMatch(/json/);
        expect(Array.isArray(response.body)).toBe(true);
    });

    // Special characters in room names
    test('Should handle room names with special characters', async () => {
        await createRoom('Room-A_1.2');
        await createRoom('Main Conference Room (Floor 2)');

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].name).toBe('Room-A_1.2');
        expect(response.body[1].name).toBe('Main Conference Room (Floor 2)');
    });

    // Deletion is reflected in list
    test('Should not include deleted rooms', async () => {
        const roomAId = await createRoom('Room A');
        await createRoom('Room B');

        // Delete Room A
        await api
            .delete(`/api/rooms/${roomAId}`)
            .set({ Authorization: `bearer ${token}` });

        const response = await api
            .get('/api/rooms');

        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Room B');
    });
});

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { users } = require('../models/user-model');
const userExtractor = require( '../middlewares/userExtractor' );

/*
* Pre-conditions: None
* Post-conditions: Returns an Express router configured with user routes
*/
function createUserRouter() {
    const router = express.Router();

    // Create a new user
    /*
    * Pre-conditions: req.body contains userName, name, password; userName is unique; password length >= 19; either no users exist or user is authenticated
    * Post-conditions: A new user object is added to the users array with hashed password and unique id, response sent with 201 status and the user data
    */
    router.post('/', async ( request, response ) => {

        const { userName, name, password } = request.body;
        // Validate required fields
        if (!userName || !name || !password) {
            return response.status(400).json({ message: 'User name and name are required.' });
        }

        // allow to create user only if no users exist, or request is authenticated
        if ( !request.token ) {
          
          //console.log( users )

          if ( users.length > 0) {
            return response.status(401).json( { error: 'token missing or invalid - login to proceed' } )
          }
        }
        else{
          const decodedToken = jwt.verify( request.token, process.env.SECRET )
          if( !decodedToken.id ){
            return response.status(401).json( { error: 'token missing or invalid - login to proceed' } )
          }
        }

        // Check if user already exists
        const existingUser = users.find(user => user.userName === userName);
        if (existingUser) {
            return response.status(409).json({ message: 'User already exists.' });
        }

        if( password.length < 19 ){
          return response.status(400).json( { error: 'Password must be longer than 19 characters' } )
        }

        const saltRounds = 10
        const passwordHash = await bcrypt.hash(password, saltRounds)

        // Create new user
        const newUser = { userId: uuidv4(), userName, name, passwordHash };
        users.push(newUser);
        response.status(201).json({ message: 'User created successfully.', user: newUser });

    })

    // Delete a user by ID
    /*
    * Pre-conditions: req.params.id is a valid user id that exists in users array; user is authenticated
    * Post-conditions: The user with the given id is removed from the users array, response sent with 200 status
    */
    router.delete('/:id', userExtractor, async (req, res) => {

        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ message: 'User ID is required.' });
        }

        const initialLength = users.length;
        const updatedUsers = users.filter(user => user.userId !== id);

        if (initialLength === updatedUsers.length) {
            return res.status(404).json({ message: 'User not found.' });
        }

        users.length = 0;
        users.push(...updatedUsers);
        res.status(200).json({ message: 'User deleted successfully.' });
    });

    // Get all users
    /*
    * Pre-conditions: None
    * Post-conditions: Returns an array of all users, response sent with 200 status
    */
    router.get('/', (req, res) => {

        res.status(200).json(users);
    });

    return router;
}

module.exports = createUserRouter;
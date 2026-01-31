const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
//const router = require('express').Router()
const { users } = require('../models/user-model');

/*
* Login Router
* Pre-conditions: process.env.SECRET is defined
* Post-conditions: Returns an Express router configured with login routes
*/
function createLoginRouter() {

  const loginRouter = express.Router()


  // Endpoint for user login
  /*
  * Pre-conditions: req.body contains username, password; users array is not empty; user with username exists and password matches
  * Post-conditions: A JWT token is generated and returned with user info, response sent with 200 status
  */
  loginRouter.post('/', async (request, response) => {

    const { username, password } = request.body

    if ( !users &&  users.length === 0) {
            return response.status(401).json( { error: 'users Array empty' } )
    }
    
    //console.log( 'Users in login-router: ', Users )
    
    //const users = Users; // get users array from parameter
    const user = users.find(user => user.userName === username );
    
    //console.log( 'login router - passwordHash: ', user.passwordHash) // debug, is password hash working correctly?

    const passwordCorrect = user === null
      ? false
      : await bcrypt.compare(password, user.passwordHash)

    if (!(user && passwordCorrect)) {
      return response.status(401).json({
        error: 'invalid username or password'
      })
    }

    const userForToken = {
      username: user.userName,
      id: user.userId, // fixed to userId used in "model"
    }
    //console.log( 'login router - userForToken: ', userForToken ) // debug

    // token expires in 60*60 seconds, that is, in one hour // multiplied by 12 for 12 hours
    const token = jwt.sign(
      userForToken,
      process.env.SECRET,
      { expiresIn: 60 * 60 * 12 } // 12 hours
    )

    response
      .status(200)
      .send({ token, username: user.userName, name: user.name }) // token already contains username
  })

  return loginRouter;

}

module.exports = createLoginRouter
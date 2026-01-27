const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
//const router = require('express').Router()


function createLoginRouter( Users ) {

  const loginRouter = express.Router()

  loginRouter.post('/', async (request, response) => {
    const { username, password } = request.body

    if ( !Users &&  Users.length === 0) {
            return response.status(401).json( { error: 'users Array empty' } )
    }
    // debug, is Users array passed correctly?
    console.log( 'Users in login-router: ', Users )
    
    const users = Users; // update users array passed to the router
    const user = users.find(user => user.userName === username );

    // debug, is password hash working correctly?
    console.log( 'passwordHash: ', user.passwordHash)

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
      id: user.id, // id: user._id,
    }

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
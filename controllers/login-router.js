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
    
    //console.log( 'Users in login-router: ', Users )
    
    const users = Users; // get users array from parameter
    const user = users.find(user => user.userName === username );

    // debug, is password hash working correctly?
    //console.log( 'login router - passwordHash: ', user.passwordHash)

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
    //console.log( 'login router - userForToken: ', userForToken )

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
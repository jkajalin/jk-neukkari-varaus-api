const jwt = require('jsonwebtoken')
// Get users array from imported "model" data
const { users } = require('../models/user-model')

/*
* Pre-conditions: request.token is a valid JWT token signed with SECRET, users array is not empty
* Post-conditions: request.user is set to the user object matching the token's id, or error response sent
*/
const userExtractor = (request, response, next) => {

  //console.log( 'userExtractor - request.token: ', request.token ) // debug

  // Verify and decode the token
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  //console.log( 'userExtractor - decodedToken: ', decodedToken ) // debug

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  // Attach user object to request
  if( !users || users.length === 0 ){
    return response.status(401).json( { error: 'No users in the system' } )
  }else{
    request.user = users.find(user => user.userId === decodedToken.id)
  }
  

  //console.log( 'userExtractor - request.user: ', request.user ) // debug

  next()

}

module.exports = userExtractor
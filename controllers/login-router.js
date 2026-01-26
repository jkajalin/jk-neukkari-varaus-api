const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body

  const user = await User.findOne({ username })
  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare( password, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid username or password'
    })
  }

  const userForToken = {
    username: user.username,
    id: user.id, // id: user._id,
  }

  // token expires in 60*60 seconds, that is, in one hour // multiplied by 12 for 12 hours
  const token = jwt.sign(
    userForToken,
    process.env.SECRET,
    { expiresIn: 60*60*12 } // 12 hours
  )

  response
    .status(200)
    .send( { token, username: user.username, name: user.name } ) // token already contains username
})

module.exports = loginRouter
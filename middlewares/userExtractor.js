const jwt = require('jsonwebtoken')

const userExtractor = (request, response, next) => {

   const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }

  request.user = users.find(user => user.userId === decodedToken.id)

  next()

}

module.exports = userExtractor
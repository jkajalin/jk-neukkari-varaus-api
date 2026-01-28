// sample user-model.js

const userModel = {
  userId: 'c0575289-849d-452e-94a1-183b68072acd', // required, unique
  userName: 'sampleUser', // required, unique, minlength: 3
  name: 'Sample User', // required
  passwordHash: 'hashedPassword123', // should also be hidden like in mongoose schema, in real implementation
}

let users = [];

module.exports = { users };
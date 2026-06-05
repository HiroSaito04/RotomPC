//rubia-server\routes\useRoutes.js
const express = require('express');
const { 
  getUsers, 
  createUser, 
  updateUser,  
  deleteUser,  
  loginUser 
} = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/')
  .get(verifyToken, getUsers)
  .post(createUser);

router.route('/:id')
  .put(verifyToken, updateUser)
  .delete(verifyToken, deleteUser);

router.post('/login', loginUser);

module.exports = router;
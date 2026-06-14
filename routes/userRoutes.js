const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);

// router.get('/search', userController.searchUser)

router.get('/:id', userController.getUserById);
router.delete('/:id', userController.deleteUser);
router.put('/:id', userController.updateUser);

module.exports = router;
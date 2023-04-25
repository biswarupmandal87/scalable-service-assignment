var express = require('express');
var router = express.Router();
var adminController = require('../controllers/admin');
var userController = require('../controllers/users');
var validator = require('../validation');
var auth = require('../middlewares/auth');

// admin login api
router.post('/register', validator.validate('adminRegister'), adminController.register);
router.post('/login', validator.validate('adminLogin'), adminController.login);
router.get('/whoami', auth(), adminController.getDetails);
router.get('/logout', auth(), adminController.logout);
router.post('/change-password', auth(), validator.validate('changePassword'), adminController.changePassword);
// User api
router.get('/users', auth(), userController.list);
router.get('/users/:id', auth(), userController.details);
router.delete('/users/:id', auth(), userController.delete);



module.exports = router;
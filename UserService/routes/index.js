var express = require('express');
var router = express.Router();
var userController = require('../controllers/users');
var validator = require('../validation');
var auth = require('../middlewares/auth');

router.post('/register', validator.validate('userRegister'), userController.register);
router.post('/login', validator.validate('userLogin'), userController.login);
router.post('/reset-password', validator.validate('resetPassword'), userController.resetPassword);
router.post('/change-password', auth(), validator.validate('changePassword'), userController.changePassword);
router.get('/whoami', auth(), userController.getUserDetails);
router.put('/profile', auth(), validator.validate('profileUpdate'), userController.profileUpdate);
router.get('/logout', auth(), userController.logout);
module.exports = router;
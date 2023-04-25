var express = require('express');
var router = express.Router();
var adminController = require('../controllers/admin');
var validator = require('../validation');
var auth = require('../middlewares/auth');

// admin login api
router.post('/register', validator.validate('adminRegister'), adminController.register);
router.post('/login', validator.validate('adminLogin'), adminController.login);
router.get('/whoami', auth(), adminController.getDetails);
router.get('/logout', auth(), adminController.logout);
router.post('/change-password', auth(), validator.validate('changePassword'), adminController.changePassword);
// User api
// router.get('/category', auth(), categoryController.list);
// router.get('/category/:id', auth(), categoryController.details);
// router.delete('/category/:id', auth(), validator.validate('deleteCategory'), categoryController.delete);



module.exports = router;
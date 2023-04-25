var express = require('express');
var router = express.Router();
var projectController = require('../controllers/projects');
var validator = require('../validation');
var auth = require('../middlewares/auth');

router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', auth(), validator.validate('addProject'), projectController.createProject);
router.put('/:id', auth(), validator.validate('updateProject'), projectController.updateProject);
router.delete('/:id', auth(), projectController.deleteProject);

module.exports = router;
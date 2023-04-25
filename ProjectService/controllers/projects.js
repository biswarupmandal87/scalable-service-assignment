var Project = require("../models/projects");
var async = require("async");
var { getPagination } = require("../common/utils");
var { validationResult } = require("express-validator");
var projectController = {
    getAllProjects: (req, res) => {
        async.waterfall(
            [
                (callback) => {
                    var page = 1,
                        limit = 5,
                        params = req.query,
                        sort_field = '_created';
                    var sortObj = {};
                    if (params.sortBy) {
                        if (params.sortOrder == 'ASC') {
                            sortObj[sort_field] = 1;
                        } else {
                            sortObj[sort_field] = -1;
                        }
                    } else {
                        sortObj[sort_field] = 1;
                    }

                    if (params.page) {
                        page = parseInt(params.page);
                    }
                    if (params.pageSize) {
                        limit = parseInt(params.pageSize);
                    }
                    var query = {

                    };

                    var populate = [
                        { path: 'owner_id', select: 'first_name last_name' }
                    ]
                    Project.paginate(query, { sort: sortObj, populate: populate, page: page, limit: limit }, function (err, projects) {
                        if (err) {
                            callback(err);
                        }
                        else if (!projects) {
                            callback(null, []);
                        } else {
                            const paginationObj = getPagination(projects);
                            callback(null, projects.docs, paginationObj);
                        }
                    });
                }
            ],
            (err, result, paginationObj) => {
                if (err) {
                    return res.send({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                    })
                }
                else {
                    return res.send({
                        success: true,
                        error: false,
                        status: 1,
                        results: result,
                        pagination: paginationObj,
                        message: "Projects fetched successfully",
                    });
                }
            }
        )
    },
    getProjectById: (req, res) => {
        async.waterfall(
            [
                (callback) => {
                    const projectId = req.params.id;
                    if (projectId) {
                        Project.findOne({ _id: projectId }, (err, project) => {
                            if (err) {
                                callback(err);
                            }
                            else if (!project) {
                                callback({ message: "project not exist!" }, null);
                            }
                            else {
                                callback(null, project);
                            }
                        });
                    }
                    else {
                        callback({
                            message: "project Id not found in request!",
                        });
                    }
                },
            ],
            (err, result) => {
                if (err) {
                    return res.send({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                    })
                }
                else {
                    return res.send({
                        success: true,
                        error: false,
                        status: 1,
                        result: result,
                        message: "project details fetched successfully",
                    });
                }
            }
        )
    },
    createProject: (req, res) => {
        async.waterfall(
            [
                (callback) => {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        callback(
                            { message: errors.array({ onlyFirstError: true })[0].msg },
                            null
                        );
                    } else {
                        callback(null);
                    }
                },
                (callback) => {
                    let projectData = {
                        title: req.body.title,
                        description: req.body.description,
                        owner_id: req.user_id,
                        is_enabled: req.body.is_enabled,
                        start_date: Date(req.body.start_date),
                        end_date: Date(req.body.end_date),
                    }
                    Project.create(projectData, (err, project) => {
                        if (err) {
                            callback(err);
                        }
                        else {
                            callback(null, project);
                        }
                    })
                }
            ],
            (err, result) => {
                if (err) {
                    return res.send({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                    });
                }
                else {
                    return res.send({
                        success: true,
                        error: false,
                        status: 1,
                        result: result,
                        message: "project created successfully",
                    });
                }
            }
        )
    },
    updateProject: (req, res) => {
        async.waterfall(
            [
                (callback) => {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        callback(
                            { message: errors.array({ onlyFirstError: true })[0].msg },
                            null
                        );
                    } else {
                        callback(null);
                    }
                },
                (callback) => {
                    Project.findOne({ _id: req.params.id }, (err, project) => {
                        if (err) {
                            callback(err);
                        }
                        else if (!project) {
                            callback({ message: "project Not found!" });
                        }
                        else {
                            let projectData = {
                                title: req.body.title,
                                description: req.body.description,
                                is_enabled: req.body.is_enabled,
                                start_date: Date(req.body.start_date),
                                end_date: Date(req.body.end_date),
                            }
                            Project.findOneAndUpdate(
                                { _id: req.params.id },
                                projectData, { new: true },
                                (err, updatedproject) => {
                                    if (err) {
                                        callback(err);
                                    }
                                    else {
                                        callback(null, updatedproject);
                                    }
                                })
                        }
                    })
                }
            ],
            (err, result) => {
                if (err) {
                    return res.send({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                    });
                }
                else {
                    return res.send({
                        success: true,
                        error: false,
                        status: 1,
                        result: result,
                        message: "project updated successfully",
                    });

                }
            }
        )
    },
    deleteProject: (req, res) => {
        async.waterfall(
            [
                (callback) => {
                    Project.findOne({ _id: req.params.id }, (err, project) => {
                        if (err) {
                            callback(err);
                        }
                        else if (!project) {
                            callback({ message: "project Not found!" });
                        }
                        else {
                            Project.findOneAndDelete({ _id: req.params.id }, (err, deletedproject) => {
                                if (err) {
                                    callback(err);
                                }
                                else {
                                    callback(null, deletedproject);
                                }
                            })
                        }
                    })
                }
            ],
            (err, result) => {
                if (err) {
                    return res.send({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                    });
                }
                else {
                    return res.send({
                        success: true,
                        error: false,
                        status: 1,
                        result: result,
                        message: "project deleted successfully",
                    });

                }
            }
        )
    }
};


module.exports = projectController;
var Admin = require("../models/admin");
var Session = require("../models/adminsession");
var { validationResult } = require("express-validator");
var async = require("async");
const jwt = require("jsonwebtoken");
var jwt_key = require("../config").secret;
var bcrypt = require("bcrypt");
const moment = require("moment");
const requestIp = require("request-ip");
var adminController = {
    register: (req, res) => {
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
                    Admin.findOne({ email: req.body.email }, (err, admin) => {
                        if (err) {
                            callback(err, null);
                        } else if (admin) {
                            callback({ message: "Email ID already registered" }, null);
                        } else {
                            callback(null);
                        }
                    });
                },
                (callback) => {
                    const newAdmin = new Admin({
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        password: req.body.password,
                        display_name:`${req.body.first_name} ${req.body.last_name}`,
                        since: new Date()
                    });

                    newAdmin.save((err) => {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, newAdmin);
                        }
                    });
                },
            ],
            (err, newAdmin) => {
                if (err) {
                    return res.json({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                    });
                } else {
                    return res.json({
                        success: true,
                        error: false,
                        status: 1,
                        message: "Admin registered Successfully.",
                    });
                }
            }
        );
    },
    login: (req, res) => {
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
                    Admin.findOne({ email: req.body.email }, (err, admin) => {
                        if (err) {
                            callback(err, null);
                        } else if (!admin) {
                            callback({ message: "Email ID is not registered" }, null);
                        } 
                        else {
                            callback(null, admin);
                        }
                    });
                },
                (admin, callback) => {
                    if (admin && !admin.validPassword(req.body.password)) {
                        callback({ message: "Wrong password" }, null);
                    } else {
                        callback(null, admin);
                    }
                },
                (admin, callback) => {
                    const token = jwt.sign(
                        {
                            _id: admin._id,
                            email: admin.email,
                        },
                        jwt_key,
                        { expiresIn: "12h" }
                    );
                    var UAParser = require("ua-parser-js");
                    var parser = new UAParser();
                    var uaObj = parser.setUA(req.headers["admin-agent"]);
                    var adminAgent = uaObj.getResult();
                    adminAgent.ip_address = requestIp.getClientIp(req);
                    let newSession = new Session({
                        admin: admin.sessionStore(),
                        token: token,
                        user_agent: adminAgent,
                        _expired: moment().add(12, "h").toDate(),
                    });
                    newSession.save((err) => {
                        if (err) {
                            callback({ message: "Something went wrong!" });
                        } else {
                            callback(null, admin, newSession);
                        }
                    });
                },
                (admin, newSession, callback) => {
                    let updateData = {
                        last_login_at: new Date(),
                    };
                    Admin.updateOne({ _id: admin._id }, updateData, (err, result) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, admin, newSession);
                        }
                    });
                },
            ],
            (err, admin, newSession) => {
                if (err) {
                    return res.json({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                    });
                } else {
                    const token = jwt.sign(
                        {
                            _id: newSession._id,
                        },
                        jwt_key,
                        { expiresIn: "12h" }
                    );
                    return res.json({
                        success: true,
                        error: false,
                        status: 1,
                        message: "Logged In Successfully.",
                        token: token,
                        admin: admin.filter(),
                    });
                }
            }
        );
    },
    changePassword: (req, res) => {
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
                    const { new_password } = req.body;
                    Admin.findOne({ _id: req.user_id }, (err, admin) => {
                        if (err) {
                            callback(err);
                        } else if (!admin) {
                            callback({ message: "Admin Not found!" });
                        } else {
                            callback(null, admin);
                        }
                    });
                },
                (admin, callback) => {
                    const { new_password } = req.body;
                    let updateData = {
                        password: bcrypt.hashSync(new_password, 10),
                    };
                    Admin.updateOne(
                        { _id: req.admin_id },
                        updateData,
                        (err, updatedAdmin) => {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, updatedAdmin);
                            }
                        }
                    );
                },
            ],
            (err, result) => {
                if (err) {
                    return res.send({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                    });
                } else {
                    return res.send({
                        success: true,
                        error: false,
                        status: 1,
                        message: "Password changed successfully",
                    });
                }
            }
        );
    },
    getDetails: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];
        if (req.user_id) {
            Admin.findOne({ _id: req.user_id }, (err, admin) => {
                if (err) {
                    res.json({ success: false, error: true, status: 0, message: err });
                } else if (!admin) {
                    res.json({
                        success: false,
                        error: true,
                        status: 0,
                        message: "Admin not exists",
                    });
                } else {
                    res.json({
                        success: true,
                        error: false,
                        status: 1,
                        result: { token: token, admin: admin.filter() },
                    });
                }
            });
        } else {
            res.json({
                success: false,
                error: true,
                status: 0,
                message: "You are not authenticated!",
            });
        }
    },
    logout: (req, res) => {
        let updateData = {
            active: false,
            logged_out: new Date(),
        };
        Session.findOneAndUpdate(
            { _id: req.session_id },
            { $set: updateData },
            (err) => {
                if (err) {
                    res.json({ success: false, error: true, status: 0, message: err });
                } else {
                    res.send({
                        success: true,
                        error: false,
                        status: 1,
                        message: "Logged out successfully!",
                    });
                }
            }
        );
    }
};
module.exports = adminController;
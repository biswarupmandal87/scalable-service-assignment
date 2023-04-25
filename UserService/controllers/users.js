var User = require("../models/users");
var UserLoginFails = require("./../models/UserLoginFails");
var Session = require("../models/session");
var { validationResult } = require("express-validator");
var async = require("async");
const jwt = require("jsonwebtoken");
var jwt_key = require("../config").secret;
var config = require("../config");
var bcrypt = require("bcrypt");
const moment = require("moment");
const requestIp = require("request-ip");
var userController = {
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
                    User.findOne({ email: req.body.email }, (err, user) => {
                        if (err) {
                            callback(err, null);
                        } else if (user) {
                            callback({ message: "Email ID already registered" }, null);
                        } else {
                            callback(null);
                        }
                    });
                },
                (callback) => {
                    const newUser = new User({
                        first_name: req.body.first_name,
                        last_name: req.body.last_name,
                        email: req.body.email,
                        password: req.body.password,
                        display_name:`${req.body.first_name} ${req.body.last_name}`,
                        since: new Date(),
                        user_activated: true,
                    });
                    newUser.save((err) => {
                        if (err) {
                            callback(err, null);
                        } else {
                            callback(null, newUser);
                        }
                    });
                },
            ],
            (err, newUser) => {
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
                        message: "User registered Successfully.",
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
                    User.findOne({ email: req.body.email }, (err, user) => {
                        if (err) {
                            callback(err, null);
                        } else if (!user) {
                            callback({ message: "Email ID is not registered" }, null);
                        } else if (
                            user.user_locked_until &&
                            user.user_locked_until.length > 0
                        ) {
                            let ip_address = requestIp.getClientIp(req);
                            let ipExists = user.user_locked_until.find(
                                (e) => e.ip_address == ip_address
                            );
                            if (ipExists) {
                                if (ipExists.date > new Date()) {
                                    callback({
                                        message:
                                            "This account is locked due to unsuccessful login attempts.",
                                    });
                                } else {
                                    User.updateOne(
                                        { _id: user._id },
                                        {
                                            $pull: { user_locked_until: { ip_address: ip_address } },
                                        },
                                        (err, result) => {
                                            if (err) {
                                                callback(err);
                                            } else {
                                                callback(null, user);
                                            }
                                        }
                                    );
                                }
                            } else {
                                callback(null, user);
                            }
                        } else {
                            callback(null, user);
                        }
                    });
                },
                //Check Password and Handle Failed Login
                (user, callback) => {
                    if (user && !user.validPassword(req.body.password)) {
                        let ip_address = requestIp.getClientIp(req);
                        let newUserLoginFails = new UserLoginFails({
                            user_id: user._id,
                            email: user.email,
                        });
                        newUserLoginFails.save((err) => {
                            checkFailedAttempts(user, ip_address, callback);
                        });
                    } else {
                        callback(null, user);
                    }
                },
                (user, callback) => {
                    const token = jwt.sign(
                        {
                            _id: user._id,
                            email: user.email,
                        },
                        jwt_key,
                        { expiresIn: "12h" }
                    );
                    var UAParser = require("ua-parser-js");
                    var parser = new UAParser();
                    var uaObj = parser.setUA(req.headers["user-agent"]);
                    var userAgent = uaObj.getResult();
                    userAgent.ip_address = requestIp.getClientIp(req);
                    let newSession = new Session({
                        user: user.sessionStore(),
                        token: token,
                        user_agent: userAgent,
                        _expired: moment().add(12, "h").toDate(),
                    });

                    newSession.save((err) => {
                        if (err) {
                            callback({ message: "Something went wrong!" });
                        } else {
                            callback(null, user, newSession);
                        }
                    });
                },
                (user, newSession, callback) => {
                    let ip_address = requestIp.getClientIp(req);
                    let updateData = {
                        $pull: { failed_attempts: { ip_address: ip_address } },
                        last_login_at: new Date(),
                    };
                    User.updateOne({ _id: user._id }, updateData, (err, result) => {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, user, newSession);
                        }
                    });
                },
            ],
            (err, user, newSession) => {
                if (err) {
                    return res.json({
                        success: false,
                        error: true,
                        status: 0,
                        message: err.message,
                        showActivationLink: err.showActivationLink
                            ? err.showActivationLink
                            : undefined,
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
                        user: user.filter(),
                    });
                }
            }
        );
    },
    resetPassword: (req, res) => {
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
                    const { email } = req.body;
                    User.findOne({ email: email }, (err, user) => {
                        if (err) {
                            callback(err);
                        } else if (!user) {
                            callback({ message: "User Not found!" });
                        } else {
                            callback(null, user);
                        }
                    });
                },
                (user, callback) => {
                    const { new_password } = req.body;
                    let updateData = {
                        password: bcrypt.hashSync(new_password, 10),
                    };
                    User.updateOne(
                        { email: user.email },
                        updateData,
                        (err, updatedUser) => {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, updatedUser);
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
                    const { old_password, new_password } = req.body;
                    User.findOne({ _id: req.user_id }, (err, user) => {
                        if (err) {
                            callback(err);
                        } else if (!user) {
                            callback({ message: "User Not found!" });
                        } else if (!user.validPassword(old_password)) {
                            callback({ message: "Old Password does not match" });
                        } else if (old_password == new_password) {
                            callback({
                                message: "New Password should not be same as Old Password",
                            });
                        } else {
                            callback(null, user);
                        }
                    });
                },
                (user, callback) => {
                    const { new_password } = req.body;
                    let updateData = {
                        password: bcrypt.hashSync(new_password, 10),
                    };
                    User.updateOne(
                        { _id: req.user_id },
                        updateData,
                        (err, updatedUser) => {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, updatedUser);
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
    getUserDetails: (req, res) => {
        const token = req.headers.authorization.split(" ")[1];
        if (req.user_id) {
            User.findOne({ _id: req.user_id }, (err, user) => {
                if (err) {
                    res.json({ success: false, error: true, status: 0, message: err });
                } else if (!user) {
                    res.json({
                        success: false,
                        error: true,
                        status: 0,
                        message: "User not exists",
                    });
                } else {
                    res.json({
                        success: true,
                        error: false,
                        status: 1,
                        result: { token: token, user: user.filter() },
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
    },
    profileUpdate: (req, res) => {
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
                    if (req.user_id) {
                        User.findOne({ _id: req.user_id }, (err, user) => {
                            if (err) {
                                callback(err);
                            } else if (!user) {
                                callback({ message: "User Not found!" });
                            } else {
                                const {
                                    first_name,
                                    last_name,
                                    display_name,
                                    phone,
                                    timezone,
                                    birth_day,
                                } = req.body;
                                let updateData = {
                                    first_name: first_name,
                                    last_name: last_name,
                                    display_name: display_name,
                                    phone: phone,
                                    timezone: timezone,
                                    birth_day: birth_day,
                                };
                                callback(null, user, updateData);
                            }
                        });
                    } else {
                        callback({ message: "something went wrong" });
                    }
                },
                (user, updateData, callback) => {
                    User.findOneAndUpdate(
                        { _id: req.user_id },
                        { $set: updateData },
                        { new: true },
                        (err, updatedUser) => {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, updatedUser);
                            }
                        }
                    );
                },
            ],
            (err, user) => {
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
                        message: "Profile Updated Successfully!",
                        user: user.filter(),
                    });
                }
            }
        );
    },
};
let checkFailedAttempts = (user, ip_address, callback) => {
    if (user.failed_attempts && user.failed_attempts.length > 0) {
        let ipExists = user.failed_attempts.find((e) => e.ip_address == ip_address);
        if (ipExists) {
            let currentCount = ipExists.count;
            let currentFailedDate = moment(ipExists.failed_at);
            let now = moment(new Date());
            let hours_diff = now.diff(currentFailedDate, "m");
            let updateData = {};
            if (hours_diff > 1440) {
                updateData = {
                    count: 1,
                    failed_at: new Date(),
                };
                updateFailedLogin(user, ip_address, updateData, callback);
            } else if (hours_diff < 1440 && hours_diff > 30) {
                if (currentCount + 1 >= 10) {
                    lockAccount(user, ip_address, 24, callback);
                } else {
                    updateData = {
                        count: currentCount + 1,
                        failed_at: ipExists.failed_at,
                    };
                    updateFailedLogin(user, ip_address, updateData, callback);
                }
            } else {
                if (currentCount + 1 >= 5) {
                    lockAccount(user, ip_address, 4, callback);
                } else {
                    updateData = {
                        count: currentCount + 1,
                        failed_at: ipExists.failed_at,
                    };
                    updateFailedLogin(user, ip_address, updateData, callback);
                }
            }
        } else {
            insertNewFailedLogin(user, ip_address, callback);
        }
    } else {
        insertNewFailedLogin(user, ip_address, callback);
    }
};
let lockAccount = (user, ip_address, locked_until, callback) => {
    let newLocked = {
        ip_address: ip_address,
        date: moment().add(locked_until, "h").toDate(),
    };
    User.updateOne(
        { _id: user._id },
        {
            last_login_failed_at: new Date(),
            $push: { user_locked_until: newLocked },
            $pull: { failed_attempts: { ip_address: ip_address } },
        },
        (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback({ message: "Password incorrect." }, null);
            }
        }
    );
};
let insertNewFailedLogin = (user, ip_address, callback) => {
    let newFailedAttempt = {
        ip_address: ip_address,
        count: 1,
        failed_at: new Date(),
    };
    User.updateOne(
        { _id: user._id },
        {
            last_login_failed_at: new Date(),
            $push: { failed_attempts: newFailedAttempt },
        },
        (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback({ message: "Password incorrect." }, null);
            }
        }
    );
};
let updateFailedLogin = (user, ip_address, updateData, callback) => {
    User.updateOne(
        { _id: user._id, "failed_attempts.ip_address": ip_address },
        {
            $set: {
                last_login_failed_at: new Date(),
                "failed_attempts.$.count": updateData.count,
                "failed_attempts.$.failed_at": updateData.failed_at,
            },
        },
        (err, result) => {
            if (err) {
                callback(err);
            } else {
                callback({ message: "Password incorrect." }, null);
            }
        }
    );
};
module.exports = userController;
var User = require("../models/users");
var userController = {
    details: (req, res) => {
        User.findOne({ _id: req.params.id }, (err, user) => {
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
                    result: user.filter(),
                });
            }
        });
    },
    list: (req, res) => {
        User.find({}, (err, users) => {
            if (err) {
                res.json({ success: false, error: true, status: 0, message: err });
            } else if (!users) {
                res.json({
                    success: false,
                    error: true,
                    status: 0,
                    message: "Users not exists",
                });
            } else {
                res.json({
                    success: true,
                    error: false,
                    status: 1,
                    result: users.map((user) => user.filter()),
                });
            }
        });
    },
    delete: (req, res) => {
        User.findOneAndDelete({ _id: req.params.id }, (err, user) => {
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
                    message: "User deleted successfully",
                });
            }
        });
    }
};

module.exports = userController;
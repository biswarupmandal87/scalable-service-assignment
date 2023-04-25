const jwt = require("jsonwebtoken");
const jwt_key = require("../config").secret;
var Session = require("../models/session");
var User = require("../models/users");
const async = require("async");

module.exports = () => {
  return function (req, res, next) {
    async.waterfall(
      [
        // Session token Validation
        (callback) => {
          if (
            (req.headers.authorization &&
              req.headers.authorization.split(" ").length == 2) ||
            (req.cookies && req.cookies.token)
          ) {
            let token = "";
            if (req.headers.authorization) {
              token = req.headers.authorization.split(" ")[1];
            } else {
              token = req.cookies.token;
            }
            try {
              const decodedToken = jwt.verify(token, jwt_key);
              if (decodedToken && decodedToken._id) {
                req.session_id = decodedToken._id;
                callback(null, decodedToken);
              } else {
                callback({ status: 401 });
              }
            } catch (e) {
              callback({ status: 401 });
            }
          } else {
            callback({ status: 401 });
          }
        },
        // Session check
        (decodedToken, callback) => {
          Session.findOne(
            { _id: decodedToken._id, active: true },
            (err, session) => {
              if (err) {
                callback({ message: "Something went wrong!" });
              } else if (!session) {
                callback({ message: "Session expired" });
              } else {
                if (new Date() > session._expired) {
                  callback({ message: "Session expired" });
                } else {
                  callback(null, session);
                }
              }
            }
          );
        },
        // User Token Validataion
        (session, callback) => {
          if (session.token) {
            const token = session.token;
            try {
              const decodedToken = jwt.verify(token, jwt_key);
              if (decodedToken && decodedToken._id) {
                req.user_id = decodedToken._id;
                callback(null, decodedToken);
              } else {
                callback({ status: 401 });
              }
            } catch (e) {
              callback({ status: 401 });
            }
          } else {
            callback({ status: 401 });
          }
        }
      ],
      (err, result) => {
        if (err) {
          if (err.status) {
            return res.status(401).json({
              success: false,
              error: true,
              status: 0,
              message: "You are not authenticated!",
            });
          } else {
            return res.json({
              success: false,
              error: true,
              status: 0,
              message: err.message,
            });
          }
        } else {
          next();
        }
      }
    );
  };
};

#!/usr/bin/env node

/**
 * Module dependencies.
 */
var app = require('./app');
var debug = require('debug')('userService:server');
var mongoose = require('mongoose');
var config = require('./config');
const fs = require('fs');
const express = require('express');
/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || config.port);
app.set('port', port);
/**
 * Create HTTP server.
 */
var http = require('http');
var server = http.createServer(app);
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}
/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}
/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
/** Connection to MongoDB **/
if (config.dbAccess == 'server') {
    var options = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    var db = config.database['server'];
    var connectionString = `mongodb://${db.username}:${db.password}@${db.host}:${db.port}/${db.dbName}?authSource=${db.authDb}`;
    //mongoose.createConnection(connectionString, options);
    mongoose.connect(connectionString, options, function (err) {
        if (err) {
            console.log(err + "connection failed");
        } else {
            //console.log('Connected to database ');
        }
    });
    // Connected handler
    mongoose.connection.on('connected', function (err) {
        console.log(`Connected to DB:${db.host}:${db.port}/${db.dbName}`);
    });
    // Error handler
    mongoose.connection.on('error', function (err) {
        console.log("MongoDB Error: ", err);
    });
    // Reconnect when closed
    mongoose.connection.on('disconnected', function () {
        // self.connectToDatabase();
        mongoose.connect(connectionString, options, function (err) {
            if (err) {
                console.log(err + "connection failed");
            } else {
                //console.log('Connected to database ');
            }
        });
    });
} else {
    var options = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };
    var db = config.database['local'];
    var connectionString = `mongodb://${db.host}:${db.port}/${db.dbName}`;
    mongoose.connect(connectionString, options, function (err) {
        if (err) {
            console.log(err)
        } else {
            console.log(`Connected to database ${db.dbName}`);
        }
    });
}

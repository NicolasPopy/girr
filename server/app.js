"use strict"; // https://stackoverflow.com/a/33001437
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const io = require("./src/websockets")()
const mongoose = require('mongoose');
const basicAuth = require('express-basic-auth');
const config = require("./config/server");
const WebSockets = require("./src/websockets");
const logger = require("./src/logger");
const path = require('path')

mongoose.Promise = Promise;

// to retrieve the absolute project path without doing some magic (ie. '../../..')
global.__base = __dirname + '/';

let password = process.env.GIRR_PASSWORD || config.password;
if(password) {
  app.use(basicAuth({
    users: { girr: password },
    challenge: true,
    realm: 'g1RR'
  }));
}

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
.use(bodyParser.json())
// middleware to use for all requests
.use(function (req, res, next) {
  // do logging
  logger.log('info',
    '[%s] >> %s %s %s',
    req.connection.remoteAddress,
    req.method,
    req.url,
    Object.keys(req.body).length ? JSON.stringify(req.body) : ''
  )
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next() // make sure we go to the next routes and don't stop here
})
// Indique que le dossier /public contient des fichiers statiques
// (middleware chargé de base)
.use(express.static('./dist'))
.use('/data', express.static('./data'))
 // swagger.json
.use('/', require('./src/swagger'))
 // swagger UI
.get('/api', function (req, res) {
  res.sendFile(path.resolve('public/swagger/index.html'))
  app.use('/', express.static('public/swagger'))
})
.use('/api/programs', require('./src/routes/program.js'))
// error middleware
.use((err, req, res, next) => {
  logger.error(err);
  res.status(err.status ? err.status : 500).send(err);
});


mongoose.connect(config.mongo_endpoint, { useMongoClient: true })
mongoose.connection.on('error', console.error.bind(console, 'connection error:'))
mongoose.connection.on('open', () => {
  io.listen(
    app.listen(config.port, () => {
      console.log(`http://localhost:${config.port}/admin.html`);
      console.log(`http://localhost:${config.port}/xsplit.html`);
    })
  );
});

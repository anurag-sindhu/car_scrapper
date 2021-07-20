const express = require('express'),
  app = express(),
  config = require('config'),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  fileUpload = require('express-fileupload'),
  indexRouter = require('./routes/index'),
  { handleError } = require('./helpers/error'),
  check_favorites = require('./services/check_favorites'),
  new_car = require('./services/new_car'),
  utils = require('./util');

app.use(fileUpload());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', indexRouter);
app.use((err, req, res, next) => {
  handleError(err, res);
});

var server = app.listen(config.get('port'), () =>
  console.log(`Example app listening at http://localhost:${config.get('port')}`)
);
module.exports = server;

async function notifyIfAnyNewCarAdded() {
  console.log(`notifyIfAnyNewCarAdded has started`);
  while (true) {
    await new_car.notifyIfAnyNewCarAdded();
    console.log(`An iteration of notifyIfAnyNewCarAdded has completed at ${new Date()}`);
    await utils.sleep(config.get('sleep.ten_minute'));
    if (config.get('is_development')) {
      process.exit(1);
    }
  }
}

async function startFavoritesSearch() {
  console.log(`startFavoritesSearch has started`);
  while (true) {
    await check_favorites.startFavoritesSearch();
    console.log(`An iteration of startFavoritesSearch has completed at ${new Date()}`);
    await utils.sleep(config.get('sleep.five_minute'));
    if (config.get('is_development')) {
      process.exit(1);
    }
  }
}

async function onStart() {
  console.log(`On Start Iterations has started`);
  while (true) {
    try {
      return await Promise.all([notifyIfAnyNewCarAdded(), startFavoritesSearch()]);
    } catch (e) {
      process.exit(1);
    }
  }
}
onStart();

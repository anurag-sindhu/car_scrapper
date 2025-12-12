require('dotenv').config();
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
const port = process.env.PORT || config.get('port');
var server = app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
// module.exports = server;

async function startFavoritesSearch() {
  console.log(`startFavoritesSearch has started`);
  while (true) {
    await check_favorites.startFavoritesSearch();
    console.log(`An iteration of startFavoritesSearch has completed at ${new Date()}`);
    await utils.sleep(config.get('sleep.three_minute'));
    if (config.get('is_development')) {
      process.exit(1);
    }
  }
}

async function onStart() {
  let resp = null;
  let sleep = config.get('sleep.ten_minute');
  console.log(`On Start Iterations has started`);
  while (true) {
    try {
      resp = await new_car.notifyIfAnyNewCarAdded();
      await utils.sleep(config.get('sleep.five_seconds'));
      resp = await check_favorites.startFavoritesSearch();
      if (config.get('is_development')) {
        process.exit(1);
      }
      console.log(
        `--------------------------------------------------------------------------------------------` +
        `--------------------------------------------------------------------------------------------`
      );
    } catch (e) {
      console.log({ e });
    }
    await utils.sleep(sleep);
  }
}

exports.handler = async (event) => {
  return await onStart();
};

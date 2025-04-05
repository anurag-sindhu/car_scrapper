const config = require('config');
const utils = require('../util');

const funcs = {};

funcs.startFavoritesSearch = async () => {
  let data = null;
  let checkCarsEligibility = null;
  let carFound = false;
  let carConfig = false;

  const runCheckOnCarsEligibility = async ({ data = [], carConfig, key }) => {
    if (!Array.isArray(data)) {
      data = [data];
    }
    carFound = false;
    for (const iterator of data) {
      if (iterator.carId == key) {
        carFound = true;
        checkCarsEligibility = utils.checkCarsEligibility({
          carData: iterator,
          additional_params: carConfig.additional_params
        });
        if (checkCarsEligibility) {
          console.log(
            `Car found at ${new Date()} ${'available'.toUpperCase()}: ${iterator.lmsShareLink
            } for: ${key}`
          );
          await utils.sendSlackNotification({ link: iterator.lmsShareLink, carData: iterator });
          await utils.sleep(config.get(`sleep.one_minute`));
        } else {
          console.log(
            `Car found at ${new Date()} but ${'not'.toUpperCase()} available/eligible: ${iterator.lmsShareLink
            } for: ${key}`
          );
        }
      }
    }
    if (!carFound) {
      console.log(`Car ${'not'.toUpperCase()} found at ${new Date()} for: ${key}`);
    }
    await utils.sleep(config.get(`sleep.five_seconds`));
  };
  for (const platform in config.get('favorites')) {
    for (const key in config.get(`favorites.${platform}`)) {
      carConfig = config.get(`favorites.${platform}.${key}`);
      if (platform === 'cars24') {
        data = await utils.getCarsDataFromCars24(
          `${config.get('base_url')}?${carConfig.query}&${utils.addQueryParams(
            config.get('favorites_additional_query_params')
          )}`
        );
      } else {
        data = await utils.getCarDataFromOla({ carId: key });
      }
      await runCheckOnCarsEligibility({ data, carConfig, key });
    }
  }
  console.log(`An iteration of startFavoritesSearch has completed at ${new Date()}`);
  return;
};

module.exports = funcs;

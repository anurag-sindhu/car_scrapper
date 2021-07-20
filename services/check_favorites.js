const config = require('config');
const utils = require('../util');

const funcs = {};

funcs.startFavoritesSearch = async () => {
  let data = null;
  let checkCarsEligibility = null;
  let carFound = false;
  for (const key in config.get('favorites')) {
    carFound = false;
    data = await utils.accommodateWholeData(
      `${config.get('base_url')}?${config.get(`favorites.${key}`).query}&${utils.addQueryParams(
        config.get('favorites_additional_query_params')
      )}`
    );
    for (const iterator of data) {
      if (iterator.carId === key) {
        carFound = true;
        checkCarsEligibility = utils.checkCarsEligibility({
          carData: iterator,
          additional_params:
            (config.has(`favorites.${key}.additional_params`) &&
              config.get(`favorites.${key}.additional_params`)) ||
            undefined
        });
        if (checkCarsEligibility) {
          console.log(`Car found at ${new Date()} available: ${iterator.lmsShareLink} for: ${key}`);
          await utils.sendSlackNotification({ link: iterator.lmsShareLink, carData: iterator });
        } else {
          console.log(
            `Car found at ${new Date()} but not available: ${iterator.lmsShareLink} for: ${key}`
          );
        }
      }
    }
    if (!carFound) {
      console.log(`Car not found at ${new Date()} for: ${key}`);
    }
    await utils.sleep(config.get(`sleep.one_minute`));
  }
  return;
};

module.exports = funcs;

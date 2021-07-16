const config = require('config');
const utils = require('../util');

const funcs = {};

funcs.startFavoritesSearch = async () => {
  let data = null;
  let checkCarsEligibility = null;
  let carFound = false;
  for (const key in config.get('favorites')) {
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
          console.log(`Car found at ${new Date()} available: ${iterator.lmsShareLink}`);
          await utils.sendSlackNotification({ link: iterator.lmsShareLink, carData: iterator });
        } else {
          console.log(`Car found at ${new Date()} but not available: ${iterator.lmsShareLink}`);
        }
      }
    }
    if (!carFound) {
      console.log(`Car not found at ${new Date()} for: ${key}`);
    }
  }
  return;
};

async function start() {
  console.log(`check for favorites Iteration started`);
  while (true) {
    try {
      await funcs.startFavoritesSearch();
      await utils.sleep(config.get('sleep.next_iteration_in_minute'));
      if (config.get('is_development')) {
        process.exit(1);
      }
    } catch (e) {
      process.exit(1);
    }
  }
}
start();

module.exports = funcs;

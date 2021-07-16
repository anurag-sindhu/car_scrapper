const config = require('config');
const utils = require('../util');

const funcs = {};

funcs.startFavoritesSearch = async () => {
  let data = null;
  for (const key in config.get('favorites')) {
    data = await utils.accommodateWholeData(
      `${config.get('base_url')}?${config.get(`favorites.${key}`).query}&${utils.addQueryParams(
        config.get('favorites_additional_query_params')
      )}`
    );
    for (const iterator of data) {
      if (iterator.carId === key && !iterator.reserved) {
        await utils.sleep(config.get('sleep.next_notification_in_minute'));
        await utils.sendSlackNotification({ link: iterator.lmsShareLink, carData: iterator });
      }
    }
  }
  return;
};

async function start() {
  console.log(`Iteration started`);
  while (true) {
    await funcs.startFavoritesSearch();
    await utils.sleep(config.get('sleep.next_iteration_in_minute'));
    if (config.get('is_development')) {
      process.exit(1);
    }
  }
}
// start();

module.exports = funcs;

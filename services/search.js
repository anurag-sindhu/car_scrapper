const config = require('config');
const utils = require('../util');

const funcs = {};

funcs.startSearch = async () => {
  let data = await utils.accommodateWholeData(config.get('url'));
  await sendNotificationIfAnyCarAvailableFromTheFavoriteList(data);
  console.log(`An iteration completed at ${new Date()}`);
  return;
};

async function start() {
  console.log(`Iteration started`);
  while (true) {
    await funcs.startSearch();
    await utils.sleep(config.get('sleep.next_iteration_in_minute'));
    if (config.get('is_development')) {
      process.exit(1);
    }
  }
}

module.exports = funcs;

async function sendNotificationIfAnyCarAvailableFromTheFavoriteList(list) {
  if (!list || !Array.isArray(list)) {
    return;
  }
  for (const iterator of list) {
    if (iterator && iterator.carId) {
      if (!iterator.reserved && !config.has(`avoid.${iterator.carId}`)) {
        if (config.has(`favorites.${iterator.carId}`)) {
          await utils.sleep(config.get('sleep.next_notification_in_minute'));
          await utils.sendSlackNotification({ link: iterator.lmsShareLink, carData: iterator });
        } else {
          if (config.get('suggest') && config.get('is_development')) {
            await sendNotificationIfAnyCarAvailableFromNewParams(iterator);
          }
        }
      }
    }
  }
  return;
}

async function sendNotificationIfAnyCarAvailableFromNewParams(carData) {
  let str = null;
  for (const key in config.get(`new_car_params`)) {
    if (!config.has(`new_car_params.${key}.${carData[key]}`)) {
      break;
    }
  }
  for (const key in config.get(`new_car_params_additional`)) {
    str = `new_car_params_additional.${key}.${carData['make']}_${carData['model']}`;
    if (config.has(str)) {
      if (!(config.get(str) >= carData[key])) {
        break;
      }
    }
  }
  return await utils.sendSlackNotification({ link: carData.lmsShareLink, carData: carData });
}

// start();

const config = require('config');
const fs = require('fs');
const path = require('path');
const notificationSentRecently = {};
const utils = require('../util');

const funcs = {};

funcs.startSearch = async () => {
  let data = await accommodateWholeData();
  await sendNotificationIfAnyCarAvailableFromTheFavoriteList(data);
  await sleep(config.get('sleep.next_iteration_in_minute'));
  return;
};

async function start() {
  while (true) {
    await funcs.startSearch();
    if (config.get('is_development')) {
      console.log('one iteration completed');
      process.exit(1);
    }
  }
}

module.exports = funcs;

async function accommodateWholeData() {
  let getData = null;
  let data = null;
  let getFirstPageData = await getScrappedData();
  if (getFirstPageData && getFirstPageData.data) {
    let totalPages = getFirstPageData.data.totalPages;
    let pageNumber = 1 || getFirstPageData.data.pageable.pageNumber;
    if (getFirstPageData.data && getFirstPageData.data.content) {
      data = [...getFirstPageData.data.content];
    }
    if (!config.get('is_development')) {
      while (totalPages--) {
        await sleep(config.get('sleep.next_page_in_minute'));
        getData = await getScrappedData(++pageNumber);
        if (getData) {
          if (getData.data && getData.data.content) {
            data = [...data, ...getData.data.content];
          }
        }
      }
    }
  }
  return getUniqueCarData(data);
}

async function getScrappedData(page = 1) {
  var options = {
    method: 'GET',
    url: `${config.get('url')}&page=${page}`,
    headers: {
      authority: 'api-sell24.cars24.team',
      'sec-ch-ua': '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
      accept: 'application/json, text/plain, */*',
      pincode: '110001',
      'sec-ch-ua-mobile': '?0',
      'user-agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      origin: 'https://www.cars24.com',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      referer: 'https://www.cars24.com/',
      'accept-language': 'en-US,en;q=0.9'
    }
  };
  return await utils.executeRequest(options);
}

async function sendNotificationIfAnyCarAvailableFromTheFavoriteList(list) {
  if (!list || !Array.isArray(list)) {
    return;
  }
  for (const iterator of list) {
    if (iterator && iterator.carId) {
      if (!iterator.reserved && !config.has(`avoid.${iterator.carId}`)) {
        if (config.has(`favorites.${iterator.carId}`)) {
          await sleep(config.get('sleep.next_car_in_minute'));
          await sendSlackNotification(iterator.lmsShareLink, iterator);
        } else {
          await sendNotificationIfAnyCarAvailableFromNewParams(iterator);
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
  return await sendSlackNotification(carData.lmsShareLink, carData);
}

async function sendSlackNotification(link = null, carData) {
  if (config.get('is_development')) {
    return;
  }
  if (notificationSentRecently[carData.carId]) {
    return;
  }
  notificationSentRecently[carData.carId] = true;
  if (!link) return;
  const fields = [];
  for (const iterator of config.get(`slack.allowed_fields_car`)) {
    fields.push({
      value: `*${iterator}*: ${carData[iterator]}`
    });
  }
  const body = {
    username: config.get('slack.username'),
    channel: config.get('slack.channel'),
    text: `Available: ${link}`,
    fields
  };
  return await utils.executeRequest({
    method: 'POST',
    url: config.get('slack.url'),
    headers: {
      'cache-control': 'no-cache',
      'Content-Type': 'application/json'
    },
    json: true,
    body
  });
}

function sleep(time_in_min = null) {
  if (config.get('is_development')) {
    return;
  }
  if (!time_in_min) {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, time_in_min * 60 * 1000));
}

function getUniqueCarData(data) {
  if (!data) return data;
  const obj = {};
  for (let index = 0; index < data.length; index++) {
    if (obj[data[index].carId]) {
      data[index] = undefined;
    } else {
      obj[data[index].carId] = true;
    }
  }
  let resp = data.filter((value) => {
    if (value) {
      return true;
    }
    return false;
  });
  fs.writeFileSync(path.join(__dirname, '..', `data.json`), JSON.stringify(resp));
  return resp;
}

start();

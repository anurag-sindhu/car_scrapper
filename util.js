const funcs = {};
const request = require('request');
const fs = require('fs');
const config = require('config');
const path = require('path');
const notificationSentRecently = {};
funcs.executeRequest = (options) => {
  if (!options) {
    return;
  }
  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) {
        return reject(error);
      }
      let resp = response.body ? response.body : response;

      return resolve(typeof resp === 'string' && isParsable(resp) ? JSON.parse(resp) : resp);
    });
  });
};

funcs.getCarData = async ({ page = 1, url }) => {
  if (!url) {
    return null;
  }
  var options = {
    method: 'GET',
    url: `${url}&page=${page}`,
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
  return await funcs.executeRequest(options);
};

funcs.sendSlackNotification = async ({ link = null, carData }) => {
  if (config.get('is_development')) {
    return;
  }
  if (!carData || !carData.carId) {
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
  return await funcs.executeRequest({
    method: 'POST',
    url: config.get('slack.url'),
    headers: {
      'cache-control': 'no-cache',
      'Content-Type': 'application/json'
    },
    json: true,
    body
  });
};

funcs.sleep = (time_in_min = null) => {
  if (config.get('is_development')) {
    return;
  }
  if (!time_in_min) {
    return;
  }
  return new Promise((resolve) => setTimeout(resolve, time_in_min * 60 * 1000));
};

funcs.getUniqueCarData = (data, accordingTo = null) => {
  if (!data || !accordingTo) return data;
  const obj = {};
  for (let index = 0; index < data.length; index++) {
    if (obj[data[index][accordingTo]]) {
      data[index] = undefined;
    } else {
      obj[data[index][accordingTo]] = true;
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
};

funcs.accommodateWholeData = async (url) => {
  if (!url) {
    return null;
  }
  let getData = null;
  let data = null;
  let getFirstPageData = await funcs.getCarData({ url });
  if (getFirstPageData && getFirstPageData.data) {
    let pageNumber = getFirstPageData.data.pageable.pageNumber || 1;
    if (getFirstPageData.data && getFirstPageData.data.content) {
      data = [...getFirstPageData.data.content];
    }
    if (!config.get(`is_development`)) {
      while (getFirstPageData.data.totalPages > pageNumber) {
        await funcs.sleep(config.get('sleep.next_page_in_minute'));
        getData = await funcs.getCarData({ page: ++pageNumber, url });
        if (getData) {
          if (getData.data && getData.data.content) {
            data = [...data, ...getData.data.content];
          }
        }
      }
    }
  }
  return funcs.getUniqueCarData(data, 'carId');
};

funcs.addQueryParams = (params) => {
  let str = '';
  if (!params) {
    return str;
  }
  for (const key in params) {
    if (str.length) {
      str += '&';
    }
    str += key + '=' + params[key];
  }
  return str;
};

module.exports = funcs;
function isParsable(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
}

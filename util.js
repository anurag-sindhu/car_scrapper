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

funcs.sendSlackNotification = async ({ carData, text = null }) => {
  if (config.get('is_development')) {
    return;
  }
  if (!carData || !carData.carId) {
    return;
  }
  if (!canWeSendNotification(carData.carId)) {
    return;
  }
  const fields = [];
  for (const iterator of config.get(`slack.allowed_fields_car`)) {
    fields.push({
      value: `*${iterator}*: ${carData[iterator]}`
    });
  }
  const prepareText = () => {
    let str = ``;
    str = text ? `${text}` : 'Available: ';
    str += `${carData.lmsShareLink}`;
    return str;
  };
  const body = {
    username: config.get('slack.username'),
    channel: config.get('slack.channel'),
    text: prepareText(),
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
  fs.writeFileSync(path.join(__dirname, `data.json`), JSON.stringify(resp));
  return resp;
};

funcs.accommodateWholeData = async (url) => {
  if (config.get('is_development')) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, `data.json`)), {
      encoding: 'utf8'
    });
  }

  if (!url) {
    return null;
  }
  url = refreshUrl(url);
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

funcs.checkCarsEligibility = ({ additional_params = null, carData }) => {
  if (!carData) {
    return false;
  }
  if (carData.reserved) {
    return false;
  }
  if (additional_params) {
    if (additional_params.increased) {
      for (const key in additional_params.increased) {
        if (!(carData[key] >= key)) {
          return false;
        }
      }
    }
    if (additional_params.decreased) {
      for (const key in additional_params.decreased) {
        if (!(carData[key] <= additional_params.decreased[key])) {
          return false;
        }
      }
    }
  }
  return true;
};

funcs.getConcernedFields = ({ data }) => {
  const obj = {};
  for (const key of config.get(`slack.allowed_fields_car`)) {
    obj[key] = data[key] || null;
  }
  return obj;
};

funcs.isGoodChoice = ({ data }) => {
  if (!data.reserved) {
    if (data.price && data.make && data.model) {
      if (config.has(`new_car_params_additional.price.${data.make}_${data.model}`)) {
        if (config.get(`new_car_params_additional.price.${data.make}_${data.model}`)) {
          return data.price <=
            config.get(`new_car_params_additional.price.${data.make}_${data.model}`)
            ? true
            : false;
        }
        return false;
      } else {
        const configPath = path.join(__dirname, 'config', 'default.json');
        const configData = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf8', flag: 'r' }));
        configData.new_car_params_additional.price[`${data.make}_${data.model}`] = null;
        fs.writeFileSync(configPath, JSON.stringify(configData));
        return false;
      }
    }
  }
  return false;
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

function canWeSendNotification(carId) {
  if (!carId) {
    return true;
  }
  if (!notificationSentRecently[carId]) {
    notificationSentRecently[carId] = 0;
  }
  if (notificationSentRecently[carId] > config.get(`notification_limit`)) {
    return false;
  }
  notificationSentRecently[carId] = notificationSentRecently[carId] + 1;
  return true;
}

function refreshUrl(url) {
  let str = url;
  const pageOfIndex = url.indexOf(`page=`);
  // if (pageOfIndex) {
  //   url = ``;
  // }
  if (url.indexOf(config.get('base_url')) === -1) {
    str = `${config.get('base_url')}?${url}`;
  }
  return str;
}

const funcs = {};
const request = require('request');
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

module.exports = funcs;
function isParsable(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (err) {
    return false;
  }
}

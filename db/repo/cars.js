const fs = require('fs');
const path = require('path');
const utils = require('../../util');
const filePath = path.join(__dirname, '..', 'tables', `cars.json`);
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({}));
}
const cars = require('../tables/cars.json');
const funcs = {};

funcs.findAll = () => {
  return cars;
};

funcs.findOne = ({ carId }) => {
  return cars[carId] || null;
};

funcs.create = ({ data }) => {
  const existingData = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }));
  const query = `year-range=${data.year}-${new Date().getUTCFullYear()}&carName=${data.carName}`;
  const params = utils.getConcernedFields({ data });
  existingData[data.carId] = { query, params };
  return fs.writeFileSync(filePath, JSON.stringify(existingData));
};

funcs.updateHistoryForParam = ({ carId, param, value }) => {
  const data = funcs.findOne({ carId });
  if (!data.history) {
    data.history = {};
  }
  if (!data.history[param]) {
    data.history[param] = [];
  }
  data.history[param].push({ value: data.params[param], created_at: new Date() });
  data.params[param] = value;
  cars[carId] = data;
  return fs.writeFileSync(filePath, JSON.stringify(cars));
};

funcs.delete = ({ carId }) => {
  const data = fs.readFileSync(filePath);
  if (funcs.findOne({ carId })) {
    delete data[carId];
    return fs.writeFileSync(filePath, JSON.stringify(data));
  }
  return;
};

funcs.isNewProduct = ({ carId }) => {
  return funcs.findOne({ carId }) ? false : true;
};

funcs.checkIfDataHasChanged = ({ carId, value }, param = null) => {
  const hasValueChanged = () => {
    if (data.params[param]) {
      if (data.params[param] > value) {
        funcs.updateHistoryForParam({ carId, param, value });
        return true;
      } else if (data.params[param] < value) {
        funcs.updateHistoryForParam({ carId, param, value });
        return false;
      }
    }
    return false;
  };
  if (funcs.isNewProduct({ carId })) {
    return false;
  }
  const data = funcs.findOne({ carId });
  const old = {};
  old[param] = data.params[param];
  if (hasValueChanged()) {
    return { value: { old: old[param], new: value } };
  } else {
    return false;
  }
};
module.exports = funcs;

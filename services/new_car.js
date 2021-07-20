let config = require('config');
const fs = require('fs');
const path = require('path');
const utils = require('../util');

const funcs = {};

const carsRepo = require('../db/repo/cars');

funcs.notifyIfAnyNewCarAdded = async () => {
  const data = await utils.accommodateWholeData(`${config.get('base_url')}?${config.get('url')}`);
  for (const iterator of data) {
    if (utils.isGoodChoice({ data: iterator })) {
      const isNewProduct = carsRepo.isNewProduct({ carId: iterator.carId });
      if (isNewProduct) {
        carsRepo.create({ data: iterator });
        await utils.sendSlackNotification({
          carData: iterator
        });
        console.log(
          `A new product got added at ${new Date()} : ${iterator.lmsShareLink} for: ${
            iterator.carId
          }`
        );
      } else {
        const interestedParams = ['price'];
        const checkIfDataHasChanged = carsRepo.checkIfDataHasChanged(
          { carId: iterator.carId, value: iterator[interestedParams[0]] },
          (param = interestedParams[0])
        );
        if (checkIfDataHasChanged) {
          await utils.sendSlackNotification({
            carData: iterator,
            text: `Price has decreased from ${checkIfDataHasChanged.value.old}`
          });
          console.log(
            `Price has decreased from ${checkIfDataHasChanged.value.old} at ${new Date()} : ${
              iterator.lmsShareLink
            } for: ${iterator.carId}`
          );
        }
      }
    }
  }
  return;
};

module.exports = funcs;

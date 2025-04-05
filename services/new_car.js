let config = require('config');
let async = require('async');
const utils = require('../util');

const funcs = {};

const carsRepo = require('../db/repo/cars');

funcs.notifyIfAnyNewCarAdded = async () => {
    const { spinnyData, olaData, cars24Data, carDekhoData, truebilData } = await async.series({
        spinnyData: async function() {
            return utils.getCarsDataFromSpinny();
        },
        olaData: async function() {
            return [];
            return utils.getCarsDataFromOla();
        },
        cars24Data: async function() {
            return utils.getCarsDataFromCars24();
        },
        carDekhoData: async function() {
            return [];
            return utils.getLatestCarsFromCardekho();
        },
        truebilData: async function() {
            return utils.getCarsDataFromTruebil();
        }
    });

    const data = [...spinnyData, ...cars24Data, ...carDekhoData, ...olaData, ...truebilData];
    console.log(
        `Total cars: ${data.length}, i.e.: spinnyData=${spinnyData.length},` +
            ` cars24Data=${cars24Data.length}, carDekhoData=${carDekhoData.length}, olaData=${olaData.length},` +
            ` truebilData=${truebilData.length},`
    );
    for (const iterator of data) {
        if (true || utils.isGoodChoice({ data: iterator })) {
            const isNewProduct = carsRepo.isNewProduct({ carId: iterator.carId });
            if (isNewProduct) {
                carsRepo.create({ data: iterator });
                await utils.sendSlackNotification({
                    carData: iterator
                });
                await utils.sleep(config.get('sleep.next_page_in_minute'));
                console.log(
                    `A new product got added at ${new Date()} : ${iterator.lmsShareLink} for: ${iterator.carId}`
                );
            } else {
                const interestedParams = ['price'];
                const checkIfDataHasChanged = carsRepo.checkIfDataHasChanged(
                    { carId: iterator.carId, value: iterator[interestedParams[0]] },
                    (param = interestedParams[0])
                );
                if (checkIfDataHasChanged) {
                    const carDetailsFromDb = carsRepo.findOne({
                        carId: iterator.carId
                    });
                    const carPriceHistoryDetails =
                        (carDetailsFromDb &&
                            carDetailsFromDb.history &&
                            carDetailsFromDb.history.price &&
                            carDetailsFromDb.history.price.length &&
                            carDetailsFromDb.history.price.map(({ value }) => value).join(',')) ||
                        ``;
                    const initialMessage = `Price has decreased from ${carPriceHistoryDetails}`;
                    await utils.sendSlackNotification({
                        carData: iterator,
                        text: initialMessage
                    });
                    await utils.sleep(config.get('sleep.next_page_in_minute'));
                    console.log(
                        `${initialMessage} at ${new Date()} : ${iterator.lmsShareLink} for: ${iterator.carId}`
                    );
                }
            }
        }
    }
    console.log(`An iteration of notifyIfAnyNewCarAdded has completed at ${new Date()}`);
    return;
};

module.exports = funcs;

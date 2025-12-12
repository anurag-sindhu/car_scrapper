let config = require('config');
let async = require('async');
const utils = require('../util');

const funcs = {};

const carsRepo = require('../db/repo/cars');

funcs.notifyIfAnyNewCarAdded = async () => {
    const { spinnyData, cars24Data, carDekhoData } = await async.series({
        spinnyData: async function () {
            return utils.getCarsDataFromSpinny();
        },
        cars24Data: async function () {
            return await utils.getCarsDataFromCars24();
        },
        carDekhoData: async function () {
            return [];
            // return utils.getLatestCarsFromCardekho();
        },
    });

    const data = [...spinnyData, ...cars24Data, ...carDekhoData];
    console.log(
        `Total cars: ${data.length}, i.e.: spinnyData=${spinnyData.length},` +
        ` cars24Data=${cars24Data.length}, carDekhoData=${carDekhoData.length}`
    );
    for (const iterator of data) {
        if (utils.isGoodChoice({ data: { ...iterator } })) {
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
                // Check for reserved status change from false to true
                const carDetailsFromDb = carsRepo.findOne({
                    carId: iterator.carId
                });
                if (carDetailsFromDb && carDetailsFromDb.params) {
                    const previousReserved = (carDetailsFromDb.params.reserved === false || carDetailsFromDb.params.reserved === null || carDetailsFromDb.params.reserved === undefined) ? false : true;
                    const currentReserved = iterator.reserved;

                    // Skip processing if reserved status hasn't changed
                    if (previousReserved === currentReserved) {
                        continue
                    }
                    const wasNotReserved = previousReserved === false || previousReserved === null || previousReserved === undefined;
                    const isNowReserved = currentReserved === true;

                    // Check if reserved changed from false to true
                    // Treat null/undefined as false (not reserved)

                    if (wasNotReserved && isNowReserved) {
                        carsRepo.updateHistoryForParam({
                            carId: iterator.carId,
                            param: 'reserved',
                            value: currentReserved
                        });
                        await utils.sendSlackNotification({
                            carData: iterator,
                            text: `Car has been reserved: ${iterator.carName} (${iterator.year})`
                        });
                        await utils.sleep(config.get('sleep.next_page_in_minute'));
                        console.log(
                            `Car reserved status changed from false to true at ${new Date()} : ${iterator.lmsShareLink} for: ${iterator.carId}`
                        );
                    } else {
                        // Check if reserved changed from true to false
                        const wasReserved = previousReserved === true;
                        const isNowUnreserved = currentReserved === false || currentReserved === null || currentReserved === undefined;

                        if (wasReserved && isNowUnreserved) {
                            carsRepo.updateHistoryForParam({
                                carId: iterator.carId,
                                param: 'reserved',
                                value: currentReserved
                            });
                            await utils.sendSlackNotification({
                                carData: iterator,
                                text: `Car has been unreserved: ${iterator.carName} (${iterator.year})`
                            });
                            await utils.sleep(config.get('sleep.next_page_in_minute'));
                            console.log(
                                `Car reserved status changed from true to false at ${new Date()} : ${iterator.lmsShareLink} for: ${iterator.carId}`
                            );
                        } else {
                            // Update reserved status for any other change (but don't notify)
                            // Note: previousReserved !== currentReserved is already guaranteed by outer else
                            carsRepo.updateHistoryForParam({
                                carId: iterator.carId,
                                param: 'reserved',
                                value: currentReserved
                            });
                        }
                    }
                }

                // Check for price changes
                const interestedParams = ['price'];
                const checkIfDataHasChanged = carsRepo.checkIfDataHasChanged(
                    { carId: iterator.carId, value: iterator[interestedParams[0]] },
                    (param = interestedParams[0])
                );
                if (checkIfDataHasChanged) {
                    const carDetailsFromDbForPrice = carsRepo.findOne({
                        carId: iterator.carId
                    });
                    const carPriceHistoryDetails =
                        (carDetailsFromDbForPrice &&
                            carDetailsFromDbForPrice.history &&
                            carDetailsFromDbForPrice.history.price &&
                            carDetailsFromDbForPrice.history.price.length &&
                            carDetailsFromDbForPrice.history.price.map(({ value }) => value).join(',')) ||
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

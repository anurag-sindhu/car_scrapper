const funcs = {};
const request = require('request');
const fs = require('fs');
const config = require('config');
const path = require('path');
const notificationSentRecently = {};
funcs.executeRequest = options => {
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

funcs.getCarDataFromCars24 = async ({ searchAfter = undefined }) => {
    var options = {
        method: 'POST',
        url: 'https://car-catalog-gateway-in.c24.tech/listing/v1/buy-used-car',
        headers: {
            authority: 'b2c-catalog-gateway.c24.tech',
            accept: 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9,es;q=0.8,pt;q=0.7,hi;q=0.6',
            clientid: '1361104775.1682391845',
            'content-type': 'application/json',
            origin: 'https://www.cars24.com',
            referer: 'https://www.cars24.com/',
            'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            source: 'WebApp',
            'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            userid: '981a8bb9-ef82-400b-a8bc-f74c3d87190f'
        }
    };
    const body = {
        "searchFilter": [
            "businessVertical:=:gs",
            "listingPrice:bw:50000,900000",
            "year:bw:2020,2024",
            "odometer:bw:0,40000",
            "fuelType:in:petrol,cng",
            "ownerNumber:in:1"
        ],
        "cityId": "4709",
        "sort": "bestmatch",
        "size": 20,
        "filterVersion": 3
    };

    body.searchAfter = searchAfter;
    options.body = JSON.stringify(body);
    const resp = await funcs.executeRequest(options);
    return resp;
};


funcs.getCarsDataFromSpinny = async (wholeCars = [], page = 1) => {
    let url = `https://api.spinny.com/v3/api/listing/v3/?min_year=2020` +
        // `&model=altroz,amaze,baleno,brezza,ciaz,city,creta,dzire,elevate,elite-i20,glanza,grand-vitara,i20,i20-active,nexon,sonet,swift,swift-dzire,tiago,urban-cruiser,urban-cruiser-hyryder,venue,verna,victoris,vitara-brezza,grand-i10,exter,new-i20,fronx,tigor,punch,seltos,polo,virtus` +
        `&city=bangalore&o=price&max_mileage=40000&fuel_type=petrol&no_of_owners=1&max_price=900000`;
    url += `&page=${page}`;
    const options = {
        method: 'GET',
        url,
        headers: {
            authority: 'api.spinny.com',
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9,es;q=0.8,pt;q=0.7,hi;q=0.6',
            'content-type': 'application/json',
            cookie:
                'utm_source=direct; platform=web; _gcl_au=1.1.203993904.1687068147; varnishPrefixHome=true; _gid=GA1.2.1723978721.1687593225; _gaexp=GAX1.2.BjcCV-t8TH6uQ3FFunwZWA.19607.0!h0T3zUeZQtOe4aPCwGUmhw.19603.1; _opt_utmc=max_budget_redirection; _clck=1kk35vs|2|fcq|0|1270; _ga=GA1.2.1323004323.1687068147; _clsk=1f6s6i3|1687624627259|2|1|x.clarity.ms/collect; _gat_UA-61804048-1=1; _ga_WQREN8TJ7R=GS1.1.1687624008.4.1.1687624757.29.0.0',
            origin: 'https://www.spinny.com',
            platform: 'web',
            'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        }
    };
    const data = await funcs.executeRequest(options);
    if (data && data.results && data.results.length) {
        wholeCars.push(...data.results);
        const updatedPage = page + 1;
        if (data.next) {
            await funcs.sleep(config.get('sleep.next_page_in_minute'));
            return await funcs.getCarsDataFromSpinny(wholeCars, updatedPage);
        }
    }

    return funcs.wrapSpinnyFields(funcs.getUniqueCarData(wholeCars, 'id'));
};

funcs.getLatestCarsFromCardekho = async (wholeCars = [], pageFrom = 0) => {
    let url = `https://listing.cardekho.com/v1/srp/cardekho?&cityId=49&connectoid=2b96c096-bb1b-3c2d-1327-709ebe4f33e5&sessionid=532fb32200a9cdbff626e7a757bcfd6b&lang_code=en&regionId=0&searchstring=used-2017-2021-year%2Bpetrol%2Bcng%2Bcars%2B0-lakh-to-6-lakh%2Bin%2Bdelhi-ncr&sortby=price&sortorder=asc&dealer_id=&cellValue=43&regCityNames=&regStateNames=&isAssured=1`;
    if (pageFrom) {
        url += `&pagefrom=${pageFrom}`;
    }
    var options = {
        method: 'GET',
        url,
        headers: {
            Cookie:
                'SESSION=NTI0MzY1YjEtY2ViMS00MzdkLTllMWMtYzM5MzNjMmY1NTA2; cd_session_id=524365b1-ceb1-437d-9e1c-c3933c2f5506; firstUTMParamter=www.cardekho.com#referral#null; lastUTMParamter=www.cardekho.com#referral#null'
        }
    };
    const { data } = await funcs.executeRequest(options);
    wholeCars.push(...data.cars);
    const updatedPageFrom = data.from;
    if (updatedPageFrom < data.count) {
        await funcs.sleep(config.get('sleep.next_page_in_minute'));
        return await funcs.getLatestCarsFromCardekho(wholeCars, updatedPageFrom);
    }

    return funcs.wrapCardekhoFields(wholeCars);
};

funcs.wrapCars24Fields = data => {
    if (!data) {
        return null;
    }
    if (!Array.isArray(data)) {
        data = [data];
    }
    const wrapperConfig = {
        price: 'listingPrice',
        registrationNumber: 'maskedRegNum',
        createdDate: ({ firstListingTime }) => new Date(firstListingTime),
        fuelType: 'fuelType',
        year: 'year',
        carName: 'carName',
        make: 'make',
        reserved: ({ status }) => (status === 'AVAILABLE' ? false : true),
        model: 'model',
        kilometerDriven: 'odometer',
        lmsShareLink: ({ carName, year, appointmentId }) => {
            return `https://www.cars24.com/buy-used-${carName
                .toLowerCase()
                .split(' ')
                .join('-')}-${year}-cars-bangalore-${appointmentId}/`;
        },
        carId: `appointmentId`
    };
    const resp = [];
    for (let car of data) {
        resp.push(funcs.getWrappedObject({ data: car, wrapperConfig }));
    }

    return resp;
};

funcs.wrapSpinnyFields = data => {
    if (!data) {
        return null;
    }
    if (!Array.isArray(data)) {
        data = [data];
    }

    const wrapperConfig = {
        registrationNumber: 'rto',
        createdDate: `latest_publish_date`,
        fuelType: 'fuel_type',
        year: 'make_year',
        price: 'price',
        carName: 'model',
        reserved: 'booked',
        kilometerDriven: 'mileage',
        lmsShareLink: ({ permanent_url }) => {
            return `https://www.spinny.com${permanent_url}`;
        },
        carId: `id`
    };
    const resp = [];
    for (let car of data) {
        resp.push(funcs.getWrappedObject({ data: car, wrapperConfig }));
    }

    return resp;
};

funcs.getWrappedObject = ({ data, wrapperConfig }) => {
    const response = {};
    const car = funcs.getFlattenObject({ obj: data });
    for (const iterator of config.get(`slack.allowed_fields_car`)) {
        if (wrapperConfig.hasOwnProperty(iterator)) {
            if (typeof wrapperConfig[iterator] === 'function') {
                response[iterator] = wrapperConfig[iterator](car);
            } else if (typeof wrapperConfig[iterator] === 'object') {
                for (const key in wrapperConfig[iterator]) {
                    if (!response[iterator] && car[key]) {
                        response[iterator] = car[key];
                        break;
                    }
                }
            } else {
                response[iterator] = car[wrapperConfig[iterator]];
            }
        } else {
            response[iterator] = car[iterator];
        }
    }
    return response;
};

funcs.wrapCardekhoFields = cars => {
    if (!cars) {
        return null;
    }
    const wrapperConfig = {
        price: 'p_numeric',
        fuelType: 'ft',
        year: 'myear',
        carName: 'dvn',
        make: 'oem',
        kilometerDriven: 'km',
        registrationNumber: 'city',
        lmsShareLink: ({ vlink }) => {
            const hostUrl = 'https://www.cardekho.com';
            let link = '';
            if (vlink.indexOf(hostUrl) < 0) {
                link += hostUrl;
            }
            link += vlink;
            return link;
        },
        carId: 'gaadi_id'
    };
    const resp = [];
    for (const car of cars) {
        const tempResponse = funcs.getWrappedObject({ data: car, wrapperConfig });
        tempResponse['reserved'] = false;
        resp.push(tempResponse);
    }
    //uniques cars
    const obj = {};
    for (const iterator of resp) {
        if (!obj[iterator.carId]) {
            obj[iterator.carId] = iterator;
        }
    }
    const finalResponse = Object.values(obj);
    return finalResponse;
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
        str = text ? `${text} ` : 'Available: ';
        str += `${carData.lmsShareLink}`;
        return str;
    };
    const body = {
        username: config.get('slack.username'),
        channel: process.env.SLACK_CHANNEL,
        text: prepareText(),
        fields
    };
    const resp = await funcs.executeRequest({
        method: 'POST',
        url: process.env.SLACK_URL,
        headers: {
            'cache-control': 'no-cache',
            'Content-Type': 'application/json'
        },
        json: true,
        body
    });
    return resp;
};

funcs.sleep = (time_in_min = null) => {
    if (!time_in_min) {
        return;
    }
    return new Promise(resolve => setTimeout(resolve, time_in_min * 60 * 1000));
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
    let resp = data.filter(value => {
        if (value) {
            return true;
        }
        return false;
    });
    fs.writeFileSync(path.join(__dirname, `data.json`), JSON.stringify(resp));
    return resp;
};

funcs.getCarsDataFromCars24 = async () => {
    if (config.get('is_development')) {
        return JSON.parse(fs.readFileSync(path.join(__dirname, `data.json`)), {
            encoding: 'utf8'
        });
    }

    let data = null;
    let getData = await funcs.getCarDataFromCars24({ searchAfter: undefined });
    if (getData && getData.content) {
        if (getData.content) {
            data = [...getData.content];
        }

        let totalElements = getData && getData && getData.page && getData.page.totalElements;
        let searchAfter = getData && getData && getData.page && getData.page.searchAfter;
        while (totalElements > data.length) {
            await funcs.sleep(config.get('sleep.next_page_in_minute'));
            getData = await funcs.getCarDataFromCars24({ searchAfter });
            searchAfter = getData && getData && getData.page && getData.page.searchAfter;
            if (getData && getData.content) {
                data = [...data, ...getData.content];
            }
        }
    }
    return funcs.wrapCars24Fields(funcs.getUniqueCarData(data, 'appointmentId'));
};

funcs.addQueryParams = params => {
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
                if (!(carData[key] < additional_params.decreased[key])) {
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

funcs.getFlattenObject = ({ obj, response = {} }) => {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            funcs.getFlattenObject({ obj: obj[key], response });
        } else {
            response[key] = obj[key];
        }
    }
    return response;
};

funcs.isGoodChoice = ({ data }) => {
    let resp = false;
    if (!data.reserved) {
        if (data.make && data.model) {
            const key = `${data.make}_${data.model}`;
            if (
                config.new_car_params_additional[key] ||
                config.has(`new_car_params_additional${key}`)
            ) {
                resp = true;
            } else {
                const configPath = path.join(__dirname, 'config', 'default.json');
                const configData = JSON.parse(
                    fs.readFileSync(configPath, { encoding: 'utf8', flag: 'r' })
                );
                configData.new_car_params_additional[key] = false;
                fs.writeFileSync(configPath, JSON.stringify(configData));
            }
        }
    }
    return resp;
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
    if (notificationSentRecently[carId] >= config.get(`notification_limit`)) {
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

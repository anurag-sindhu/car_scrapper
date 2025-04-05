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
        request(options, function(error, response) {
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
        url: 'https://b2c-catalog-gateway.c24.tech/listing/v1/buy-used-car',
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
        searchFilter: [
            'ownerNumber:in:1',
            'year:bw:2018,2022',
            'make:=:maruti;model:in:swift,baleno,dzire,celerio,vitara brezza,ignis,ciaz,celerio x,swift dzire,brezza:OR:make:=:hyundai;model:in:elite i20,grand i10,venue,verna,aura,grand i10 nios,new i20,i20 active,i20,i10,creta:OR:make:=:tata;model:in:tiago,altroz,tigor,nexon,punch:OR:make:=:honda;model:in:city,amaze:OR:make:=:toyota;model:in:glanza,urban cruiser:OR:make:=:volkswagen;model:in:polo:OR:make:=:kia;model:in:seltos',
            'fuelType:in:petrol',
            'listingPrice:bw:400000,1000000'
        ],
        cityId: '4709',
        sort: 'plh',
        size: 20,
        financeInfo: { percentageDp: 0.1, roi: 12.5, tenure: 60 }
    };
    body.searchAfter = searchAfter;
    options.body = JSON.stringify(body);
    return await funcs.executeRequest(options);
};

funcs.getCarsDataFromOla = async (wholeCars = [], pagination_begin = 0, pagination_size = 50) => {
    const options = {
        method: 'POST',
        url: 'https://www.ola.cars/vc-api/consumerservice/rest/v1/car/listing?pagination=true',
        headers: {
            authority: 'www.ola.cars',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="96", "Google Chrome";v="96"',
            tracestate: '362501@nr=0-1-3242240-1040359678-68cd9426ab7424a5----1640433621949',
            traceparent: '00-e135546448ec40266c66f2cf80838360-68cd9426ab7424a5-01',
            'sec-ch-ua-mobile': '?0',
            'user-agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
            newrelic:
                'eyJ2IjpbMCwxXSwiZCI6eyJ0eSI6IkJyb3dzZXIiLCJhYyI6IjMyNDIyNDAiLCJhcCI6IjEwNDAzNTk2NzgiLCJpZCI6IjY4Y2Q5NDI2YWI3NDI0YTUiLCJ0ciI6ImUxMzU1NDY0NDhlYzQwMjY2YzY2ZjJjZjgwODM4MzYwIiwidGkiOjE2NDA0MzM2MjE5NDksInRrIjoiMzYyNTAxIn19',
            'content-type': 'application/json',
            'x-fingerprint-id': 'd81b04cef5f499571aafe9082a9d25f4',
            'x-requested-with': 'XMLHttpRequest',
            'csrf-token': 'eXivVPwv-EG3vaQr-PHPjpV_keHsimdrJVJ4',
            'sec-ch-ua-platform': '"macOS"',
            accept: '*/*',
            origin: 'https://www.ola.cars',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'cors',
            'sec-fetch-dest': 'empty',
            referer:
                'https://www.ola.cars/listings/buy-used+price-is-50000-to-550000+make-is-2017-to-2021+fuel-is-petrol,cng+city-is-delhi',
            'accept-language': 'en-US,en;q=0.9,es;q=0.8',
            cookie:
                '_csrf=awWz7B9AIrKJEom-2vRacnkI; XSRF-TOKEN=eXivVPwv-EG3vaQr-PHPjpV_keHsimdrJVJ4; OSRN_v1=B27ANqs7QbAfhVpUErlXd3yH; s_f_id=1f144aa8-b957-45b1-b8d8-0941c0e54828; _gcl_au=1.1.2050116219.1637034166; __zlcmid=175kU5bjKNDSRcJ; _scid=3c628600-f82b-4f4a-873c-558835e51bc7; _sctr=1|1637692200000; _gcl_aw=GCL.1637759616.CjwKCAiA4veMBhAMEiwAU4XRr8F7EQIMd4u2RPwQKwqZi6KCSoeVzqmiuift9YDmGpoSHxnvkj_pyRoCcFUQAvD_BwE; moe_uuid=c485467b-0218-498b-b270-66f375650487; wasc=web-d4bbfe7e-1b5b-47e6-a6c3-50d037f6b9aa__AQECAHgfxP3kLfatAqX5D3Wm8Q4cwpCiqFMlbQIth8I9m4HyQQAAANswgdgGCSqGSIb3DQEHBqCByjCBxwIBADCBwQYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAxwo8iWjbOl3mr2aSkCARCAgZMe9JAPSbodBNssIIAqhAn3Ww8l2lqccu4qzBzXA0H7tOBORrWVwwLM0iybWDq2A7Rom82XGg8j5OVBCKvjxjQ%2Bc9r1lkhjbtdgculHxVZUOFDT3niRwMyc5Kze5IkUtzRi8MKpgxqQAkO5s%2BdIqQFc5GfcKyI5hkUvT1W454vk305032YUDBKJOor6Xgd4l2amzPc%3D; _ga=GA1.1.1748678174.1637034166; _ga_H6KSWWYNZK=GS1.1.1640421302.83.1.1640421493.52; OSRN_v1=GG3TZKEqtbjNgwmf7CSjQSpv'
        },
        body: JSON.stringify({
            sort: 'PLH',
            city: 'delhi',
            pagination_begin,
            pagination_size,
            price_range: { low: '50000', high: '550000' },
            make_year: { low: '2017', high: '2021' },
            fuel_type: ['petrol', 'cng']
        })
    };
    const { data } = await funcs.executeRequest(options);
    if (data && data.cars && data.cars.length) {
        wholeCars.push(...data.cars);
    }
    const updatedPaginationBegin = pagination_begin + 1;
    if (updatedPaginationBegin * pagination_size < data.total_count) {
        await funcs.sleep(config.get('sleep.next_page_in_minute'));
        return await funcs.getCarsDataFromOla(wholeCars, updatedPaginationBegin);
    }

    return funcs.wrapOlaFields(wholeCars);
};

funcs.getCarsDataFromSpinny = async (wholeCars = [], page = 1) => {
    let url = `https://api.spinny.com/v3/api/listing/?city=bangalore&product_type=cars&category=used&max_price=1000000&min_year=2018&fuel_type=petrol&no_of_owners=1&model=altroz,amaze,ameo,aura,baleno,brezza,celerio,ciaz,city,creta,dzire,glanza,grand-i10,grand-i10-nios,grand-vitara,hector,hector-plus,i10,i20,ignis,jazz,nexon,polo,s-cross,seltos,sonet,swift,tiago,tiago-nrg,tigor,urban-cruiser,urban-cruiser-hyryder,venue,venue-nline,verna,xcent,xl6,fronx&o=price&min_price=400000&page=1&prioritize_filter_listing=true&high_intent_required=false`;
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

funcs.getCarsDataFromTruebil = async (wholeCars = [], page = 1) => {
    let url = `https://api-v2.truebil.com/v3/api/listing/?city=bangalore&product_type=cars&category=used&min_year=2018&fuel_type=petrol&no_of_owners=1&o=price&min_price=400000&max_price=1000000&model=altroz,amaze,baleno,brezza,ciaz,city,creta,dzire,fronx,glanza,grand-i10,grand-i10-nios,grand-vitara,harrier,i10,i20,ignis,nexon,swift,tiago,tiago-nrg,tigor,urban-cruiser,venue,venue-nline,verna,seltos,sonet&page=1&availability=available&prioritize_filter_listing=true&high_intent_required=false`;
    url += `&page=${page}`;
    const options = {
        method: 'GET',
        url,
        headers: {
            authority: 'api-v2.truebil.com',
            accept: '*/*',
            'accept-language': 'en-US,en;q=0.9,es;q=0.8,pt;q=0.7,hi;q=0.6',
            'content-type': 'application/json',
            cookie:
                '_gid=GA1.2.1101510517.1687623041; utm_medium=gads_c_search; utm_campaign=TBD-Search-Top8-City-Bangalore-Brand; platform=web; _gcl_au=1.1.2144575887.1687623041; varnishPrefixHome=true; _gaexp=GAX1.2.cjxrfFbJTHCdc4LU-FeflQ.19601.1; _gcl_aw=GCL.1687664519.Cj0KCQjwqNqkBhDlARIsAFaxvwy43MwNYxzG6B-mS6jiBvV1nyVBy1nBV2E3d9eJT7LdoUVkNJrO52saArHGEALw_wcB; utm_source=direct; _gat_UA-60246145-1=1; _ga_CXP25HY21K=GS1.1.1687672162.3.0.1687672162.0.0.0; _gat_gtag_UA_60246145_1=1; _ga=GA1.2.434086772.1687623041; _gac_UA-60246145-1=1.1687672218.Cj0KCQjwqNqkBhDlARIsAFaxvwy43MwNYxzG6B-mS6jiBvV1nyVBy1nBV2E3d9eJT7LdoUVkNJrO52saArHGEALw_wcB',
            origin: 'https://www.truebil.com',
            platform: 'web',
            'procurement-category': 'bcm',
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
            return await funcs.getCarsDataFromTruebil(wholeCars, updatedPage);
        }
    }

    return funcs.wrapTruebilFields(funcs.getUniqueCarData(wholeCars, 'id'));
};

funcs.getCarDataFromOla = async ({ carId }) => {
    if (!carId) {
        return null;
    }
    var options = {
        method: 'GET',
        url: `https://www.ola.cars/vc-api/consumerservice/rest/v1/car/unauthorised/details/${carId}`,
        headers: {
            'x-fingerprint-id': 'd81b04cef5f499571aafe9082a9d25f4',
            Cookie:
                '_csrf=P3hnFEcbV8e8nu12QBxmraG6; XSRF-TOKEN=YaZGhSK5-NRza_j56NJhS4u3wx2-eqruEUqE; OSRN_v1=GG3TZKEqtbjNgwmf7CSjQSpv'
        }
    };
    const resp = await funcs.executeRequest(options);
    return resp && resp.data && funcs.wrapOlaFields(resp.data);
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
        registrationNumber: 'registrationDate',
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

funcs.wrapOlaFields = data => {
    if (!data) {
        return null;
    }
    if (!Array.isArray(data)) {
        data = [data];
    }
    const wrapperConfig = {
        registrationNumber: 'registration_state',
        createdDate: ({ created_date }) => new Date(created_date),
        fuelType: 'fuel_type',
        year: 'make_year',
        carName: 'model',
        make: 'brand',
        reserved: ({ inventory_state }) => (inventory_state === 'LISTED' ? false : true),
        model: 'fuel_type',
        kilometerDriven: 'odometer_reading',
        lmsShareLink: ({ inventory_id, brand, body_type, fuel_type, sell_city, car_id }) => {
            if (!inventory_id) {
                inventory_id = car_id;
            }
            let resp =
                `https://www.ola.cars/details/${inventory_id}-buy-used-${brand}-${body_type}` +
                `-with-fuel-type-${fuel_type}-in-${sell_city}`;
            return resp;
        },
        carId: { car_id: 'car_id', inventory_id: 'inventory_id' }
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
        createdDate: `added_on`,
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

funcs.wrapTruebilFields = data => {
    if (!data) {
        return null;
    }
    if (!Array.isArray(data)) {
        data = [data];
    }

    const wrapperConfig = {
        registrationNumber: 'rto',
        carId: `id`,
        createdDate: `added_on`,
        fuelType: 'fuel_type',
        year: 'make_year',
        price: 'price',
        carName: 'model',
        reserved: 'booked',
        kilometerDriven: 'mileage',
        lmsShareLink: ({ permanent_url }) => {
            return `https://www.truebil.com${permanent_url}`;
        }
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
                if (data.year >= config.get(`year-range.from`)) {
                    resp = true;
                }
            } else {
                const configPath = path.join(__dirname, 'config', 'default.json');
                const configData = JSON.parse(
                    fs.readFileSync(configPath, { encoding: 'utf8', flag: 'r' })
                );
                configData.new_car_params_additional[key] = null;
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

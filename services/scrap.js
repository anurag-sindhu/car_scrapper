'use strict'
const request = require('request-promise'),
    cheerio = require('cheerio'),
    URL = require('url');

const funcs = {};

/**
 * this function will Scrap a website,
 * By default it is gonna pick mediumweb
 * @param {url}
 * @returns Promise Array
 */
funcs.startScrap = async ({ url = config.get(`websites.medium.url`) }) => {
    let html = await request.get(url),
        $ = cheerio.load(html.toString()),
        urlAndQueryParams = [],
        urlsArray = [],
        uniqueUrls = [],
        paramsRefCountAndUrl;
    urlAndQueryParams = filterUrlAndQueryParams({ $ });
    urlsArray = getUrlsArray({ arr: urlAndQueryParams, key: 'url' });

    //Remove Duplicates from urlsArray
    uniqueUrls = new Set(urlsArray);
    paramsRefCountAndUrl = filterParamsRefCountAndUrl({
        uniqueUrls,
        urlAndQueryParams
    });
    return paramsRefCountAndUrl;
}

module.exports = funcs;

/**
 * this function will filter out the url and query params from cheerio load
 * @param {$}
 * @returns arr
 */
function filterUrlAndQueryParams({ $ }) {
    let arr = [];
    $("a").each((i, link) => {
        let allHref = URL.parse($(link).attr("href"), true);
        let qArr = Object.keys(allHref['query']);
        let url = allHref['href'].split('?')[0];
        arr.push({ url, qArr });
    });
    return arr;
}

/**
 * this function will filter out the key(given in the params) from and object mixed with other keys
 * By default it's gonna pick url key to filter
 * @param {arr, key}
 * @returns arr
 */
function getUrlsArray({ arr, key = "url" }) {
    return arr.map(x => x[key]);
}

/**
 * this function will filter out the Params, total ref count of a url and all the params attached with that url
 * @param {uniqueUrls, urlAndQueryParams}
 * @returns arr
 */
function filterParamsRefCountAndUrl({ uniqueUrls, urlAndQueryParams }) {
    return [...uniqueUrls].map(url => {
        return {
            url,
            totalRef: urlAndQueryParams.filter(value => value['url'] === url).length,
            params: urlAndQueryParams.find(value => value['url'] === url).qArr,
        }
    });
}
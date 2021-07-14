const funcs = {};

/**
 * This function will insert ScrappedData data into DB
 * @param {data, con}
 * @returns Promise
 */
funcs.insertScrappedData = ({ data, con }) => {
    return new Promise((resolve, reject) => {
        let values = getValuesQuery({ data });
        let query = `INSERT INTO scrap_url(uuid, url, ref_count, params) VALUES ${values};`;
        con.query(query, function (err, result) {
            if (err) return reject(err);
            console.log(`Data inserted ${query}`);
            return resolve(result);
        });
    });
};

module.exports = funcs;

/**
 * This function will generate a query of values, which are supposed to 
 * @param {*} param0 
 */
function getValuesQuery({ data }) {
    let ar = [];
    data.forEach((value, index) => {
        ar.push([`(UUID(), '${value.url}', ${value.totalRef}, '${JSON.stringify(value.params)}')`]);
    });
    return ar.join(", ");
}
const { handler } = require('./index');
handler().then((resp) => console.log({ resp })).catch((err) => console.log({ err }));
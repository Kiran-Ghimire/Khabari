const mongooseLoader = require('./mongoose');
const expressLoader =  require('./express');
const localFunctionLoader =  require('./locals');

let init = async (app) => {
    await mongooseLoader.init();
    await expressLoader.init(app);
    await localFunctionLoader.init(app);
};

module.exports = { init };
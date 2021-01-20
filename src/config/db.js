// connect to mongo db
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const mongoUri = AppConfig.MONGOURI;

const options = {
    useNewUrlParser: true, 
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}

mongoose.connect(mongoUri, options).then(() => {
    console.log('DB connected!!');
}, (err) => {
    console.log('Unable to connect to database:', err)
});
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

//uncaughtException in sync code, ex : console.log(x) ; where x is not define
process.on('uncaughtException',err => {
  process.exit(1);
})

dotenv.config({ path: './config.env' });

const dbURI = process.env.DATABASE.replace('<password>', process.env.PASSWORD);

mongoose
  .connect(dbURI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => console.log('connected to DB'));
// .catch((err) => console.log(err));         unhandled promise rejection

const port = process.env.PORT;

const server = app.listen(port, () => {
  console.log('server started');
});

// if any promise rejected and unhandled
process.on('unhandledRejection', (err) => {
  server.close(() => {
    process.exit(1);
  });
});

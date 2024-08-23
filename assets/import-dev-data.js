const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');

dotenv.config({ path: './config.env' });

const dbURI = process.env.DATABASE.replace('<password>', process.env.PASSWORD);

mongoose
  .connect(dbURI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => console.log('connected to DB'))
  .catch((err) => console.log(err));

//Read JSON File
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

//IMPORT Data into DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('data successfully imported');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('data successfully deleted');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

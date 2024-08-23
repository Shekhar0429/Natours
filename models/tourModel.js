const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');

// creating scehma
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: String,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty level'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficult should be in : easy, medium or diffcult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      //custom validator
      validate: {
        validator: function (priceDiscountVal) {
          return priceDiscountVal < this.price;
        },
        message: 'Price discount must be less than original price',
      },
    },
    summary: {
      type: String,
      required: [true, 'A tour must have a description'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: String,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array,                               //For embedding models
    guides: [
      // For refrencing models
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }, //to allow send virtuals in response
  },
);

// tourSchema.index({price:1});
// indexing
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('weeksDuration').get(function () {
  //fields to in response output
  return Math.floor(this.duration / 7);
});

// virtual populates
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//document pre middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//document post middleware
tourSchema.post('save', function (doc, next) {
  //console.log(doc);
  next();
});

//query pre middleware. run before all queries using find
tourSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  this.find({ secretTour: { $ne: true } });
  next();
});

//pre hook to embed the user model into tours
// tourSchema.pre('save', async function (next) {
//   const guidePromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidePromises);
//   next();
// });

// pre query hook to populate ref data in output
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-_v -passwordChangedAt',
  });
  next();
});

//query post middleware.
tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} ms`);
  next();
  // console.log(docs)     gives docs returned by query
});

//aggregation middleware.
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

// creating model
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

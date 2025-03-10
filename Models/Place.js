let mongoose = require('mongoose');

let PlaceSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Fixed typo here
    title: String,
    address: String,
    photos: [String],
    description: String,
    perks: [String],
    extraInfo: String,
    checkIn: Number,
    checkOut: Number,
    maxGuests: Number,
    price:Number,
});

let PlaceModel = mongoose.model('Place', PlaceSchema);

module.exports = PlaceModel;

const mongoose = require('mongoose');

let webshopItem = new mongoose.Schema({
    title: {type:String, required:true},
    description: {type:String, required:true}
}, {collection:'webshop-item'});

mongoose.model('webshop-item', webshopItem);

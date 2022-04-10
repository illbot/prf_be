const mongoose = require('mongoose');

let exampleSchema = new mongoose.Schema({
    id: { type: String, unique: true, required:true, lowercase:true},
    value: { type: String, required:true}
}, {collection:'example'});

mongoose.model('example', exampleSchema);

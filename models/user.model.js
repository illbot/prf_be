const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let userSchema = new mongoose.Schema({
    email: { type: String, unique: true, required:true},
    password: {type: String, required: true},
    accessLevel: {type:String}
}, {collection:'user'});

userSchema.pre('save', function(next){
    const user = this;
    if(user.isModified('password')) {
        bcrypt.genSalt(10, function(err,salt){
            if(err) {
                console.log('hiba salt');
                return next(err);
            }
            bcrypt.hash(user.password, salt, function(error,hash){
                if(error){
                    console.log('Hiba hashalés')
                    return next(error)
                }
                user.password = hash;
                return next();
            })
        })

    } else {
        return next();
    }
});

userSchema.methods.comparePasswords = function (password, nx) {
    bcrypt.compare(password, this.password, function (err, isMatch) {
        nx(err, isMatch);
    }); // hasheli a kapott jelszót is és csak a hasheket hasonlítja össze
}; // minden létrehozott és lekérdezett objektum a users kollekcióból rendelkezni fog ezzel a beépített metódussal


mongoose.model('user', userSchema);

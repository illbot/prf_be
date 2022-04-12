const req = require('express/lib/request');
const res = require('express/lib/response');
const { send } = require('express/lib/response');
const { default: mongoose } = require('mongoose');
const passport = require('passport')
const router = require('express').Router();

const exampleModel = mongoose.model('example');
const userModel = mongoose.model('user');
const webshopModel = mongoose.model('webshop-item');

router.route('/login').post((req, res, next) => {
    if (req.body.username && req.body.password) {
        //meghívom a passport local stratégiáját és paraméterként átadom neki a req,res objektumokat
        passport.authenticate('local', function (error, user) {
            console.log('login eredménye:',user)
            if (error) return res.status(500).send(error);
            // ezzel léptetem bele a sessionbe a felhasználót, a user objektumot utána mindig el tudom majd érni
            // req.user néven
            req.login(user, function (error) {
                if (error) return res.status(500).send(error);
                return res.status(200).send(req.session.passport);
            })
        })(req, res, next);
    } else { return res.status(400).send({message: 'Hibas keres, username es password kell'}); }
});

router.route('/logout').post((req, res, next) => {
    console.log('user:', req.user)
    // ha volt sikeres login és sikerült sessionbe léptetni a usert, akkor a session megszüntetéséig
    // vagyis logoutig ez az isAuthenticated() mindig true lesz majd
    if (req.isAuthenticated()) {
        
        req.logout(); // megszünteti a sessiont
        return res.status(200).send('Kijelentkezes sikeres');
    } else {
        return res.status(403).send('Nem is volt bejelentkezve');
    }
})

router.route("/status").get((req,res)=>{
    if(req.isAuthenticated()){
       return res.status(200).send(req.session.passport)
    } else {
        return res.status(403).send("Hiba!")
    }
})

router.route("/_test2").get((req,res) => {
    return res.status(200).send("OK");
})

router.route("/example").post((req, res)=>{
    if(req.body.id && req.body.value){
        exampleModel.findOne({id: req.body.id}, (err, example) => {
            if(err) {
                console.log(err)
                return res.status(500).send('DB hiba');
            }
            if(example){
                return res.status(400).send('Mar van ilyen id');
            } else {
                const example = new exampleModel({id: req.body.id, value: req.body.value});
                example.save((error)=>{
                    if(error) return res.status(500).send('Hiba a mentes folyaman');
                    return res.status(200).send('Sikeres mentes')
                })
            }
        })
    } else {
        return res.status(400).send({message: 'Nem volt id vagy value'})
    }
})

router.route("/authTest").get((req, res)=>{
    if(req.isAuthenticated()){
        return res.status(200).send("Sikeres")
    } else {
        return res.status(401).send("Sikertelen")
    }
})

router.route("/user").post((req,res,next)=>{
    if(req.body.email && req.body.password){
        userModel.findOne({email: req.body.email}, (err, userObj)=>{
            if(err) return res.status(500).send({message: "DB hiba"});
            if(userObj) return res.status(400).send({message: "Mar van ilyen email címmel felhasználó"});

            const user = new userModel({
                email: req.body.email,
                password: req.body.password,
                accessLevel: 'basic'
            });

            user.save((error)=>{
                console.log(error)
                if(error) return res.status(500).send({message:"Hiba a mentés során"})
                return res.status(200).send({message:"Sikeres regisztráció"})
            })
        })
    } else {
        return res.status(400).send({message: "Nem volt email, vagy password"})
    }
}).put((req,res,next)=>{
    if(req.body.email && req.body.password){
        userModel.findOne({email: req.body.email}, (error,user)=>{
            if(error) return res.status(500).send({message:"Hiba mentes kozben"});

            user.password = req.body.password;
            user.save((err)=>{
                console.log(error)
                if(error) return res.status(500).send({message:"Hiba a mentés során"})
                return res.status(200).send({message: "Sikeres jelszo valtoztatas"})
            })
        },)
    } else {
        return res.status(400).send({message: "Nem volt email, vagy password"})
    }
}).get((req,res,next)=>{
    userModel.find({}, (err,users)=>{
        if(err) return res.status(500).send({message:"DB hiba"})
        return res.status(200).send({users: users})
    })
})

router.route('/webshopItem').get((req,res)=>{
    webshopModel.find({}, (err,webshopItem)=>{
        if(err) return res.status(500).send({message: "DB hiba"});
        return res.status(200).send({webshopItems: webshopItem})
    })
}).post((req,res) =>{
    //Kell még Auhtorizacio, ha majd működik frontenden a HttpInterceptor
    if(req.body.title && req.body.description){
        const webshopItem = new webshopModel({
            title: req.body.title,
            description: req.body.description,
        });

        webshopItem.save((error)=>{
            console.log(error)
            if(error) return res.status(500).send({message:"Hiba a mentés során"})
            return res.status(200).send({message:"Sikeresen hozzá lett adva az elem"})
        })
    } else {
        return res.status(400).send({message: "Hianszik a title, vagy a description"})
    }

}).put((req, res)=>{
    //Auth kell még
    if(req.body.id && req.body.title && req.body.description){
        webshopModel.findById(req.body.id, (err, webshopItem)=>{
            if(err) return res.status(500).send({message:"DB hiba"})
            if(!webshopItem) return res.status(404).send({message: "Nincs ilyen item"})

            webshopItem.title = req.body.title;
            webshopItem.description = req.body.description;
            webshopItem.save((error)=>{
                if(error) return res.status(500).send({message:"Hiba a mentés során"})
                return res.status(200).send({message:"Sikeres mentés"})
            })
        })
    }

})

router.route('/webshopItem/:id').delete((req,res)=>{
    
    if(req.params.id){
        webshopModel.deleteOne({_id: req.params.id}, (err)=>{
            if(err) return res.status(500).send({message: "Hiba a torles soran"})
            return res.status(200).send({message: "Sikeres törlés!"})
        })
    } else {
        return res.status(400).send({message: "Hianyzik az id"})
    }
    
})

module.exports = router;
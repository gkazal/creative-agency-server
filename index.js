const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const fs = require('fs-extra')
const fileUpload = require('express-fileupload')
const MongoClient = require('mongodb').MongoClient;

require('dotenv').config()

console.log(process.env.DB_PASS)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uhlcz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express()




app.use(bodyParser.json())
app.use(cors())
app.use(express.static('serviceImage'))
app.use(fileUpload())

const port = 4000


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const serviceCollection = client.db("creative-agency").collection("services");
    console.log('connected...')

    app.post('/addBookingService', (req, res) => {
        const newBookingService = req.body

        serviceCollection.insertOne(newBookingService)
            .then(result => {
                console.log(result)
                res.send(result.insertedCount > 0)
            })

        console.log(newBookingService)
    })

    app.get('/bookingService', (req, res) => {
        serviceCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.send(documents)
            })

    })
    app.get('/showServiceList', (req, res) => {
        // addmin hole email diye verify korbo na..but client hole korbo.
        const adminCollection = client.db("creative-agency").collection("admin");
        const email = req.query.email
        let filter;

        adminCollection.find({ email: email })
            .toArray((err, admins) => {
                console.log('error', err)
                console.log('admin', admins)
                //admin na hole..email diye show korbo
                if (admins.length === 0) {
                    filter = { email: email }
                }
                console.log('filter',filter)
                // jodi admin hoi

                if (!filter) {
                    console.log('admin..', filter)
                    serviceCollection.find({})
                        .toArray((err, documents) => {
                            res.send(documents)
                        })
                }
                else{
                    console.log('user..', filter)
        
                    res.send('no data found..')
                }

            })
        
        console.log(filter)



    })

});

client.connect(err => {
    const reviewCollection = client.db("creative-agency").collection("review");
    app.post('/addReview', (req, res) => {
        const newReviewService = req.body

        reviewCollection.insertOne(newReviewService)
            .then(result => {
                console.log(result)
                res.send(result.insertedCount > 0)
            })

        console.log(newReviewService)
    })
    app.get('/reviewInfo', (req, res) => {
        reviewCollection.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })

    })

});

client.connect(err => {
    const mainService = client.db("creative-agency").collection("ourService");
    app.post('/addService', (req, res) => {

        const file = req.files.file
        const title = req.body.title
        const description = req.body.description

        console.log(file, title, description)
        const filePath = `${__dirname}/serviceImage/${file.name}`

        file.mv(filePath, err => {
            if (err) {
                console.log(err)
                res.status(500).send({ msg: 'failed to upload image' })
            }

            const newImg = fs.readFileSync(filePath)
            const encImg = newImg.toString('base64')

            var image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer(encImg, 'base64')
            }

            mainService.insertOne({ title, description, image })
                .then(result => {
                    fs.remove(filePath, error => {
                        if (error) {
                            console.log(error)
                            res.status(500).send({ msg: 'failed to upload image' })
                        }
                        res.send(result.insertedCount > 0)

                    })
                })
        })

    })
    app.get('/service', (req, res) => {
        mainService.find({})
            .toArray((err, documents) => {
                res.send(documents)
            })

    })

});

client.connect(err => {
    const adminCollection = client.db("creative-agency").collection("admin");
    app.post('/addAdmin', (req, res) => {
        const newAdminService = req.body

        adminCollection.insertOne(newAdminService)
            .then(result => {
                console.log(result)
                res.send(result.insertedCount > 0)
            })
    })

    app.get('/admins', (req, res) => {

        adminCollection.find({ email: req.query.email })
            .toArray((err, documents) => {
                res.send(documents.length > 0)
            })
    })


    // isadmin 0 thke boro hole dekhabo..
    app.post('/isAdmin', (req, res) => {

        adminCollection.find({ email: req.body.email })
            .toArray((err, admins) => {
                res.send(admins.length > 0)
            })
    })

});



app.get('/', (req, res) => {
    res.send('Its working yahaa')
})


app.listen(process.env.PORT || port);



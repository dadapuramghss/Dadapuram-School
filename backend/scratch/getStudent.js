require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const Student = require('../models/Student');
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI).then(async () => {
    const s = await Student.findOne({'terms.0': {$exists: true}});
    console.log(JSON.stringify(s, null, 2));
    process.exit(0);
});

require('dotenv').config()
const express = require('express')
const PORT = process.env.PORT || 5000
const mongoose = require('mongoose')
const CronJob = require('cron').CronJob
const {getCountryNameBySnapshot, fetchData} = require ('./helpers')

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })

const countrySchema = mongoose.Schema({
  name: { type: String, unique: true },
  code: { type: String, unique: true },
  snapshots: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Snapshot' }]
})

const snapshotSchema = mongoose.Schema({
  timestamp: Date,
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  cases: Number,
  todayCases: Number,
  deaths: Number,
  todayDeaths: Number,
  recovered: Number,
  active: Number,
  critical: Number
})

const Country = mongoose.model('Country', countrySchema)
const Snapshot = mongoose.model('Snapshot', snapshotSchema)
new CronJob('0 0 * * * *', fetchDataAndUpdateDb).start()

express()
  .get('/country/:code', async (req, res) => {
    const code = req.params.code.toUpperCase()
    const country = await Country.findOne({code},{_id:0,__v:0}).populate('snapshots','deaths timestamp cases todayCases todayDeaths recovered active critical -_id')
    res.json(country)
  })
  .listen(PORT, () => console.log(`Listening on ${PORT}`))

async function fetchDataAndUpdateDb() {
  const currentData = await fetchData()
  const timestamp = new Date()
  for (const snapshotItem of currentData) {
    const countryName = getCountryNameBySnapshot(snapshotItem)
    const snapshot = new Snapshot({
      ...snapshotItem,
      timestamp
    })
    try {
      const country = await Country.findOneAndUpdate({name: countryName}, {$push: {snapshots: snapshot._id}},{useFindAndModify: false})
      if (!country) {
        console.info('no country for',countryName)
        continue
      }
      snapshot.country = country._id
      await snapshot.save()
    } catch (e) {
      delete snapshot.country
      console.error(e)
    }
  }
}
const express = require('express');
const process = require('process')
const osu = require('node-os-utils')
const fs = require('fs')
const csv = require('csv-parser')
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const app = express();
let cpu = osu.cpu
let mem = osu.mem
usages = []
const csvWriter = createCsvWriter({
  path: 'stats.csv',
  header: [
      {id: 'time', title: 'timestamp'},
      {id: 'cpuUsage', title: 'cpu'},
      {id: 'memUsage', title: 'mem'}
  ]
});
//generate prime numbers
app.get('/prime/:from/:to',(req,res) => {
  let to = Number(req.params.to)
  let from = Number(req.params.from)
  out = ""

  writePrime(from,to)
  res.send('file generated')
})
//monitor
app.get('/monitor/:k', (req,res) => {
 // res.json(usages)
  results = []
  let k = Number(req.params.k)
  fs.createReadStream('stats.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
   res.send(results.slice(0,k))
  });
  clearInterval()
})
//get
app.get('/get', (req,res)=>{
  const readStream = fs.createReadStream('data.txt', 'utf8')
  readStream.on('data', (chunk) =>{
    res.send(chunk)
  })
})
const isPrime = (num) => {
  for (let i = 2; i <= num / 2; i++){
    if(num % i == 0){
      return false;
    }
  }
  return true;
}

async function writePrime(from,to) {
  let fileStream = fs.createWriteStream('data.txt')
  for (let i = from; i <= to; i++){
    if(isPrime(i)){
      const over = fileStream.write(`${i}\n`)
      if(!over){
        await new Promise((resolve) => {
          fileStream.once('drain', resolve)
        })
      }
    }
  }
}

const monitorUsage = () => {
  tempUsage = {
    time: 0,
    cpuUsage: 0,
    memUsage: 0
  }
  tempUsage.time = getDateTime()
  cpu.usage().then(cpuPercentage =>{
    tempUsage.cpuUsage = Math.round(cpuPercentage)
  })
  mem.info().then(memPercentage =>{
    let memUse = (memPercentage.usedMemMb/memPercentage.totalMemMb) * 100
    tempUsage.memUsage = Math.round(memUse)
  })
  usages.push(tempUsage)
  csvWriter.writeRecords(usages)       // returns a promise
    .then(() => {
        //console.log('Stats Done');
    })
}

const getDateTime = () => {
  date = new Date()
  out_date = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
  return out_date
}

setInterval(monitorUsage, 60000)


app.listen(3000)

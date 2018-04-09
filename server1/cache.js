const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const crypto = require('crypto')


function get (key) {
  const fileName = path.resolve("/tmp", key.replace(/[^a-z0-9]/ig,"-"))
  console.log(fileName)
  var hashedName = crypto.createHash('sha256').update(fileName, 'utf8').digest('hex')
  return fs.readFileAsync(hashedName, 'utf8')
  .catch(error=>{
    console.log('cache miss ' + key + ' not found')
    return null
  })
  .then(rawData=>{
    return JSON.parse(rawData)
  })
}
function set (key, value) {
  const fileName = path.resolve("/tmp", key.replace(/[^a-z0-9]/ig, "-"))
  var hashedName = crypto.createHash('sha256').update(fileName, 'utf8').digest('hex')
  console.log(hashedName)
  return fs.writeFileAsync(hashedName, JSON.stringify(value))
}


module.exports = {get, set}
const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')


function get (key) {
  const fileName = path.resolve("/tmp", key.replace(/[^a-z0-9]/ig,"-"))
  console.log(fileName)
  return fs.readFileAsync(fileName, 'utf8')
  .catch(error=>{
    console.log(error)
    return null
  })
  .then(rawData=>{
    return JSON.parse(rawData)
  })
}
function set (key, value) {
  const fileName = path.resolve("/tmp", key.replace(/[^a-z0-9]/ig, "-"))
  console.log(fileName)
  return fs.writeFileAsync(fileName, JSON.stringify(value))
}

module.exports = {get, set}
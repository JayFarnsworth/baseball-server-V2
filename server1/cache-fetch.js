const cache = require('./cache.js');
const fetch = require('node-fetch');


function getJSON(url, options={}, index = 2000) {
  console.log('cache fetch', url)
  return Promise.resolve()
    .then(()=>{
      return cache.get(url)
      .then(data=>{
        if (data){
          return data
        } 
        return delay(index * currentDelay)
        .then(()=>{
          return fetch(url, options)
            .then(request => request.json())
            .then(data=>{
              cache.set(url, data)
              return data
            })
        })
      })
    })
}
module.exports = getJSON;
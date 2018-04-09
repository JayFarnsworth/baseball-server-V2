const cache = require('./cache.js');
const fetch = require('node-fetch');


function getJSON(url, options={}, msec=2000) {
  console.log('cache fetch', url)
  return Promise.resolve()
    .then(()=>{
      return cache.get(url)
      .then(data=>{
        if (data){
          return data
        } 
        return delay(msec)
        .then(()=>{
          return fetch(url, options)
            .then(request => request.json())
            .then(data=>{
              cache.set(url, data)
              console.log(data)
              return data
            })
        })
      })
    })
}

function delay(msec) {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  })
}

module.exports = getJSON;
const test = require('tape')
const batters = require('./mongoBaseball.js')
let userId = null

test('can create batter', t => {
  t.plan(1);
  batters.createBatter({ID: '11111', info: {HR: 1}})
  .then(result=>{
    t.equal(result.id, '11111')
  })
  .catch(err => { t.fail(err) })
})

test('can update batter stats', t => {
  t.plan(1)
  batters.addBatterStats('11111', { 2017: {} })
    .then(result => {
      console.log(result)
      t.equals(result.stats, { 2017: {}})
    })
    .catch(err => { t.fail(err) })
})


// test('can find user', t => {
//   t.plan(2);
//   batters.findBatter('Jay')
//   .then(result=>{
//     t.equal(result[0].name, "Jay")
//     t.ok(result.length > 0)
//   })
//   // .catch(err => { t.fail(err)})
// })

// test('can update user', t => {
//   t.plan(1)
//   batters.update(userId, {name: 'Jay'})
//     .then(result => {
//       console.log(result)
//       t.equals(result.nModified, 1)
//     })
//     .catch(err => { t.fail(err) })
// })

// test('can remove user', t => {
//   t.plan(1)
//   batters.remove(userId)
//   .then(result => {
//     t.equals(result.result.n, 1)
//   })
//   .catch(err => {t.fail(err)})
// })

test('can close db', t => {
  batters.__db.close()
  t.pass('closed db')
  t.end()
})
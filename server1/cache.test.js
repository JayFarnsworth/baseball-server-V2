var test = require('tape');
var cache = require('./cache');

test('can set cache', function (t) {
  t.plan(1);
  cache.set('test', {test: 'test'})
  .then(()=>{
    t.pass()
  })
  .catch(error=>{t.fail(error)})
});

test('can get cache', function (t) {
  t.plan(2);
  cache.get('test')
    .then((data) => {
      console.log(data)
      t.ok(data)
      t.ok(data.test)
    })
    .catch(error => { t.fail(error) })
});
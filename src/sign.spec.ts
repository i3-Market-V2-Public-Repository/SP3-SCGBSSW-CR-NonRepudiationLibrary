// variable _pkg cannot be changed and chai should be removed (and loaded in the browser).
// Please, do NOT touch the following 2 requires!
import * as _pkg from '~root'
import * as chai from 'chai'

describe('testing function sign(\'hello\')', function () {
  const regex = /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
  it(`should return a JWS string matching ${regex.toString()}`, async function () {
    const ret = await _pkg.sign('hello')
    chai.expect(ret).to.match(regex)
  })
})
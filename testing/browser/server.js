'use strict'

const fs = require('fs')
const http = require('http')
const path = require('path')
const pkgJson = require('../../package.json')

const rollup = require('rollup')
const resolve = require('@rollup/plugin-node-resolve').nodeResolve
const replace = require('@rollup/plugin-replace')
const multi = require('@rollup/plugin-multi-entry')
const typescript = require('@rollup/plugin-typescript')
const commonjs = require('@rollup/plugin-commonjs')

const rootDir = path.join(__dirname, '..', '..')

const indexHtml = `<!DOCTYPE html>
  <html>
  <head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8" />
    <title>${pkgJson.name}</title>
    <script src="/mocha.js"></script>
    <script src="/chai.js"></script>
  </head>

  <body>

  </body>
    <div id="mocha"></div>
    <script>
      mocha.setup({
        ui: 'bdd',
        reporter: 'spec',
        color: 'true',
        timeout: 90000
      })
    </script>
    <script type="module">
      import * as _pkg from '/index.browser.bundle.mod.js'
      self._pkg = _pkg
      import './tests.js'
      window._mocha = mocha.run()
    </script>
  </html>`

async function buildTests () {
  // create a bundle
  const inputOptions = {
    // external: [
    //   'chai',
    //   path.join(rootDir, pkgJson.browser)
    // ],
    input: [path.join(rootDir, pkgJson.directories.test, '**/*.{js,ts}'), path.join(rootDir, pkgJson.directories.src, '**/*.spec.{js,ts}')],
    plugins: [
      multi({ exports: true }),
      replace({
        'const _pkg = require(\'~root\')': '',
        'import * as _pkg from \'~root\'': '',
        'const chai = require(\'chai\')': '',
        'import * as chai from \'chai\'': '',
        delimiters: ['', ''],
        IS_BROWSER: true
      }),
      typescript(),
      resolve({
        browser: true,
        exportConditions: ['browser', 'module', 'import', 'default']
      }),
      commonjs()
    ]
  }
  const bundle = await rollup.rollup(inputOptions)
  const { output } = await bundle.generate({ format: 'esm' })
  await bundle.close()
  return output[0].code
}

class TestServer {
  constructor () {
    this.server = http.createServer()
  }

  async init () {
    const tests = await buildTests()
    this.server.on('request', function (req, res) {
      if (req.url === '/index.browser.bundle.mod.js') {
        fs.readFile(path.join(rootDir, 'dist', 'index.browser.bundle.mod.js'), function (err, data) {
          if (err) {
            res.writeHead(404)
            res.end(JSON.stringify(err))
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/javascript' })
          res.end(data)
        })
      } else if (req.url === '/index.html' || req.url === '/') {
        res.writeHead(200)
        res.end(indexHtml)
      } else if (req.url === '/tests.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' })
        res.end(tests)
      } else if (req.url === '/mocha.js') {
        fs.readFile(path.join(rootDir, 'node_modules/mocha/mocha.js'), function (err, data) {
          if (err) {
            res.writeHead(404)
            res.end(JSON.stringify(err))
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/javascript' })
          res.end(data)
        })
      } else if (req.url === '/chai.js' || req.url === '/chai') {
        fs.readFile(path.join(rootDir, 'node_modules/chai/chai.js'), function (err, data) {
          if (err) {
            res.writeHead(404)
            res.end(JSON.stringify(err))
            return
          }
          res.writeHead(200, { 'Content-Type': 'text/javascript' })
          res.end(data)
        })
      } else {
        res.writeHead(404)
        res.end()
      }
    })
  }

  listen (port = 38080) {
    return new Promise((resolve, reject) => {
      this.server.listen(port, error => {
        if (error) return reject(error)
        console.log(`Testing server listenning at http://localhost:${port}`)
        return resolve()
      })
    })
  }

  close () {
    return new Promise((resolve, reject) => {
      this.server.close(error => (error) ? reject(error) : resolve())
    })
  }
}

exports.server = new TestServer()

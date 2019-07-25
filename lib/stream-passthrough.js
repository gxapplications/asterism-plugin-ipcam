'use strict'

import request from 'request'
import requestPromise from 'request-promise'
import { Transform } from 'stream'

import { models } from './camera-models'
import { fixUrl, snapshotUrl, commandUrl } from './utils'

const middleware = (context, router) => {
  const logger = context.logger

  const streamErrorTransform = new Transform({
    transform(chunk, enc, cb) {
      const err = new Error('Error getting stream')
      err.stack = chunk.toString('utf8')
      console.error(err)
      cb(err)
    }
  })
  const getStream = (requestOptions, callback) => {
    const stream = request(requestOptions)
    return stream
    .on('error', err => callback(err))
    .on('response', response => {
      if (response.statusCode !== 200) {
        return stream.pipe(streamErrorTransform)
        .on('error', err => callback(err)) // TODO !0: if password wrong on dome camera, crashes node !
      }
      return callback(null, stream)
    })
  }

  router.post('/ptz-cmd/:cameraId', (req, res) => {
    context.dataHandler.getItem('cameras')
    .then(cameras => cameras.find((item) => item.id === req.params.cameraId))
    .then(camera => {
      if (!camera) {
        logger.warn(`Camera ID ${req.params.cameraId} not found!`)
        return res.sendStatus(404)
      }

      const model = models.find((model) => model.id === camera.model)
      if (!model) {
        logger.warn(`Camera ID ${req.params.cameraId} found, but its model ${camera.model} is unknown!`)
        return res.sendStatus(404)
      }

      const { command, parameter } = req.body
      let url = commandUrl(camera.url, command, camera.login, camera.password, model)
      if (!url) {
        logger.warn(`Camera model ${camera.model} does not support the ${command} command!`)
        return res.sendStatus(404)
      }

      if (typeof parameter === 'string' || typeof parameter === 'number') {
        url = url.replace('%1', parameter)
      }

      const headers = model.authentication === 'basic' ? {
        'Authorization': 'Basic ' + new Buffer(camera.login + ":" + camera.password).toString('base64')
      } : {}
      requestPromise({ url, headers, method: 'GET' })
      .then((result) => {
        logger.log(`Camera command send successfully: #${req.params.cameraId} (${camera.model}) for command '${command}' receives '${result}'`)
        return res.json(result)
      })
      .catch((error) => {
        console.log(error)
        logger.warn(`Camera command got error: #${req.params.cameraId} (${camera.model}) for command '${command}' receives '${error.toString()}'`)
        return res.sendStatus(500)
      })
    })
  })

  router.get('/main-stream/:cameraId', (req, res) => {
    context.dataHandler.getItem('cameras')
    .then(cameras => cameras.find((item) => item.id === req.params.cameraId))
    .then(camera => {
      if (!camera) {
        logger.warn(`Camera ID ${req.params.cameraId} not found!`)
        return res.sendStatus(404)
      }

      const model = models.find((model) => model.id === camera.model)
      if (!model) {
        logger.warn(`Camera ID ${req.params.cameraId} found, but its model ${camera.model} is unknown!`)
        return res.sendStatus(404)
      }

      const url = fixUrl(camera.url, camera.login, camera.password, model)
      const headers = model.authentication === 'basic' ? {
        'Authorization': 'Basic ' + new Buffer(camera.login + ":" + camera.password).toString('base64')
      } : {}

      getStream({ url, headers, method: 'GET' }, (error, stream) => {
        if (error && !res.headerSent) {
          logger.warn(`Camera stream failed: #${req.params.cameraId} (${camera.model}) receives '${error.toString()}'`)
          return res.sendStatus(500)
        }
        stream.pipe(res)
      })
    })
  })

  router.get('/snapshot-stream/:cameraId', (req, res) => {
    context.dataHandler.getItem('cameras')
    .then(cameras => cameras.find((item) => item.id === req.params.cameraId))
    .then(camera => {
      if (!camera) {
        logger.warn(`Camera ID ${req.params.cameraId} not found!`)
        return res.sendStatus(404)
      }

      const model = models.find((model) => model.id === camera.model)
      if (!model) {
        logger.warn(`Camera ID ${req.params.cameraId} found, but its model ${camera.model} is unknown!`)
        return res.sendStatus(404)
      }

      const url = snapshotUrl(camera.url, camera.login, camera.password, model)
      const headers = model.authentication === 'basic' ? {
        'Authorization': 'Basic ' + new Buffer(camera.login + ":" + camera.password).toString('base64')
      } : {}

      getStream({ url, headers, method: 'GET' }, (error, stream) => {
        if (error && !res.headerSent) {
          logger.warn(`Camera stream failed: #${req.params.cameraId} (${camera.model}) receives '${error.toString()}'`)
          return res.sendStatus(500)
        }
        stream.pipe(res)
      })
    })
  })

  return router
}

export default middleware

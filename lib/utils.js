'use strict'

import UrlParser from 'url'

const fixUrl = (url, login, password, model) => {
  const parsedUrl = UrlParser.parse(url.replace(/^(?!https?:\/\/)/, 'http://'), true)
  parsedUrl.query = parsedUrl.query || {}
  if (login && password && model.authentication === 'queryString') {
    //parsedUrl.auth = `${login}:${password}` this is deprecated in Chrome!
    parsedUrl.query.user = login
    parsedUrl.query.pwd = password
  }
  parsedUrl.query._t = Date.now()
  parsedUrl.search = null
  return UrlParser.format(parsedUrl)
}

const snapshotUrl = (url, login, password, model) => {
  if (!model.urlSnapshot) {
    return null
  }
  const sUrl = fixUrl(UrlParser.resolve(url, model.urlSnapshot), login, password, model)
  const parsedUrl = UrlParser.parse(sUrl, true)
  parsedUrl.query = parsedUrl.query || {}
  parsedUrl.query._t = Date.now() // force _t to be updated again
  parsedUrl.search = null
  return UrlParser.format(parsedUrl)
}

const commandUrl = (url, command, login, password, model) => {
  if (!model.controls[command]) {
    return null
  }
  return fixUrl(UrlParser.resolve(url, model.controls[command]), login, password, model)
}

export { fixUrl, snapshotUrl, commandUrl }

'use strict'

import { Item } from 'asterism-plugin-library'
import cx from 'classnames'
import React from 'react'
import { Button, Icon, Modal } from 'react-materialize'
import UrlParser from 'url'

import Controls from '../controls'
import { models } from '../camera-models'
import styles from '../styles.scss'
import { fixUrl, snapshotUrl } from '../utils'

class MotionJpegPtzItem extends Item {
  constructor (props) {
    super(props)
    this.state = { ...this.state,
      url: null,
      login: null,
      password: null,
      elementInvalid: true,
      snapshotUrl: null,
      slowUrl: null,
      cameraName: null,
      model: null
    }
  }

  componentDidMount () {
    this.fetchData()
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.params.camera !== this.state.params.camera) {
      this.fetchData()
    }
  }

  componentWillUnmount () {
    clearInterval(this._refreshTimer)
  }

  render () {
    const { mainState, theme, serverStorage } = this.props.context
    const { animationLevel } = mainState()
    const { title = null, displaySample = false, camera } = this.state.params
    const { url = '', login = '', password = '', elementInvalid, snapshotUrl, slowUrl, cameraName, model } = this.state

    // TODO !1: try to support audio flux... on all cameras that have the audio flag

    if (elementInvalid || !url) {
      return (
        <div className={cx('grey lighten-2 fluid', styles.ipCamCentered)}>
          <Icon medium>videocam_off</Icon>
        </div>
      )
    }

    const waves = animationLevel >= 2 ? 'light' : null
    const controllable = !!model.controls
    const fullUrl = fixUrl(url, login, password, model)

    const clickableItem = displaySample ? (
      <Button waves={waves} className={cx(styles.ipCam, 'truncate fluid', theme.backgrounds.card)}>
        {fullUrl ? (
          <object type='image/jpeg' data={slowUrl || snapshotUrl || fullUrl}>
            <div className='error red-text truncate'>
              Failure
            </div>
          </object>
        ) : null}
        {title ? (
          <div className='overlay truncate'>
            {title}
          </div>
        ) : null}
      </Button>
    ) : (
      <Button waves={waves} className={cx(styles.ipCam, 'truncate fluid', theme.backgrounds.card)}>
        {title || cameraName}
      </Button>
    )

    return (
      <Modal header={title || cameraName}
        modalOptions={{
          inDuration: animationLevel >= 2 ? 300 : 0,
          outDuration: animationLevel >= 2 ? 300 : 0,
          ready: (modal) => {
            modal.addClass(styles.ipCamModal)
            modal.addClass(theme.backgrounds.card)
            $('.fullUrl', modal).attr('data', fullUrl)
          },
          complete: () => {
            $('.ipCamModal .fullUrl').attr('data', '')
          }
        }}
        trigger={clickableItem}>
        {fullUrl ? (
          <div>
            <object className='fullUrl' type='image/jpeg' data=''>
              <div className='error red-text truncate'>
                Failure
              </div>
            </object>
            {controllable ? (
              <Controls animationLevel={animationLevel} theme={theme} model={model} serverStorage={serverStorage}
                baseUrl={url} login={login} password={password} cameraId={camera} />
            ) : null}
          </div>
        ) : null}
      </Modal>
    )
  }

  fetchData () {
    const camera = this.state.params.camera
    return this.props.context.serverStorage.getItem('cameras')
    .then((elements) => {
      const element = elements.find((el) => el.id === camera)
      const model = models.find((el) => el.id === element.model) || models[0]
      let slowUrl = fixUrl(UrlParser.resolve(element.url, model.urlSlow), element.login, element.password, model)
      let snapUrl = snapshotUrl(element.url, element.login, element.password, model)
      if (model.authentication === 'basic' && element.login && element.password) {
        const location = window.document.location
        this.baseUrl = `${location.protocol}//${location.host}`
        // FIXME: maybe useful to to url and slowUrl too...
        snapUrl = `${this.baseUrl}/asterism-plugin-ipcam/snapshot-stream/${camera}`
      }
      this.setState({
        url: element.url,
        login: element.login,
        password: element.password,
        elementInvalid: false,
        snapshotUrl: snapUrl,
        slowUrl,
        cameraName: element.name,
        model
      })

      // If no slow URL, then use snapshot URL with a refresh
      if (!slowUrl && snapUrl) {
        clearInterval(this._refreshTimer)
        this._refreshTimer = setInterval(() => {
          snapUrl = snapshotUrl(element.url, element.login, element.password, model)
          this.setState({ snapshotUrl: snapUrl })
        }, 10000)
      }
    })
    .catch((error) => {
      console.error(error)
      clearInterval(this._refreshTimer)
      this.setState({ elementInvalid: true })
    })
  }
}

export default MotionJpegPtzItem

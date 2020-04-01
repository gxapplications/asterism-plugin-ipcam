'use strict'

import { Item } from 'asterism-plugin-library'
import cx from 'classnames'
import React from 'react'
import { Button, Icon, Modal } from 'react-materialize'

import Controls from '../controls'
import { models } from '../camera-models'
import styles from '../styles.scss'
import { fixUrl, snapshotUrl } from '../utils'

class SnapshotsPtzItem extends Item {
  constructor (props) {
    super(props)
    this.state = { ...this.state,
      url: null,
      login: null,
      password: null,
      elementInvalid: true,
      snapshotUrl: null,
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
    clearInterval(this._refreshTimer2)
  }

  render () {
    const { mainState, theme, serverStorage } = this.props.context
    const { animationLevel } = mainState()
    const { title = null, displaySample = 'off', camera } = this.state.params
    const { url = '', login = '', password = '', elementInvalid, snapshotUrl, cameraName, model } = this.state

    if (elementInvalid || !url) {
      return (
        <div className={cx('ipCamCentered grey lighten-2 fluid', styles.ipCamCentered)}>
          <Icon medium>videocam_off</Icon>
        </div>
      )
    }

    const waves = animationLevel >= 2 ? 'light' : null
    const controllable = !!model.controls

    const clickableItem = (displaySample === 'on') ? (
      <Button waves={waves} className={cx(styles.ipCam, 'ipCam truncate fluid', theme.backgrounds.card)}>
        {url ? (
          <object type='image/jpeg' data={snapshotUrl}>
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
      <Button waves={waves} className={cx(styles.ipCam, 'ipCam truncate fluid', theme.backgrounds.card)}>
        {title || cameraName}
      </Button>
    )

    return (
      <Modal header={title || cameraName} className={cx(styles.ipCamModal, 'ipCamModal', theme.backgrounds.card)}
        options={{
          inDuration: animationLevel >= 2 ? 300 : 0,
          outDuration: animationLevel >= 2 ? 300 : 0
        }}
        trigger={clickableItem}>
        {url ? (
          <div>
            <object type='image/jpeg' data={url}>
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
      let fullUrl = fixUrl(element.url, element.login, element.password, model)
      let snapUrl = snapshotUrl(element.url, element.login, element.password, model)
      if (model.authentication === 'basic' && element.login && element.password) {
        const location = window.document.location
        this.baseUrl = `${location.protocol}//${location.host}`
        fullUrl = `${this.baseUrl}/asterism-plugin-ipcam/main-stream/${camera}?_t=${Date.now()}`
        snapUrl = `${this.baseUrl}/asterism-plugin-ipcam/snapshot-stream/${camera}?_t=${Date.now()}`
      }
      this.setState({
        url: fullUrl,
        login: element.login,
        password: element.password,
        elementInvalid: false,
        snapshotUrl: snapUrl,
        cameraName: element.name,
        model
      })

      // Use snapshot URL with a low rate refresh
      if (snapUrl) {
        clearInterval(this._refreshTimer)
        this._refreshTimer = setInterval(() => {
          if (model.authentication === 'basic' && element.login && element.password) {
            const location = window.document.location
            this.baseUrl = `${location.protocol}//${location.host}`
            snapUrl = `${this.baseUrl}/asterism-plugin-ipcam/snapshot-stream/${camera}?_t=${Date.now()}`
          } else {
            snapUrl = snapshotUrl(element.url, element.login, element.password, model)
          }
          this.setState({ snapshotUrl: snapUrl })
        }, 12000)
      }

      // Use main URL with a high rate refresh
      clearInterval(this._refreshTimer2)
      this._refreshTimer2 = setInterval(() => {
        if (model.authentication === 'basic' && element.login && element.password) {
          const location = window.document.location
          this.baseUrl = `${location.protocol}//${location.host}`
          fullUrl = `${this.baseUrl}/asterism-plugin-ipcam/main-stream/${camera}?_t=${Date.now()}`
        } else {
          fullUrl = fixUrl(element.url, element.login, element.password, model)
        }
        this.setState({ url: fullUrl })
      }, 3000)
    })
    .catch((error) => {
      console.error(error)
      clearInterval(this._refreshTimer)
      clearInterval(this._refreshTimer2)
      this.setState({ elementInvalid: true })
    })
  }

  refresh () {
    clearInterval(this._refreshTimer)
    clearInterval(this._refreshTimer2)

    this.fetchData()
  }

  freeze () {
    clearInterval(this._refreshTimer)
    clearInterval(this._refreshTimer2)
  }
}

export default SnapshotsPtzItem

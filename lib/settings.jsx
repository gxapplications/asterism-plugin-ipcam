'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Col, Button, Icon, Input, Preloader, Row } from 'react-materialize'
import UrlParser from 'url'
import uuid from 'uuid'

import { CollectionSetting } from 'asterism-plugin-library'
import { models } from './camera-models'
import styles from '../styles.scss'

class IpCamSettings extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      elements: [],
      currentElement: null,
      currentModel: null,
      deleteConfirmation: false
    }
    this._mounted = false;
  }

  componentDidMount () {
    this._mounted = true;
    $('#ipcam_settings .card-reveal .card-title').on('click', () => {
      this.setState({ currentElement: null })
    })

    this.props.serverStorage.getItem('cameras')
    .then((elements) => {
      if (this._mounted) {
        console.log(`Restoring ${elements.length} items in the IP cam settings collection...`)
        this.setState({ elements })
      }
    })
    .catch((error) => {
      if (error.status === 404 && this._mounted) {
        this.setState({ elements: [] })
      }
    })
  }

  componentWillUnmount () {
    this._mounted = false;
  }

  render () {
    const { theme, animationLevel } = this.props
    const { elements, currentElement, currentModel, deleteConfirmation } = this.state
    const waves = animationLevel >= 2 ? 'light' : undefined

    const list = elements.map((el) => ({
      title: el.name || 'Unnamed',
      icon: 'videocam',
      onClick: this.configureElement.bind(this, el),
      details: ((el.login ? `${el.login} @ ` : '') + el.url) || 'Not configured'
      /* secondary: {
        icon: 'more_vert',
        onClick: () => {},
      } */
    }))

    return (
      <div id='ipcam_settings' className='card'>
        <div className='section left-align scrollable'>
          <h5>IP cameras</h5>
          <p>
            Manage your cameras here.
          </p>

          <CollectionSetting theme={theme} animationLevel={animationLevel}
            list={list} header='Configured cameras'
            addElement={{
              empty: { title: 'Add your first camera', icon: 'video_call' },
              trailing: { title: 'Add a camera' },
              onClick: this.addElement.bind(this)
            }}
          />

        </div>

        <div className={cx('card-reveal', theme.backgrounds.body)}>
          <span className='card-title'>Configure camera<Icon right>close</Icon></span>
          {currentElement ? (
            <div>
              <Row className='padded card'>
                <Input s={12} label='URL' ref={(c) => { this._url = c }} defaultValue={currentElement.url} />
                <Input s={12} m={5} label='Name' ref={(c) => { this._name = c }}
                  defaultValue={currentElement.name} />
                <Input s={12} m={7} type='select' label='Camera model' icon='videocam' onChange={this.modelChanged.bind(this)}
                  defaultValue={currentElement.model} ref={(c) => { this._model = c }}>
                  {models.map((el, idx) => (
                      <option key={idx} value={el.id} selected={el.id === currentElement.model}>{el.brand} - {el.name}</option>
                  ))}
                </Input>
              </Row>
              <Row className='padded card'>
                <div className='card-content col s12'>Auth. (In clear as '&user=xxx&pwd=xxx')</div>
                <Input s={12} m={6} label='User' ref={(c) => { this._login = c }}
                  defaultValue={currentElement.login} />
                <Input s={12} m={6} type='password' label='Password' ref={(c) => { this._password = c }}
                  defaultValue={currentElement.password} />
              </Row>
              <Button waves={waves} className={cx('right', theme.actions.primary)} onClick={this.save.bind(this)}>
                Save
              </Button>
              <Button waves={waves} flat={!deleteConfirmation} onClick={this.remove.bind(this)}
                className={cx('left', { [theme.actions.negative]: deleteConfirmation })}>
                Delete
              </Button>
            </div>
          ) : (
            <Row><Col s={12} className='center-align'><Preloader size='big'/></Col></Row>
          )}
        </div>
      </div>
    )
  }

  addElement () {
    this.setState({ currentModel: null, currentElement: {
      id: uuid.v4(),
      name: '',
      url: '',
      login: '',
      password: '',
      model: ''
    } })
  }

  configureElement (element) {
    this.setState({ currentElement: element, currentModel: models.find((el) => el.id === element.model) })
  }

  modelChanged (event) {
    const model = models.find((el) => el.id === event.currentTarget.value)
    this.setState({ currentModel: model })

    // Fix URL with model suffix
    if (!this._url.state.value) {
      return
    }

    const parsedUrl = UrlParser.parse(this._url.state.value.replace(/^(?!https?:\/\/)/, 'http://'))
    if (model && model.urlSuffix && (!parsedUrl.path || parsedUrl.path === '/')) {
      // FIXME: state will be set correctly, but displayed input is not updated. react-materialize bug?
      this._url.setState({ value: UrlParser.resolve(UrlParser.format(parsedUrl), model.urlSuffix) })
      this.setState({ currentElement: { ...this.state.currentElement, url: UrlParser.resolve(UrlParser.format(parsedUrl), model.urlSuffix) } })
    }
  }

  save () {
    const currentElement = {
      ...this.state.currentElement,
      name: this._name.state.value,
      url: this._url.state.value,
      login: this._login.state.value,
      password: this._password.state.value,
      model: this._model.state.value
    }
    const elements = this.state.elements.filter((el) => (el.id !== currentElement.id))
    elements.push(currentElement)
    elements.sort((a, b) => {
      const nA = a.name.toLowerCase()
      const nB = b.name.toLowerCase()
      if (nA < nB) {
          return -1
      }
      if (nA > nB) {
          return 1
      }
      return 0
    })

    this.props.serverStorage.setItem('cameras', elements)
    .then(() => {
      if (this._mounted) {
        this.setState({ elements, currentElement: null, deleteConfirmation: false })
        $('#ipcam_settings .card-reveal .card-title').click()
      }
    })
    .catch((error) => {
      if (this._mounted) {
        this.setState({ deleteConfirmation: false })
      }
      console.error(error)
    })
  }

  remove () {
    if (!this.state.deleteConfirmation) {
      this._deleteTimer = setTimeout(() => {
        if (this._mounted) {
          this.setState({ deleteConfirmation: false })
        }
      }, 2000)
      return this.setState({ deleteConfirmation: true })
    }

    const id = this.state.currentElement.id
    const elements = this.state.elements.filter((el) => (el.id !== id))

    this.props.serverStorage.setItem('cameras', elements)
    .then(() => {
      if (this._mounted) {
        this.setState({ elements, currentElement: null, deleteConfirmation: false })
        $('#ipcam_settings .card-reveal .card-title').click()
      }
    })
    .catch((error) => {
      if (this._mounted) {
        this.setState({ deleteConfirmation: false })
      }
      console.error(error)
    })
  }
}

IpCamSettings.propTypes = {
  theme: PropTypes.object.isRequired,
  serverStorage: PropTypes.object.isRequired,
  showRefreshButton: PropTypes.func.isRequired,
  animationLevel: PropTypes.number.isRequired
}

IpCamSettings.tabName = 'IP Cameras'

export default IpCamSettings

'use strict'

/* global $ */
import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Col, Button, Icon, TextInput, Preloader, Row, Select } from 'react-materialize'
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
        // console.log(`Restoring ${elements.length} items in the IP cam settings collection...`)
        this.setState({ elements })
      }
    })
    .catch(console.error)
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
        <div className='section left-align'>
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
                <br /><br />
                <TextInput s={12} label='URL' placeholder='Use a full URL' onChange={this.urlChanged.bind(this)} value={currentElement.url} />
                <br />&nbsp;<br />
                <TextInput s={12} label='Name' placeholder='Choose a short name' onChange={this.nameChanged.bind(this)}
                  value={currentElement.name} />
                <br />&nbsp;<br />
                <Select s={12} label='Camera model' icon='videocam' onChange={this.modelChanged.bind(this)}
                  value={currentElement.model}>
                  {models.map((el, idx) => (
                    <option key={idx} value={el.id}>{el.brand} - {el.name}</option>
                  ))}
                </Select>
              </Row>
              <Row className='padded card'>
                <div className='card-content col s12'>Auth. (In clear as '&user=xxx&pwd=xxx')</div>
                <TextInput s={12} m={6} label='User' onChange={this.loginChanged.bind(this)} value={currentElement.login} />
                <TextInput s={12} m={6} password label='Password' onChange={this.passwordChanged.bind(this)} value={currentElement.password} />
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

  urlChanged (event) {
    this.setState({ currentElement: { ...this.state.currentElement, url: event.currentTarget.value } })
  }

  nameChanged (event) {
    this.setState({ currentElement: { ...this.state.currentElement, name: event.currentTarget.value } })
  }

  loginChanged (event) {
    this.setState({ currentElement: { ...this.state.currentElement, login: event.currentTarget.value } })
  }

  passwordChanged (event) {
    this.setState({ currentElement: { ...this.state.currentElement, password: event.currentTarget.value } })
  }

  modelChanged (event) {
    const model = models.find((el) => el.id === event.currentTarget.value)

    this.setState({
      currentModel: model,
      currentElement: {
        ...this.state.currentElement,
        model: event.currentTarget.value
      }
    })

    // Fix URL with model suffix
    if (!this.state.currentElement.url) {
      return
    }
    const parsedUrl = UrlParser.parse(this.state.currentElement.url.replace(/^(?!https?:\/\/)/, 'http://'))
    if (model && model.urlSuffix && (!parsedUrl.path || parsedUrl.path === '/')) {
      this.setState({
        currentElement: {
          ...this.state.currentElement,
          url: UrlParser.resolve(UrlParser.format(parsedUrl), model.urlSuffix)
        }
      })
    }
  }

  save () {
    const elements = this.state.elements.filter((el) => (el.id !== this.state.currentElement.id))
    elements.push(this.state.currentElement)
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
    .catch(console.error)
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

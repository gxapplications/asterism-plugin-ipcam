'use strict'

import cx from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { Button, Icon } from 'react-materialize'
import UrlParser from 'url'

import { fixUrl } from './utils'

class Controls extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      setPreset: false
    }
    this.presetTimer = null
  }

  componentWillUnmount () {
    clearTimeout(this.presetTimer)
  }

  render () {
    const { animationLevel, model } = this.props
    const { setPreset } = this.state
    const waves = animationLevel >= 2 ? 'light' : null
    const controls = model.controls

    return (
      <div className='controls' style={{ visibility: 'hidden' }}>
        <div className='top'>
          <Button waves={waves} flat onClick={this.control.bind(this, 'top', false)}><Icon>keyboard_arrow_up</Icon></Button>
        </div>
        <div className='bottom'>
          <Button waves={waves} flat onClick={this.control.bind(this, 'bottom', false)}><Icon>keyboard_arrow_down</Icon></Button>
        </div>
        <div className='left'>
          <Button waves={waves} flat onClick={this.control.bind(this, 'left', false)}><Icon>keyboard_arrow_left</Icon></Button>
        </div>
        <div className='right'>
          <Button waves={waves} flat onClick={this.control.bind(this, 'right', false)}><Icon>keyboard_arrow_right</Icon></Button>
        </div>

        {(controls.ledOn || controls.ledOff || controls.ledAuto) ? (
          <div className='led'>
            <Icon>lightbulb_outline</Icon>
            {controls.ledOn ? (
              <Button waves={waves} flat onClick={this.control.bind(this, 'ledOn', false)}>ON</Button>
            ) : null}
            {controls.ledOff ? (
              <Button waves={waves} flat onClick={this.control.bind(this, 'ledOff', false)}>OFF</Button>
            ) : null}
            {controls.ledAuto ? (
              <Button waves={waves} flat onClick={this.control.bind(this, 'ledAuto', false)}>AUTO</Button>
            ) : null}
          </div>
        ) : null}

        {(controls.home && controls.gotToPreset) ? (
          <div className='presets hide-on-small-only'>
            <Button waves={waves} flat onClick={this.control.bind(this, 'home', false)}><Icon>home</Icon></Button>
            {controls.stop ? (
              <Button waves={waves} flat onClick={this.control.bind(this, 'stop', false)}><Icon>stop</Icon></Button>
            ) : null}
            {controls.gotToPreset ? [1, 2, 3, 4, 5].map((nbr, idx) => (
              <Button key={idx} waves={waves} flat onClick={this.control.bind(this, 'gotToPreset', idx)}>{nbr}</Button>
            )) : null}
            {controls.setPreset ? (
              <Button className={setPreset ? 'red' : ''} waves={waves} flat onClick={this.control.bind(this, 'setPreset', false)}>SET</Button>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }

  control (command, idx = false) {
    const model = this.props.model
    let control = model.controls[command]
    if (!control) {
        return
    }

    switch (command) {
      case 'setPreset':
        this.setState({ setPreset: true })
        this.presetTimer = setTimeout(() => {
          this.setState({ setPreset: false })
        }, 2000)
        return;
      case 'gotToPreset':
        if (this.state.setPreset) {
          this.setState({ setPreset: false })
          clearTimeout(this.presetTimer)
          command = 'setPreset' // keep it here, used also for basic auth case (POST to server middleware)
          control = model.controls[command].replace('%1', idx)
        } else {
          control = control.replace('%1', idx)
        }
        // fall through
      default:
        if (model.authentication === 'basic') {
          return this.props.serverStorage.fetchJson(
            `/asterism-plugin-ipcam/ptz-cmd/${this.props.cameraId}`,
            { method: 'POST', body: JSON.stringify({ command, parameter: idx }) }
          )
          .catch((error) => {
            console.error(error)
          })
        } else {
          return fetch(fixUrl(UrlParser.resolve(this.props.baseUrl, control), this.props.login, this.props.password, model),
            { method: 'GET', headers: {}, mode: 'no-cors' }
          )
          .catch((error) => {
            console.error(error)
          })
        }
    }
  }
}

Controls.propTypes = {
  theme: PropTypes.object.isRequired,
  animationLevel: PropTypes.number.isRequired,
  model: PropTypes.object.isRequired,
  baseUrl: PropTypes.string.isRequired,
  login: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  cameraId: PropTypes.string.isRequired,
  serverStorage: PropTypes.object.isRequired
}

export default Controls

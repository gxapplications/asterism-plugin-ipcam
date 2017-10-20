'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, Icon, Input, Row } from 'react-materialize'

import { ItemSettingPanel } from 'asterism-plugin-library'
import { models } from '../camera-models'
import MotionJpegPtzItem from './item'

class MotionJpegPtzSettingPanel extends ItemSettingPanel {
  constructor (props) {
    super(props)
    this.state.elements = []
    this.state.cameraChoice = ''
    this._optimRender = false
  }

  componentDidMount () {
    this._optimRender = true

    this.props.context.serverStorage.getItem('cameras')
    .then((elements) => {
      this.setState({
        elements: elements.filter((el) => !!models.find((model) => model.id === el.model && model.compatibility.includes('mjpeg'))),
        cameraChoice: this.state.params.camera
      })
    })
    .catch((error) => {
      if (error.status === 404) {
        this.setState({
          elements: [],
          cameraChoice: this.state.params.camera
        })
      }
      console.error(error)
    })
  }

  componentWillUpdate (nextProps, nextState) {
    // Because of react-materialize bad behaviors...
    if (this.state.params.title !== nextState.params.title) {
      this._title.setState({ value: nextState.params.title })
    }
    if (this.state.params.displaySample !== nextState.params.displaySample) {
      this._displaySample.setState({ value: nextState.params.displaySample })
    }
  }

  render () {
    if (! this._optimRender) {
      return <div/>
    }

    const { context } = this.props
    const { animationLevel } = context.mainState()
    const waves = animationLevel >= 2 ? 'light' : undefined

    const { title = '', camera = '' } = this.state.params
    let { displaySample = false } = this.state.params
    displaySample = (displaySample === true)
    const { elements } = this.state

    return (
      <div className='clearing padded'>
        <div className='padded card'>
          <Row>
            <Input s={9} m={10} type='select' label='Camera' icon='videocam' onChange={this.cameraChosen.bind(this)}
              defaultValue={camera}>
              <option value=''>Please choose</option>
              {elements.map((el, idx) => (
                <option key={idx} value={el.id} selected={el.id === camera}>{el.name}</option>
              ))}
            </Input>
            <Button waves={waves} className={cx('right btn-floating', context.theme.actions.secondary)}
              onClick={this.gotToSettings.bind(this, 'ipcam_settings')}>
              <Icon>add</Icon>
            </Button>
            <Input s={12} label={displaySample ? 'Overlay title' : 'Button title'} ref={(c) => { this._title = c }}
              value={title} onChange={this.handleEventChange.bind(this, 'title')} />
          </Row>

          <Row>
            <Input s={12} type='switch' defaultChecked={displaySample} ref={(c) => { this._displaySample = c }}
              onChange={this.handleEventChange.bind(this, 'displaySample')}
              onLabel='Show a slow video stream on the item' offLabel='Show only a button' />
          </Row>
        </div>

        <Button waves={waves} className={cx('right btn-bottom-sticky', context.theme.actions.primary)} onClick={this.save.bind(this)}>
          Save &amp; close
        </Button>
      </div>
    )
  }

  cameraChosen (event) {
    this.setState({ cameraChoice: event.currentTarget.value })
  }

  save () {
    const displaySample = (this._displaySample.state.value === undefined)
      ? this.state.params.displaySample
      : (this._displaySample.state.value === true)
    const params = {
      ...this.state.params,
      title: this._title.state.value,
      camera: this.state.cameraChoice,
      displaySample
    }
    this.next(MotionJpegPtzItem, params)
  }
}

export default MotionJpegPtzSettingPanel

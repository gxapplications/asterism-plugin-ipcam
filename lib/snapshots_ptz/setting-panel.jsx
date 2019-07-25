'use strict'

import cx from 'classnames'
import React from 'react'
import { Button, Icon, TextInput, Row, Select, Checkbox } from 'react-materialize'

import { ItemSettingPanel } from 'asterism-plugin-library'
import { models } from '../camera-models'
import SnapshotsPtzItem from './item'

class SnapshotsPtzSettingPanel extends ItemSettingPanel {
  constructor (props) {
    super(props)
    this.state.elements = []
    this.state.cameraChoice = ''
  }

  componentDidMount () {
    this.props.context.serverStorage.getItem('cameras')
    .then((elements) => {
      this.setState({
        elements: elements.filter((el) => !!models.find((model) => (model.id === el.model) && model.compatibility.includes('snapshots'))),
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

  render () {
    const { mainState, theme } = this.props.context
    const { animationLevel } = mainState()
    const waves = animationLevel >= 2 ? 'light' : undefined

    const { elements, params } = this.state
    const { title = '', camera = '', displaySample = 'off' } = params

    return (
      <div className='clearing padded'>
        <div className='padded card'>
          <br />
          <Row>
            <Select s={9} m={10} label='Camera' icon='videocam' onChange={this.handleEventChange.bind(this, 'camera')} value={camera}>
              <option key={-1} value='' disabled>Choose a camera</option>
              {elements.map((el, idx) => (
                <option key={idx} value={el.id}>{el.name}</option>
              ))}
            </Select>
            <Button waves={waves} className={cx('right btn-floating', theme.actions.secondary)}
              onClick={this.gotToSettings.bind(this, 'ipcam_settings')}>
              <Icon>add</Icon>
            </Button>
            <TextInput s={12} label='Button title' value={title} onChange={this.handleEventChange.bind(this, 'title')} />
          </Row>

          <Row>
            <Checkbox key={displaySample} s={12} filledIn value='on' checked={displaySample === 'on'} onChange={(v) => {
              this.handleValueChange('displaySample', v.currentTarget.checked ? 'on' : 'off')
            }} label='Show a snapshot streamed on the button' />
          </Row>
        </div>

        <Button waves={waves} className={cx('right btn-bottom-sticky', theme.actions.primary)} onClick={this.save.bind(this)}>
          Save &amp; close
        </Button>
      </div>
    )
  }

  save () {
    this.next(SnapshotsPtzItem, this.state.params)
  }
}

export default SnapshotsPtzSettingPanel

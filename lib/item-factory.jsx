'use strict'

import { AdditionalItem, ItemFactoryBuilder } from 'asterism-plugin-library'

import MotionJpegPtzItem from './mjpeg_ptz/item'
import MotionJpegPtzSettingPanel from './mjpeg_ptz/setting-panel'
import SnapshotsPtzItem from './snapshots_ptz/item'
import SnapshotsPtzSettingPanel from './snapshots_ptz/setting-panel'

const builder = new ItemFactoryBuilder()
.newItemType('mjpeg_ptz', AdditionalItem.categories.SCREENING)
  .withDescription('Motion-JPEG IP camera screening', 'Screening Motion-JPEG & piloting PTZ compatible camera')
  .settingPanelWithHeader('MJPEG & PTZ settings', 'videocam') // optional override, but always before *Instance*() calls...
  .newInstanceFromInitialSetting(3, 2, MotionJpegPtzSettingPanel)
  .existingInstance(MotionJpegPtzItem, MotionJpegPtzSettingPanel)
  .acceptDimensions([
    { w: 1, h: 1 },
    { w: 1, h: 2 },
    { w: 1, h: 3 },
    { w: 1, h: 4 },
    { w: 2, h: 1 },
    { w: 2, h: 2 },
    { w: 2, h: 3 },
    { w: 2, h: 4 },
    { w: 2, h: 5 },
    { w: 2, h: 6 },
    { w: 3, h: 4 },
    { w: 3, h: 5 },
    { w: 3, h: 6 },
    { w: 3, h: 7 }
  ])
  .build()
.newItemType('snapshots_ptz', AdditionalItem.categories.SCREENING)
  .withDescription('IP camera screening by snapshots', 'Screening a snapshots flux & piloting PTZ compatible camera')
  .settingPanelWithHeader('Snapshots & PTZ settings', 'videocam') // optional override, but always before *Instance*() calls...
  .newInstanceFromInitialSetting(3, 2, SnapshotsPtzSettingPanel)
  .existingInstance(SnapshotsPtzItem, SnapshotsPtzSettingPanel)
  .acceptDimensions([
    { w: 1, h: 1 },
    { w: 1, h: 2 },
    { w: 1, h: 3 },
    { w: 1, h: 4 },
    { w: 2, h: 1 },
    { w: 2, h: 2 },
    { w: 2, h: 3 },
    { w: 2, h: 4 },
    { w: 2, h: 5 },
    { w: 2, h: 6 },
    { w: 3, h: 4 },
    { w: 3, h: 5 },
    { w: 3, h: 6 },
    { w: 3, h: 7 }
  ])
  .build()

class IpCamItemFactory extends builder.build() {
  // more custom functions here if needed...
}

export default IpCamItemFactory

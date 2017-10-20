'use strict'

const models = [
  {
    id: '',
    brand: 'Standard snapshots',
    name: 'URL to snapshots flux only',
    compatibility: ['snapshots'],
    urlSuffix: '/',
    controls: {}
  },
  { // https://www.foscam.es/descarga/ipcam_cgi_sdk.pdf
    id: 'CAMHED04IPW*',
    brand: 'HEDEN',
    name: 'Caméra IP intérieure Wifi',
    compatibility: ['mjpeg', 'snapshots'],
    urlSuffix: '/videostream.cgi',
    urlSlow: '/videostream.cgi?rate=23&resolution=8',
    urlSnapshot: '/snapshot.cgi',
    authentication: 'queryString',
    controls: {
      top: '/decoder_control.cgi?command=0&onestep=1&degree=8',
      bottom: '/decoder_control.cgi?command=2&onestep=1&degree=8',
      left: '/decoder_control.cgi?command=4&onestep=1&degree=8',
      right: '/decoder_control.cgi?command=6&onestep=1&degree=8'
    }
  },
  {
    id: 'CAMHD08MD0',
    brand: 'HEDEN',
    name: 'Caméra IP intérieure Dôme, video stream server side piped',
    compatibility: ['snapshots'],
    urlSuffix: '/tmpfs/snap.jpg', // high res, for modal
    urlSnapshot: '/tmpfs/auto.jpg', // low res, for snapshot
    authentication: 'basic',
    controls: {
      top: '/web/cgi-bin/hi3510/ptzctrl.cgi?-step=1&-act=up',
      bottom: '/web/cgi-bin/hi3510/ptzctrl.cgi?-step=1&-act=down',
      left: '/web/cgi-bin/hi3510/ptzctrl.cgi?-step=1&-act=right',
      right: '/web/cgi-bin/hi3510/ptzctrl.cgi?-step=1&-act=left',
      home: '/web/cgi-bin/hi3510/ptzctrl.cgi?-step=0&-act=home',
      stop: '/web/cgi-bin/hi3510/ptzctrl.cgi?-step=0&-act=stop',
      gotToPreset: '/web/cgi-bin/hi3510/preset.cgi?-act=goto&-number=%1',
      setPreset: '/web/cgi-bin/hi3510/preset.cgi?-act=set&-status=1&-number=%1',
      ledOn: '/web/cgi-bin/hi3510/param.cgi?cmd=setinfrared&-infraredstat=open',
      ledOff: '/web/cgi-bin/hi3510/param.cgi?cmd=setinfrared&-infraredstat=close',
      ledAuto: '/web/cgi-bin/hi3510/param.cgi?cmd=setinfrared&-infraredstat=auto'
    }
  }
]

export { models }

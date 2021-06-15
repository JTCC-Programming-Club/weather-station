import { openDB } from 'idb'

const dbName = 'weather-station'
const storeName = 'default'
const version = 1

export default async store => {
  const db = await openDB(dbName, version, {
    upgrade(db, oldVersion, newVersion, transaction) {
      const idbstore = db.createObjectStore(storeName)
      idbstore.put([], 'dashboard')
      idbstore.put({}, 'sensors')
      idbstore.put({}, 'settings')
      idbstore.put([], 'stations')
    }
  })

  // Alphabetically ordered by key names
  const [dashboard, sensors, settings, stations] = await db.transaction(storeName)
    .objectStore(storeName).getAll()

  const fnMap = {
    addBookmark: (state, idbstore) => {
      idbstore.delete('dashboard').then(() => {
        idbstore.put(state.dashboard, 'dashboard')
      })
    },
    removeBookmark: (state, idbstore) => {
      idbstore.delete('dashboard').then(() => {
        idbstore.put(state.dashboard, 'dashboard')
      })
    },
    setCardMode: (state, idbstore) => {
      idbstore.delete('dashboard').then(() => {
        idbstore.put(state.dashboard, 'dashboard')
      })
    },
    setCardTimeAgo: (state, idbstore) => {
      idbstore.delete('dashboard').then(() => {
        idbstore.put(state.dashboard, 'dashboard')
      })
    },
    setDashboard: (state, idbstore) => {
      idbstore.delete('dashboard').then(() => {
        idbstore.put(state.dashboard, 'dashboard')
      })
    },
    setSensorData: (state, idbstore) => {
      idbstore.delete('sensors').then(() => {
        idbstore.put(state.sensors, 'sensors')
      })
    },
    setSettings: (state, idbstore) => {
      idbstore.delete('settings').then(() => {
        idbstore.put(state.settings, 'settings')
      })
    },
    setStations: (state, idbstore) => {
      idbstore.delete('stations').then(() => {
        idbstore.put(state.stations, 'stations')
      })
    }
  }

  //
  // Hydrate stations
  //
  // Consume the server data if the server response beat us
  if (store.state.stations.length) {
    const tx = db.transaction(storeName, 'readwrite')
    const idbstore = tx.objectStore(storeName)
    fnMap.setStations(store.state, idbstore)
  // Hydrate from the cache if we beat the server response
  } else if (stations && stations.length) {
    // eslint-disable-next-line no-console
    console.debug('stations hydrated from cache')
    store.commit('setStations', stations)
  }

  //
  // Hydrate sensors
  //
  if (Object.keys(store.state.sensors).length) {
    const tx = db.transaction(storeName, 'readwrite')
    const idbstore = tx.objectStore(storeName)
    fnMap.setSensorData(store.state, idbstore)
  } else {
    Object.values(sensors).forEach(sensor => store.commit('setSensorData', sensor))
    // eslint-disable-next-line no-console
    console.debug('sensors hydrated from cache')
  }

  //
  // Hydrate dashboard
  //
  if (dashboard.length) {
    store.commit('setDashboard', dashboard)
  }

  //
  // Hydrate settings
  //
  if (Object.keys(settings).length) {
    store.commit('setSettings', settings)
  }

  store.subscribe((mutation, state) => {
    const hook = fnMap[mutation.type]
    if (hook) {
      const tx = db.transaction(storeName, 'readwrite')
      const idbstore = tx.objectStore(storeName)
      hook(state, idbstore)
    }
  })
}

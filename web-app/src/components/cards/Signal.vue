<template>
  <div>
    <ModeButton :value="mode" @input="setMode" />
    <CardHeader>
      <div>
        {{ sensor.label }}
        <span v-if="sensor.settings">- {{ sensor.station.label }}</span>
      </div>
    </CardHeader>
    <TimeButtons :value="timeAgo" @input="setTimeAgo" :zoomed-in="zoomedIn" @reset-zoom="zoomedIn = false" />
    <CurrentView v-if="mode === 'current' && measurements.length" :measurements="measurements">
      <template v-slot:value1>
        {{ currentSignal }}dbm ({{ currentSignalQuality }})
      </template>
      <template v-slot:value2>
        {{ averageSignal }}
      </template>
    </CurrentView>
    <CurrentView v-else-if="mode === 'current'">
      <template v-slot:value1>N/A</template>
      <template v-slot:value2>N/A</template>
    </CurrentView>
    <Graph
      v-else
      :name="sensor.label"
      :measurements="measurements"
      :zoomed-in="zoomedIn"
      @zoomed-in="zoomedIn = true"
      />
    <BookmarkButton v-if="!sensor.settings" :mode="mode" :sensor-id="sensor.id" :time-ago="timeAgo" />
  </div>
</template>

<script>
import BookmarkButton from '../BookmarkButton'
import CurrentView from '../CurrentView'
import Graph from '../Graph'
import ModeButton from '../ModeButton'
import TimeButtons from '../TimeButtons'
import CardHeader from '../CardHeader.vue'

export default {
  components: {
    BookmarkButton,
    CurrentView,
    Graph,
    ModeButton,
    TimeButtons,
    CardHeader
  },
  props: {
    sensor: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      // Hydrate from sensor "settings" if this is on the dashboard
      mode: this.sensor.settings?.mode || 'current',
      timeAgo: this.sensor.settings?.timeAgo || 1728e5,
      zoomedIn: false
    }
  },
  computed: {
    averageSignal() {
      const sum = this.measurements.reduce((acc, el) => acc + Number(el.value), 0)
      return Math.round(sum / this.measurements.length)
    },
    averageSignalQuality() {
      return this.quality(this.averageSignal)
    },
    currentSignal() {
      if (this.measurements.length) {
        return this.measurements[this.measurements.length - 1].value
      }
      return 0
    },
    currentSignalQuality() {
      return this.quality(this.currentSignal)
    },
    measurements() {
      if (this.timeAgo === Infinity) {
        return this.sensor.measurements
      }
      const now = new Date().getTime()
      // Filter down to our given time scope
      return this.sensor.measurements
        .filter(m => now - Math.round(new Date(m.created_at).getTime()) <= this.timeAgo)
    }
  },
  methods: {
    quality(value) {
      if (value >= -50) {
        return 'excellent'
      } else if (value >= -67) {
        return 'good'
      } else if (value >= -70) {
        return 'acceptable'
      } else if (value >= -80) {
        return 'bad'
      }
      return 'very poor'
    },
    setMode(newMode) {
      this.mode = newMode
      // State of graph gets reset with mode changes
      this.zoomedIn = false
      this.$emit('change-mode', this.mode)
    },
    setTimeAgo(timeAgo) {
      this.timeAgo = timeAgo
      this.$emit('change-time-ago', this.timeAgo)
    }
  }
}
</script>

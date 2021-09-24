<template>
  <div>
    <ModeButton :modes="['percentage-chart', 'chart', 'current']" :value="mode" @input="setMode" />
    <CardHeader>
      <div>
        {{ sensor.label }}
        <span v-if="sensor.settings">- {{ sensor.station.label }}</span>
      </div>
    </CardHeader>
    <TimeButtons :value="timeAgo" @input="setTimeAgo" :zoomed-in="zoomedIn" @reset-zoom="zoomedIn = false" />
    <CurrentView v-if="mode === 'current' && measurements.length" :measurements="measurements">
      <template v-slot:value1>
        {{ currentPercentage }}% ({{ currentVoltage | zeroPad }}v)
      </template>
      <template v-slot:value2>
        {{ averagePercentage }}% ({{ averageVoltage | zeroPad }}v)
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
      :options="chartOptions"
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

function voltsToPercent(volts) {
  const map = [
    [4.2, 100],
    [4.15, 95],
    [4.11, 90],
    [4.08, 85],
    [4.02, 80],
    [3.98, 75],
    [3.95, 70],
    [3.91, 65],
    [3.87, 60],
    [3.85, 55],
    [3.84, 50],
    [3.82, 45],
    [3.8, 40],
    [3.79, 35],
    [3.77, 30],
    [3.75, 25],
    [3.73, 20],
    [3.71, 15],
    [3.69, 10],
    [3.61, 5],
    [3.27, 1],
    [-Infinity, 0]
  ]
  return map.find(([v, p]) => volts >= v)[1]
}

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
  filters: {
    zeroPad: str => String(str).padEnd(4, 0)
  },
  data() {
    return {
      // Hydrate from sensor "settings" if this is on the dashboard
      mode: this.sensor.settings?.mode || 'percentage-chart',
      timeAgo: this.sensor.settings?.timeAgo || 6048e5,
      zoomedIn: false
    }
  },
  computed: {
    averagePercentage() {
      return voltsToPercent(this.averageVoltage)
    },
    averageVoltage() {
      const sum = this.measurements.reduce((acc, el) => acc + Number(el.value), 0)
      return Math.round((sum / this.measurements.length) * 100) / 100
    },
    chartOptions() {
      if (this.mode === 'percentage-chart') {
        return {
          stroke: {
            curve: 'smooth'
          },
          yaxis: {
            min: 0,
            max: 100
          }
        }
      }
      return {
        yaxis: {
          min: 2.4,
          max: 4.4
        }
      }
    },
    currentPercentage() {
      return voltsToPercent(this.currentVoltage)
    },
    currentVoltage() {
      if (this.measurements.length) {
        return this.measurements[this.measurements.length - 1].value
      }
      return 0
    },
    measurements() {
      const now = new Date().getTime()
      let measurements = this.sensor.measurements
        // Filter down to the specified time range
        .filter(m => now - Math.round(new Date(m.created_at).getTime()) <= this.timeAgo)
      if (this.mode === 'percentage-chart') {
        measurements = measurements.map(m => ({
          created_at: m.created_at,
          value: voltsToPercent(m.value)
        }))
      }
      return measurements
    }
  },
  methods: {
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

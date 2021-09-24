<template>
  <div>
    <ModeButton :value="mode" @input="setMode" />
    <CardHeader>
      <div>
        {{ sensor.label }}
        <span v-if="sensor.settings">- {{ sensor.station.label }}</span>
      </div>
    </CardHeader>
    <TimeButtons
      :value="timeAgo"
      @input="setTimeAgo"
      :zoomed-in="zoomedIn"
      @reset-zoom="zoomedIn = false"
    />
    <CurrentView
      v-if="mode === 'current' && measurements.length"
      :measurements="measurements"
    >
      <template v-slot:header1>Estimated</template>
      <template v-slot:value1>{{ averageElevation }} {{ unitPref }}</template>
    </CurrentView>
    <CurrentView v-else-if="mode === 'current'">
      <template v-slot:header1>Estimated</template>
      <template v-slot:value1>N/A</template>
    </CurrentView>
    <Graph
      v-else
      chart-type="area"
      :name="sensor.label"
      :measurements="measurements"
      :zoomed-in="zoomedIn"
      @zoomed-in="zoomedIn = true"
    />
    <!-- Don't show this on the dashboard -->
    <BookmarkButton
      v-if="!sensor.settings"
      :mode="mode"
      :sensor-id="sensor.id"
      :time-ago="timeAgo"
    />
  </div>
</template>

<script>
import BookmarkButton from '../BookmarkButton'
import CurrentView from '../CurrentView'
import Graph from '../Graph'
import ModeButton from '../ModeButton'
import TimeButtons from '../TimeButtons'
import CardHeader from '../CardHeader'

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
      timeAgo: this.sensor.settings?.timeAgo || Infinity,
      zoomedIn: false
    }
  },
  computed: {
    averageElevation() {
      const sum = this.measurements.reduce(
        (acc, el) => acc + Number(el.value),
        0
      )
      return Math.round((sum / this.measurements.length) * 10) / 10
    },
    measurements() {
      let measurements = this.sensor.measurements
      // Filter down to the specified time range
      if (this.timeAgo !== Infinity) {
        const now = new Date().getTime()
        measurements = measurements.filter(
          m =>
            now - Math.round(new Date(m.created_at).getTime()) <= this.timeAgo
        )
      }
      // Convert to preferred unit
      return measurements.map(m => ({
        created_at: m.created_at,
        value: this.unitConvert(m.value)
      }))
    },
    unitPref() {
      return this.$store.state.preferences.elevation
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
    },
    unitConvert(value) {
      switch (this.unitPref) {
        case 'meters':
          return value
        case 'feet':
          return Math.round(value * 3.2808 * 10) / 10
      }
    }
  }
}
</script>

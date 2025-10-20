<template>
  <div>
    <v-card
      class="mt-5"
      rounded="lg"
      elevation="0"
      variant="outlined"
      style="border-color: #e0e0e0"
    >
      <v-card-text class="ma-3">
        <b class="mt-1"> JOB DESCRIPTION: </b>
        <div class="d-flex flex-wrap mb-3">
          <div class="ml-1 mt-1 pre-formatted-text" v-bind="props">
            {{ selectedJobObject.job_description }}
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
<script>
export default {
  props: {
    selectedJobObject: Object,
  },
  components: {},
  data() {
    return {};
  },
};
</script>

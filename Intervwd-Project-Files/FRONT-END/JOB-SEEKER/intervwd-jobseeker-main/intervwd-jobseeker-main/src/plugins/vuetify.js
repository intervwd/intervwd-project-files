// // Styles
// import '@mdi/font/css/materialdesignicons.css'
// import 'vuetify/styles'

// // Vuetify
// import { createVuetify } from 'vuetify'

// export default createVuetify(
//   // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
// )

import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "@mdi/font/css/materialdesignicons.css"; // ✅ Icons

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
  },
  theme: {
    defaultTheme: "customTheme",
    themes: {
      customTheme: {
        dark: false, // Set to true for a dark theme
        colors: {
          primary: "#195732",
          GreenColorVariant1: "#16a34a",

          BlueColorVariant1: "#4e65d9",

          BlueColorVariant2: "#3e74ed",
          BlueColorVariant3: "#3b82f6",
        },
      },
    },
  },
});

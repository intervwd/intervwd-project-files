import { createApp } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import { loadFonts } from "./plugins/webfontloader";
import router from "./router";
import store from "./store";
import { Amplify } from "aws-amplify";

loadFonts();
async function initApp() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.VUE_APP_AWS_COGNITO_USER_POOL_ID,
        userPoolClientId: process.env.VUE_APP_AWS_USER_POOL_WEB_CLIENT_ID,
        // identityPoolId: "us-east-1:7fb6f6b2-043d-4691-8f26-911d279f8775",
        identityPoolId: process.env.VUE_APP_IDENTITY_POOLID,
        signUpVerificationMethod: "code",
        region: process.env.VUE_APP_AWS_REGION,
        loginWith: {
          email: true,
        },
      },
    },
    API: {
      GraphQL: {
        endpoint: process.env.VUE_APP_AWS_GRAPHQL_ENDPOINT,
        region: process.env.VUE_APP_AWS_REGION,
        defaultAuthMode: process.env.VUE_APP_AWS_AUTH_TYPE,
        apiKey: process.env.VUE_APP_AWS_API_KEY,
        logger_level: "DEBUG",
      },
    },
    Storage: {
      S3: {
        bucket: process.env.VUE_APP_BUCKET_NAME,
        region: process.env.VUE_APP_AWS_REGION,
        logger_level: "DEBUG",
      },
    },
  });

  const app = createApp(App);

  app.use(router).use(store).use(vuetify).mount("#app");
}
initApp();

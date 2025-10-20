import { createApp } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import { loadFonts } from "./plugins/webfontloader";
import router from "./router";
import store from "./store";
import { Amplify } from "aws-amplify";

loadFonts();

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_AT2QvQNmG",
      userPoolClientId: "31ui5cpo6a9h3hfqo8ogh79ct4",
      identityPoolId: "us-east-1:3a6bb05c-6140-4727-b5b3-839ba25919f3",
      signUpVerificationMethod: "code",
      loginWith: {
        email: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint:
        "https://tb3bdlnvfbaojfmno2owenzu2y.appsync-api.us-east-1.amazonaws.com/graphql",
      region: "us-east-1",
      defaultAuthMode: "apiKey",
      apiKey: "da2-dh54txb5kzdh7lwnakr2qwv6ge",
      logger_level: "DEBUG",
    },
  },
  Storage: {
    S3: {
      bucket: "intervwd-files",
      region: "us-east-1",
      logger_level: "DEBUG",
    },
  },
});

const app = createApp(App);

app.use(router).use(store).use(vuetify).mount("#app");

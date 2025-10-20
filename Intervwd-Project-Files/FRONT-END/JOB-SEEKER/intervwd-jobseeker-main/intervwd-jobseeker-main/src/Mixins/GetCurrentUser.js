import { GetCurrentUserDetails } from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const getCurrentUserDetailsfile = {
  data: () => ({}),
  methods: {
    async getCurrentUserDetailsMethod() {
      try {
        this.overlay = true;
        let result = await client.graphql({
          query: GetCurrentUserDetails,
          variables: {
            input: {
              user_email_id: this.$store.getters.get_user_email,
            },
          },
        });
        console.log("result", result);
        this.getCurrentUserDetailsObject = JSON.parse(
          result.data.GetCurrentUserDetails
        ).data.items[0];
        console.log("Current User", this.getCurrentUserDetailsObject);

        this.$store.commit(
          "SET_CURRENT_USER",
          this.getCurrentUserDetailsObject
        );
        this.CurrentView = "FindJobsCard";
        this.overlay = false;
      } catch (error) {
        // this.$router.push("/");
        this.overlay = false;
        console.log("error", error);
        this.SnackbarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText: error.errors[0].message,
        };
      }
    },
  },
};

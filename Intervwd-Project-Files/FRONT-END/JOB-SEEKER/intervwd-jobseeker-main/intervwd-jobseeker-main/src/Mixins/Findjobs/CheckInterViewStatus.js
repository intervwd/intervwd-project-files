import { CheckIfInterviewAlreadyTaken } from "@/graphql/queries.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const CheckIfInterviewAlreadyTakenFunction = {
  data: () => ({}),
  methods: {
    async checkInterviewStatusMethod(Job_ID) {
      try {
        let result = await client.graphql({
          query: CheckIfInterviewAlreadyTaken,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              jd_id: Job_ID,
            },
          },
        });
        console.log("result", result);
        let ResultObj = JSON.parse(result.data.CheckIfInterviewAlreadyTaken);
        if (ResultObj.status == "Success") {
          if (ResultObj.status_message == "Allow to create interview") {
            return true;
          } else {
            return false;
          }
        }
        this.overlay = false;
      } catch (error) {
        this.overlay = false;
        console.log("error", error);
        this.SnackbarComponent = {
          SnackbarVmodel: true,
          SnackbarColor: "red",
          SnackbarText: error.errors[0].message,
        };
        this.InterViewError = error.errors[0].message;
      }
    },
  },
};

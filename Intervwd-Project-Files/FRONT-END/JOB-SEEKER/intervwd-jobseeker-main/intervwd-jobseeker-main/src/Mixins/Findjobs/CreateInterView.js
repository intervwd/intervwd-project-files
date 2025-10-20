import { CreateInterview } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const CreateInterviewFunction = {
  data: () => ({}),
  methods: {
    async CreateInterviewMethod(Job_ID) {
      try {
        let result = await client.graphql({
          query: CreateInterview,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              jd_id: Job_ID,
            },
          },
        });
        console.log("result", result);
        let ResultObj = JSON.parse(result.data.CreateInterview);
        console.log("List Jobs", ResultObj);
        this.overlay = false;
        return ResultObj;
      } catch (error) {
        this.overlay = false;
        this.InterruptInterview = error.errors[0].message;
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

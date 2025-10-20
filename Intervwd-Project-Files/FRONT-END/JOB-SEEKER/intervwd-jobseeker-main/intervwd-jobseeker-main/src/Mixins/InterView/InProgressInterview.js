import { UpdateInterviewDetailsAsInprogress } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const InprogressInterviewUpdateFunction = {
  data: () => ({}),
  methods: {
    async InprogressInterviewUpdateMethod(InterView_ID) {
      try {
        let result = await client.graphql({
          query: UpdateInterviewDetailsAsInprogress,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              interview_id: InterView_ID,
            },
          },
        });
        console.log("result", result);
        let ResultObj = JSON.parse(
          result.data.UpdateInterviewDetailsAsInprogress
        );
        console.log("List Jobs", ResultObj);
        this.overlay = false;
        return ResultObj;
      } catch (error) {
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

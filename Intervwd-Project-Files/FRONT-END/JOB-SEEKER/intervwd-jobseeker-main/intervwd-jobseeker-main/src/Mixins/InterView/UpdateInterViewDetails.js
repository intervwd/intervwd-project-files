import { UpdateInterviewAudioDetails } from "@/graphql/mutations.js";
import { generateClient } from "aws-amplify/api";
const client = generateClient();

export const UpdateInterviewAudioDetailsFunction = {
  data: () => ({}),
  methods: {
    async UpdateInterviewAudioDetailsMethod(INTERVIEW_ID, DURATION, AUDIO_URL) {
      try {
        let result = await client.graphql({
          query: UpdateInterviewAudioDetails,
          variables: {
            input: {
              user_id: this.$store.getters.get_currentuser_details.user_id,
              interview_id: INTERVIEW_ID,
              interview_duration_seconds: DURATION,
              interview_audio: AUDIO_URL,
            },
          },
        });
        console.log("result", result);
        let ResultObj = JSON.parse(result.data.UpdateInterviewAudioDetails);
        console.log("List Jobs", ResultObj);
        this.overlay = false;
        this.InterViewDialogEmit(2);
        this.StopLoading = false;

        return ResultObj;
      } catch (error) {
        this.overlay = false;
        this.StopLoading = false;

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

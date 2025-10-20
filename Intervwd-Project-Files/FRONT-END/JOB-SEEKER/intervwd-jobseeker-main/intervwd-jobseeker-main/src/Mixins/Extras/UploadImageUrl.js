import { uploadData } from "aws-amplify/storage";

export const CommonUploadFile = {
  data: () => ({}),
  methods: {
    async CommonUploadFileMethod(key, file) {
      try {
        console.log("Key", key, file);
        const result = await uploadData({
          path: key,
          data: file,
        }).result;
        console.log("Result", result);
        return {
          status: "SUCCESS",
          key: key,
          url: key,
          file: file,
        };
      } catch (error) {
        console.log("Err", error);
      }
    },
  },
};

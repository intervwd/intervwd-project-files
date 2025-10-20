import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

function generate_random_digits(n) {
  let digits = '';
  for (let i = 0; i < n; i++) {
    digits += Math.floor(Math.random() * 10); // generates a digit from 0-9
  }
  return digits;
}

export const handler = async (event) => {
  try {
    let secretLoginCode = undefined;
    if (!event.request.session || event.request.session.length === 0) {
      if (event.request.userAttributes.email) {
        secretLoginCode = await generate_random_digits(6);

        /// use ses email
        const sesClient = new SESClient({
          region: "us-east-1",
        });
        const sendEmailCommand = new SendEmailCommand({
          Source: "no-reply@intervwd.com",
          Destination: {
            ToAddresses: [event.request.userAttributes.email],
          },
          Message: {
            Subject: {
              Data: `OTP For Intervwd - ${secretLoginCode}`,
            },
            Body: {
              Text: {
                Data: `Your Intervwd OTP is: ${secretLoginCode}\nPlease do not share this code with anyone.\nPowered by Mobil80 Solutions`,
              },
            },
          },
        });
        const response = await sesClient.send(sendEmailCommand);
      }
    }
    event.response.publicChallengeParameters = {
      email: event.request.userAttributes.email,
      phone_number: event.request.userAttributes.phone_number
    };
    event.response.privateChallengeParameters = { secretLoginCode };
    event.response.challengeMetadata = `CODE-${secretLoginCode}`;
    return event;
  }
  catch (e) {
    throw new Error(e);
  }
};

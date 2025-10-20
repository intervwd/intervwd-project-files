export const handler = async (event) => {
  console.log('EVENT ', event);
  const expectedAnswer = event.request.privateChallengeParameters.secretLoginCode;
  console.log(expectedAnswer, event.request.challengeAnswer);
  if (event.request.challengeAnswer === expectedAnswer) {
    event.response.answerCorrect = true;
    return event;
  }
  else {
    throw new Error("Incorrect OTP!!");
  }
};

import * as dynamodb from "@aws-sdk/client-dynamodb";
import * as ddb from "@aws-sdk/lib-dynamodb";
const docClient = new dynamodb.DynamoDBClient();
const ddbDocClient = ddb.DynamoDBDocumentClient.from(docClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

import axios from 'axios';


export const insert_dynamo = async (params) => {
  try {
    await ddbDocClient.send(new ddb.PutCommand({ ...params, removeUndefinedValues: true }));
    return "SUCCESS";
  }
  catch (err) {
    console.log(params, err);
    throw new Error(err);
  }
};

export const query_dynamo = async (params) => {
  try {
    const results = await ddbDocClient.send(new ddb.QueryCommand(params));
    return results;
  }
  catch (err) {
    console.log(params);
    console.error(err);
  }
};

export const update_dynamo = async (params) => {
  try {
    const results = await ddbDocClient.send(new ddb.UpdateCommand(params));
    return results;
  }
  catch (err) {
    console.log(params, err);
    throw new Error(err);
  }
};


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

// export const handler = async (event) => {
//   try {
//     const skills_needed = event.skills_needed || [];
//     const userPrompt = skills_needed.join(", ");
//     console.log('userPrompt ', userPrompt);

//     // 1. Create a new thread
//     const threadResponse = await axios.post(
//       'https://api.openai.com/v1/threads', {}, {
//         headers: {
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//           'OpenAI-Beta': 'assistants=v2',
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const threadId = threadResponse.data.id;

//     // 2. Send the user's prompt
//     await axios.post(
//       `https://api.openai.com/v1/threads/${threadId}/messages`, {
//         role: 'user',
//         content: userPrompt,
//       }, {
//         headers: {
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//           'OpenAI-Beta': 'assistants=v2',
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     // 3. Run the assistant
//     const runResponse = await axios.post(
//       `https://api.openai.com/v1/threads/${threadId}/runs`, {
//         assistant_id: ASSISTANT_ID,
//       }, {
//         headers: {
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//           'OpenAI-Beta': 'assistants=v2',
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const runId = runResponse.data.id;

//     // 4. Poll until run is complete
//     let runStatus = 'queued';
//     let runData;
//     while (runStatus === 'queued' || runStatus === 'in_progress') {
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       const statusResponse = await axios.get(
//         `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
//           headers: {
//             Authorization: `Bearer ${OPENAI_API_KEY}`,
//             'OpenAI-Beta': 'assistants=v2',
//             'Content-Type': 'application/json',
//           },
//         }
//       );

//       runData = statusResponse.data;
//       runStatus = runData.status;
//     }

//     // 5. Get the Assistant's reply
//     const messagesResponse = await axios.get(
//       `https://api.openai.com/v1/threads/${threadId}/messages`, {
//         headers: {
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//           'OpenAI-Beta': 'assistants=v2',
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const messages = messagesResponse.data.data;

//     const assistantMessageRaw = messages.find(
//       (msg) => msg.role === 'assistant'
//     )?.content?.[0]?.text?.value;

//     let assistantMessage = assistantMessageRaw;
//     try {
//       assistantMessage = JSON.parse(assistantMessageRaw);
//     }
//     catch {
//       // Leave as plain text if not valid JSON
//     }

//     let updateUser = {
//       TableName: "Intervwd_Job_description",
//       Key: {
//         jd_id: event.jd_id
//       },
//       UpdateExpression: "Set skills_question_answers = :skills_question_answers",
//       ExpressionAttributeValues: {
//         ":skills_question_answers": assistantMessage
//       },
//       ReturnValues: 'UPDATED_NEW',
//     };
//     await update_dynamo(updateUser);

//     return {
//       statusCode: 200,
//       body: {
//         prompt: userPrompt,
//         reply: assistantMessage || 'No reply received.',
//       },
//     };
//   }
//   catch (error) {
//     console.error('Error calling OpenAI Assistant API:', error.response?.data || error.message);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: 'Something went wrong calling OpenAI Assistant API.' }),
//     };
//   }
// };

export const handler = async (event) => {
  try {
    // 1️⃣ Raw messages (simulate your input)
    let data = [
      { speaker: 'USER', text: 'hi' },
      {
        speaker: 'ASSISTANT',
        text: "Hello! Let's dive right into the interview. To start, can you tell me about a successful business generation strategy you've implemented in your previous role?"
      },
      { speaker: 'ASSISTANT', text: '{ "interrupted" : true }' },
      {
        speaker: 'USER',
        text: 'hello what'
      },
      {
        speaker: 'ASSISTANT',
        text: "Hi there! Let's get started with the interview. Can you share an example of how you've leveraged IT services to improve a business process?"
      },
      { speaker: 'ASSISTANT', text: '{ "interrupted" : true }' }
    ];

    // 2️⃣ Filter duplicates and interruptions
    const filterData = data.filter((msg, index, arr) =>
      msg.text !== '{ "interrupted" : true }' &&
      !(msg.speaker === "ASSISTANT" && arr.slice(0, index).some(prev => prev.text === msg.text))
    );

    // 3️⃣ Map to API message format
    const userPrompt = filterData.map(msg => ({
      role: msg.speaker.toLowerCase() === 'user' ? 'user' : 'assistant',
      content: [{ type: 'text', text: msg.text }]
    }));

    // 4️⃣ Create a new thread
    const threadResponse = await axios.post(
      'https://api.openai.com/v1/threads', {}, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json'
        }
      }
    );

    const threadId = threadResponse.data.id;

    // 5️⃣ Send messages one by one
    for (const msg of userPrompt) {
      await axios.post(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        msg, {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // 6️⃣ Run the assistant
    const runResponse = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`, { assistant_id: ASSISTANT_ID }, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json'
        }
      }
    );

    const runId = runResponse.data.id;

    // 7️⃣ Poll until run is complete
    let runStatus = 'queued';
    let runData;
    while (runStatus === 'queued' || runStatus === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2',
            'Content-Type': 'application/json'
          }
        }
      );

      runData = statusResponse.data;
      runStatus = runData.status;
    }

    // 8️⃣ Get the assistant's reply
    const messagesResponse = await axios.get(
      `https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2',
          'Content-Type': 'application/json'
        }
      }
    );

    const messages = messagesResponse.data.data;

    const assistantMessageRaw = messages
      .filter(msg => msg.role === 'assistant')
      .map(msg => msg.content
        .filter(c => c.type === 'text')
        .map(c => c.text.value) // ✅ get the string value
        .join('\n')
      )
      .join('\n');

    let assistantReply;
    try {
      // Extract the first valid JSON object from the assistant's text
      const jsonMatch = assistantMessageRaw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        assistantReply = JSON.parse(jsonMatch[0]);
      }
      else {
        assistantReply = { error: "No JSON evaluation found", raw: assistantMessageRaw };
      }
    }
    catch (err) {
      assistantReply = { error: "Failed to parse assistant JSON", raw: assistantMessageRaw };
    }

    return {
      statusCode: 200,
      data: assistantReply.evaluation
    };

  }
  catch (error) {
    console.error('Error calling OpenAI Assistant API:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong calling OpenAI Assistant API.' })
    };
  }
};

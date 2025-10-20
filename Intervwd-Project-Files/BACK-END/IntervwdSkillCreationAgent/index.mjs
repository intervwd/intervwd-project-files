import axios from 'axios';

import * as dynamodb from "@aws-sdk/client-dynamodb";
import * as ddb from "@aws-sdk/lib-dynamodb";
const docClient = new dynamodb.DynamoDBClient();
const ddbDocClient = ddb.DynamoDBDocumentClient.from(docClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});
const { unmarshall } = await import("@aws-sdk/util-dynamodb");

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
const client_lambda = new LambdaClient({ region: "us-east-1" });
async function invoke_lambda(payload, function_name, event_type) {
  let params = {
    FunctionName: function_name,
    InvocationType: event_type, //"Event",
    Payload: JSON.stringify(payload),
  };
  let response = await client_lambda.send(new InvokeCommand(params));
  return response;
}


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

export const scan_dynamo = async (params) => {
  try {
    const results = await ddbDocClient.send(new ddb.ScanCommand(params));
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

export const delete_dynamo = async (params) => {
  try {
    await ddbDocClient.send(new ddb.DeleteCommand(params));
    return "SUCCESS";
  }
  catch (err) {
    console.log(params, err);
    throw new Error(err);
  }
};


const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

export const handler = async (event) => {
  try {
    for (let i = 0; i < event.Records.length; i++) {
      if (event.Records[i].eventName == "INSERT") {
        let new_record = unmarshall(event.Records[i].dynamodb.NewImage);
        console.log(JSON.stringify(new_record));
        const userPrompt = new_record.job_description;

        // 1. Create a new thread
        const threadResponse = await axios.post(
          'https://api.openai.com/v1/threads', {}, {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2',
              'Content-Type': 'application/json',
            },
          }
        );

        const threadId = threadResponse.data.id;

        // 2. Send the user's prompt
        await axios.post(
          `https://api.openai.com/v1/threads/${threadId}/messages`, {
            role: 'user',
            content: userPrompt,
          }, {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2',
              'Content-Type': 'application/json',
            },
          }
        );

        // 3. Run the assistant
        const runResponse = await axios.post(
          `https://api.openai.com/v1/threads/${threadId}/runs`, {
            assistant_id: ASSISTANT_ID,
          }, {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2',
              'Content-Type': 'application/json',
            },
          }
        );

        const runId = runResponse.data.id;

        // 4. Poll until run is complete
        let runStatus = 'queued';
        let runData;
        while (runStatus === 'queued' || runStatus === 'in_progress') {
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const statusResponse = await axios.get(
            `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2',
                'Content-Type': 'application/json',
              },
            }
          );

          runData = statusResponse.data;
          runStatus = runData.status;
        }

        const messagesResponse = await axios.get(
          `https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              'OpenAI-Beta': 'assistants=v2',
              'Content-Type': 'application/json',
            },
          }
        );

        const messages = messagesResponse.data.data;

        const assistantMessageRaw = messages.find(
          (msg) => msg.role === 'assistant'
        )?.content?.[0]?.text?.value;

        let assistantMessage = assistantMessageRaw;
        try {
          assistantMessage = JSON.parse(assistantMessageRaw);
        }
        catch {
          // Leave as plain text if not valid JSON
        }

        let updateUser = {
          TableName: "Intervwd_Job_description",
          Key: {
            jd_id: new_record.jd_id
          },
          UpdateExpression: "Set skills_needed = :skills_needed",
          ExpressionAttributeValues: {
            ":skills_needed": assistantMessage
          },
          ReturnValues: 'UPDATED_NEW',
        };
        await update_dynamo(updateUser);

        console.log('Skills created successfully');
      }
    }
  }
  catch (error) {
    console.error('Error calling OpenAI Assistant API:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong calling OpenAI Assistant API.' }),
    };
  }
};

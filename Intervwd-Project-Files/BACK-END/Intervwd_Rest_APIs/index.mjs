//********************************* DynamoDB *********************************
import * as dynamodb from "@aws-sdk/client-dynamodb";
import * as ddb from "@aws-sdk/lib-dynamodb";
const docClient = new dynamodb.DynamoDBClient();
const ddbDocClient = ddb.DynamoDBDocumentClient.from(docClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

import axios from 'axios';
import { v4 as uuidv4 } from "uuid";

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

const listPublicJobs = async (event) => {
  let getCurrentUserCreatedJD = {
    TableName: "Intervwd_Job_description",
    IndexName: "jd_status-make_this_job_publicly_searchable-index",
    KeyConditionExpression: "jd_status = :jd_status AND make_this_job_publicly_searchable = :make_this_job_publicly_searchable",
    ExpressionAttributeValues: {
      ":jd_status": "ACTIVE",
      ":make_this_job_publicly_searchable": "PUBLIC",
    }
  };
  let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  if (jdLists.Count == 0) {
    throw new Error("No job opportunity have been created");
  }

  // let response = {
  //   items: jdLists.Items
  // };
  let response = {
    items: jdLists.Items.map(item => {
      const { skills_question_answers, ...rest } = item;
      return rest;
    })
  };

  return {
    status: "Success",
    data: response
  };

};

const InterviewManagementAPI = async (event) => {
  await axios.post(
    `http://api.intervwd.com/messages`, {
      content: "test",
    }
  );
};

const getInterviewPrompt = async (event) => {
  let getInterviewDetailsParams = {
    TableName: "Intervwd_Interviews",
    KeyConditionExpression: "interview_id = :interview_id",
    ExpressionAttributeValues: {
      ":interview_id": event.interview_id
    }
  };
  let interview = await query_dynamo(getInterviewDetailsParams);
  if (interview.Count == 0) {
    throw new Error("Interview not found");
  }

  return interview.Items[0];
};

const getJDDetails = async (event) => {
  let getCurrentUserCreatedJD = {
    TableName: "Intervwd_Job_description",
    IndexName: "job_code-index",
    KeyConditionExpression: "job_code = :job_code",
    ExpressionAttributeValues: {
      ":job_code": event.job_code
    }
  };
  let jdLists = await query_dynamo(getCurrentUserCreatedJD);
  if (jdLists.Count == 0) {
    throw new Error("No data fou");
  }

  let response = {
    items: jdLists.Items
  };

  return {
    status: "Success",
    data: response
  };
};

export const handler = async (event) => {
  switch (event.command) {

    case "listPublicJobs":
      return await listPublicJobs(event);

    case "InterviewManagementAPI":
      return await InterviewManagementAPI(event);

    case "getInterviewPrompt":
      return await getInterviewPrompt(event);

    case "getJDDetails":
      return await getJDDetails(event);

    default:
      throw new Error("Invalid Command");
  }
};

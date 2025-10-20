//********************************* LAYERS *********************************
import crypto from "crypto";
// import constants from "./constants.mjs";
import { v4 as uuidv4 } from "uuid";

//********************************* DynamoDB *********************************
import * as dynamodb from "@aws-sdk/client-dynamodb";
import * as ddb from "@aws-sdk/lib-dynamodb";
const docClient = new dynamodb.DynamoDBClient();
const ddbDocClient = ddb.DynamoDBDocumentClient.from(docClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

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

const query_all_dynamo = async params => {
  try {
    let data = { Items: [], Count: 0 };
    const query_dynamo = async table_params => {
      let table_data = await docClient.send(new ddb.QueryCommand(params));
      if (table_data.Count > 0) {

        data.Count += table_data.Count;
        data.Items = data.Items.concat(table_data.Items);

        if (table_data.LastEvaluatedKey != undefined || table_data.LastEvaluatedKey != null) {
          table_params.ExclusiveStartKey = table_data.LastEvaluatedKey;
          return await query_dynamo(table_params);
        }
        else {
          return data;
        }
      }
      else {
        return data;
      }
    };
    return await query_dynamo(params);
  }
  catch (err) {
    console.log(params, err);
    throw new Error(err);
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

async function update_payment_details(event, razorPayResponse) {
  // let order_id = razorPayResponse.event === "order.paid" ? event.id : event.payload.payment.entity.order_id;
  let order_id = event.order_id || event.id;
  // console.log('order_id', order_id);

  let getOrderDetailsParams = {
    TableName: `Alumnye_Payment_Transactions`,
    IndexName: "order_id-index",
    KeyConditionExpression: "order_id = :order_id",
    ExpressionAttributeValues: {
      ":order_id": order_id
    }
  };

  let orderDetails = await query_dynamo(getOrderDetailsParams);
  // console.log('orderDetails', orderDetails);
  if (orderDetails.Count > 0 && orderDetails.Items[0].transaction_status !== "PAID") {
    let orderDetails_item = orderDetails.Items[0];
    let transaction_status = razorPayResponse.event === "order.paid" ? "PAID" : "FAILED";
    let updateOrderStatusParams = {
      TableName: `Alumnye_Payment_Transactions`,
      Key: {
        alumnye_id: orderDetails_item.alumnye_id,
        order_id: order_id
      },
      UpdateExpression: "Set transaction_status = :transaction_status, razor_pay_response = :razor_pay_response",
      ExpressionAttributeValues: {
        ":transaction_status": transaction_status,
        ":razor_pay_response": razorPayResponse
      }
    };
    await update_dynamo(updateOrderStatusParams);

    let getUpdatedOrderDetails = {
      TableName: `Alumnye_Payment_Transactions`,
      IndexName: "order_id-index",
      KeyConditionExpression: "order_id = :order_id",
      ExpressionAttributeValues: {
        ":order_id": order_id
      }
    };
    let updated_order_details = await query_dynamo(getUpdatedOrderDetails);

    let getUserDetailParams = {
      TableName: `Alumnye_Users`,
      KeyConditionExpression: "user_id = :user_id",
      ExpressionAttributeValues: {
        ":user_id": orderDetails_item.user_id
      }
    };

    let user_details = await query_dynamo(getUserDetailParams);
    if (user_details.Items.length > 0) {
      let user_details_item = user_details.Items[0];
      let history_type = razorPayResponse.event === "order.paid" ? "ADDITION" : "FAILED_ATTEMPT";
      let reason = razorPayResponse.event === "order.paid" ? "RECHARGE" : "FAILED_PAYMENT";
      // let credits = razorPayResponse.event === "order.paid" ? orderDetails_item.payable_amount : 0;
      // let credits = orderDetails_item.payable_amount;

      // Use credits_to_be_added from the transaction record
      let creditsToAdd = orderDetails_item.credits_to_be_added;
      if (!creditsToAdd || creditsToAdd <= 0) {
        creditsToAdd = 0
      }
      let user_credits = razorPayResponse.event === "order.paid" ?
        (user_details_item.user_credits ? user_details_item.user_credits + creditsToAdd : creditsToAdd) :
        (user_details_item.user_credits ? user_details_item.user_credits : 0);

      let createCreditHistoryParams = {
        TableName: `Alumnye_Credits_History`,
        Item: {
          ...updated_order_details.Items[0],
          alumnye_id: orderDetails_item.alumnye_id, //pk
          history_id: uuidv4(), //sk
          // default_credits: false,
          history_type: history_type,
          user_email_id: user_details_item.user_email_id,
          all_state: "GLOBAL",
          reason: reason,
          credits_created_on: new Date().getTime(),
          credits: creditsToAdd,
          user_credits_before_add: user_details_item.user_credits ? user_details_item.user_credits : 0,
          user_credits: user_credits,
          credited_by: user_details_item.user_email_id,
          error_code: razorPayResponse.event === "payment.failed" ? razorPayResponse.payload.payment.entity.error_code : null,
          error_description: razorPayResponse.event === "payment.failed" ? razorPayResponse.payload.payment.entity.error_description : null
        }
      };
      await insert_dynamo(createCreditHistoryParams);

      if (razorPayResponse.event === "order.paid") {
        let updateUserCreditsParams = {
          TableName: `Alumnyes`,
          Key: {
            alumnye_id: orderDetails_item.alumnye_id
          },
          UpdateExpression: "ADD subscription_plan_amount :subscription_plan_amount",
          ExpressionAttributeValues: {
            ":subscription_plan_amount": creditsToAdd
          }
        };
        await update_dynamo(updateUserCreditsParams);
        console.log('Credits Added Successfully!!!');
        return {
          status: "SUCCESS",
          status_message: "Credits added successfully!!"
        };
      }
      else {
        console.log('Failed Payment Logged Successfully!!!');
        return {
          status: "FAILED",
          status_message: "Payment failed and logged successfully!!"
        };
      }
    }
  }
}

const updatePaymentDetailsInCredits = async (event, razorPayResponse) => {
  let order_id = event.order_id || event.id;
  let getPaymentOrderDetailsParams = {
    TableName: `Intervwd_Payment_Transactions`,
    IndexName: "order_id-index",
    KeyConditionExpression: "order_id = :order_id",
    ExpressionAttributeValues: {
      ":order_id": order_id
    }
  };
  let orderDetails = await query_dynamo(getPaymentOrderDetailsParams);
  if (orderDetails.Count > 0) {
    if (orderDetails.Count > 0 && orderDetails.Items[0].transaction_status !== "PAID") {
      let orderDetails_item = orderDetails.Items[0];
      let transaction_status = razorPayResponse.event === "order.paid" ? "PAID" : "FAILED";
      let updateOrderStatusInPaymentParams = {
        TableName: `Intervwd_Payment_Transactions`,
        Key: {
          payment_id: orderDetails_item.payment_id
        },
        UpdateExpression: "Set payment_status = :payment_status, razor_pay_response = :razor_pay_response, transaction_modified_on = :transaction_modified_on",
        ExpressionAttributeValues: {
          ":payment_status": transaction_status,
          ":razor_pay_response": razorPayResponse,
          ":transaction_modified_on": Date.now(),
        }
      };
      await update_dynamo(updateOrderStatusInPaymentParams);

      let updateBusinessUserInMaster = {
        TableName: "Intervwd_Master",
        Key: {
          master_id: "MASTER_ID"
        },
        UpdateExpression: "ADD total_credites :total_credites, total_credits_balance_added :total_credits_balance_added, total_credits_balance_added_count :total_credits_balance_added_count",
        ExpressionAttributeValues: {
          ":total_credites": orderDetails_item.credits,
          ":total_credits_balance_added": orderDetails_item.amount,
          ":total_credits_balance_added_count": 1,
        }
      };
      await update_dynamo(updateBusinessUserInMaster);

      if (orderDetails_item.payment_source == "BUSINESS") {
        let updateOrganization = {
          TableName: "Intervwd_Organizations",
          Key: {
            organization_id: orderDetails_item.organization_id
          },
          UpdateExpression: "Set organization_credits = :organization_credits, total_credits_balance_added :total_credits_balance_added, paid_source = :paid_source",
          ExpressionAttributeValues: {
            ":organization_credits": event.credits,
            ":total_credits_balance_added": orderDetails_item.credits,
            ":paid_source": "ACTIVE"
          }
        };
        await update_dynamo(updateOrganization);
        const date = Date.now();
        let createCreditTransactionsParams = {
          TableName: 'Intervwd_Credit_Transactions',
          Item: {
            credit_transaction_id: uuidv4(),
            transaction_initiator_user_id: orderDetails_item.user_id,
            transaction_initiator_user_name: orderDetails_item.user_name,
            transaction_initiator_user_email_id: orderDetails_item.user_email_id,
            transaction_date: date,
            organization_id: orderDetails_item.organization_id,
            credits: event.credits,
            amount: event.credits,
            credit_source: "TOP_UP",
            reason: "Credits have been successfully topped up",
            transaction_status: "PENDING",
            credit_description: `Credits have been successfully topped up for user ${orderDetails_item.user_name} in Organization ${orderDetails_item.organization_name}. Amount credited: ${event.credits} credits.`
          }
        };
        await insert_dynamo(createCreditTransactionsParams);
      }
      else if (orderDetails_item.payment_source == "JOB_SEEKER") {
        let updateOrganization = {
          TableName: "Intervwd_JobSeeker_Users",
          Key: {
            user_id: orderDetails_item.user_id
          },
          UpdateExpression: "Set credits = :credits, paid_source = :paid_source",
          ExpressionAttributeValues: {
            ":credits": event.credits,
            ":paid_source": "ACTIVE"
          }
        };
        await update_dynamo(updateOrganization);
      }
    }
  }
};


export const handler = async (event) => {
  console.log("Webhook Event Received:", JSON.stringify(event));

  // if (event.event === "order.paid") {
  //   const orderDetails = event.payload.order.entity;
  //   console.log('order_paid_block_event', JSON.stringify(orderDetails));
  //   // await update_payment_details(orderDetails, event);
  // }
  // else if (event.event === "payment.failed") {
  //   console.log('payment.failed_block_event')
  //   const paymentDetails = event.payload.payment.entity;
  //   // console.log('paymentDetails', JSON.stringify(paymentDetails, null, 2));
  //   // await update_payment_details(paymentDetails, event);
  // }
  return {
    status: "ok",
    statusCode: 200,
  };
};

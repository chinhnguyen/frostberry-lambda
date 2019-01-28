const doc = require('dynamodb-doc')
const ddb = new doc.DynamoDB()
const uuidv1 = require('uuid/v1')

exports.handler = async (event) => {
    const payload = {
        TableName: "Companies"
    }
    const response = {
        statusCode: 200,
        isBase64Encoded: false,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    }

    if (event.pathParameters && event.pathParameters.id) {
        payload.Key = {
            id: event.pathParameters.id
        }
        if (event.httpMethod === 'GET') {
            const res = await ddb.getItem(payload).promise()
            if (res.Item) {
                response.body = JSON.stringify(res.Item)
            } else {
                response.statusCode = 404
            }
        } else if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body)
            Object.assign(payload, {
                UpdateExpression: "set #n = :n, address = :a, phone = :p, employees = :noe",
                ExpressionAttributeValues: {
                    ":n": body.name || "",
                    ":a": body.address || "",
                    ":p": body.phone || "",
                    ":noe": body.employees || 0
                },
                ExpressionAttributeNames: {
                    "#n": "name"
                },
                ReturnValues: "UPDATED_NEW"
            })
            await ddb.updateItem(payload).promise()
        } else if (event.httpMethod === 'DELETE') {
            await ddb.deleteItem(payload).promise()
            response.statusCode = 204
        }
    } else {
        if (event.httpMethod === 'GET') {
            const res = await ddb.scan(payload).promise()
            response.body = JSON.stringify(res.Items)
        } else if (event.httpMethod === 'PUT') {
            const id = uuidv1()
            Object.assign(payload, {
                Item: Object.assign({
                    id 
                }, JSON.parse(event.body))
            })
            await ddb.putItem(payload).promise()
            response.statusCode = 201
            response.body = JSON.stringify({id})
            
        }
    }
    return response
}

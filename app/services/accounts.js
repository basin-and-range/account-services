const exampleData = require('./data/accounts-data');

module.exports = {
  /**
  * Hi everyone.

  * @param options.createInlineReqJson.holder
  * @param options.createInlineReqJson.type

  */
  create: async (options) => {

    // Implement your business logic here...
    //
    // Return all 2xx and 4xx as follows:
    //
    // return {
    //   status: 'statusCode',
    //   data: 'response'
    // }

    // If an error happens during your business logic implementation,
    // you can throw it as follows:
    //
    // throw new Error('<Error message>'); // this will result in a 500

    var data = exampleData.create,
      status = '201';

    return {
      status: status,
      data: data
    };  
  },

  /**
  * Delete an account
  * @param options.accountNumber (Required) 

  */
  deleteAccount: async (options) => {

    // Implement your business logic here...
    //
    // Return all 2xx and 4xx as follows:
    //
    // return {
    //   status: 'statusCode',
    //   data: 'response'
    // }

    // If an error happens during your business logic implementation,
    // you can throw it as follows:
    //
    // throw new Error('<Error message>'); // this will result in a 500

    var data = exampleData.deleteAccount,
      status = '204';

    return {
      status: status,
      data: data
    };  
  },

  /**
  * Overview
  * @param options.accountNumber  

  */
  overview: async (options) => {

    // Implement your business logic here...
    //
    // Return all 2xx and 4xx as follows:
    //
    // return {
    //   status: 'statusCode',
    //   data: 'response'
    // }

    // If an error happens during your business logic implementation,
    // you can throw it as follows:
    //
    // throw new Error('<Error message>'); // this will result in a 500

    var data = exampleData.overview,
      status = '200';

    return {
      status: status,
      data: data
    };  
  },

  /**
  * Use the statement/date endpoint to retrieve the dates of the transactions
  * @param options.accountNumber  
  * @param options.dateInlineReqUrlencoded.from
  * @param options.dateInlineReqUrlencoded.to

  */
  date: async (options) => {

    // Implement your business logic here...
    //
    // Return all 2xx and 4xx as follows:
    //
    // return {
    //   status: 'statusCode',
    //   data: 'response'
    // }

    // If an error happens during your business logic implementation,
    // you can throw it as follows:
    //
    // throw new Error('<Error message>'); // this will result in a 500

    var data = exampleData.date,
      status = '200';

    return {
      status: status,
      data: data
    };  
  },

  /**
  * Use the Statement/Latest to see the account and balance of your user.
  * @param options.accountNumber  

  */
  latest: async (options) => {

    // Implement your business logic here...
    //
    // Return all 2xx and 4xx as follows:
    //
    // return {
    //   status: 'statusCode',
    //   data: 'response'
    // }

    // If an error happens during your business logic implementation,
    // you can throw it as follows:
    //
    // throw new Error('<Error message>'); // this will result in a 500
       data = {
          account: options.accountNumber,
          ...exampleData.latest
       };
      
      var status = '200'
    
      console.log("Data: ", data);

    return {
      status: status,
      data: data
    };    
  },
};

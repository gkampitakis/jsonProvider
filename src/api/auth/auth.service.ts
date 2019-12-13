// import async from 'async';


// const authenticationChain: Array<Function> = [];

// //TODO: we need one exist token function on header
// //We need to think the kinds of token tha exist
// //

// export function isAuthenticated(req, res, next) {

//   async.waterfall([(req, res, callback) => callback(req, res, next), ...authenticationChain], (error: Error) => {

//     if (error) {

//       return res.status(error.status).json({
//         status: error.status,
//         message: error.message
//       });

//     }

//     next();

//   });
// }

// // function 

class AuthenticationService {

}

export default new AuthenticationService();
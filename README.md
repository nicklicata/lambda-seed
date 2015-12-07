# http and Lambda Seed

##Node and/or Lamda seed

The 'seed' server was created to make my life easier working with AWS Lambda. The setup does 2 basic things. It gives 
you a local http server with which you can serve static files from the ./public folder or you can setup routes 
in server.js (or another file and include it) for server calls, api calls, etc.  

More importantly, there is update-lambda.js which when run from the command line will automatically:  
* copy the root node_modules folder to all 'function' folders (after deleting existing one) so you can store common files in here
* delete existing zip and then create zip files for all 'function' folder js files and node_modules folder
* upload zip files to S3 bucket
* update lambda functions with uploaded zip files

### usage
* [update-lambda.js] node update-lambda.js functions=sample-function,sample-function2,...
* [server.js] node server.js   (launches local http server, not needed for update-lambda.js)

### config - make sure to complete
* custom-config.accessKeyId - AWS access key
* custom-config.secretAccessKey - AWS secret access key
* custom-config.s3Functionbucket - AWS S3 bucket to hold zip files
* custom-config.functions - array of folder names in root that will correspond to lambda function names

### additional files to include
If you need to include other folders find 'zip.bulk([...])' and add object like below to array:  
* add folders like this object, leave it all the same just change 'FOLDER_PATH':
* {src: ["FOLDER_PATH*//**"], expand: true, cwd: __dirname + "/" + fname + "/"}    

* add files like this line, leave it all the same just change FILE_PATH, FILE_PATH can be wildcard as in '*.js':
* {src: ["FILE_PATH"], expand: true, flatten: true, cwd: __dirname + "/" + fname + "/"}


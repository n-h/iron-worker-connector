/**

USAGE:

var IronWorkerConnector = require('iron-worker-connector')({auth:'your_auth_token', project: 'your_project', 'worker': 'worker_name'});

var payload = JSON.stringify([{test:'hi'},{test:'there'}]);

IronWorkerConnector.run(payload, function(err, results) {
  if(err) {
    console.log('Error', err);
  } else {
    console.log('Results', results);
  }
});

**/

var IronWorkerConnector = function(ironio_credentials) {

  var ironio = require('node-ironio')(ironio_credentials.auth); // auth token
  var project = ironio.projects(ironio_credentials.project); // project id
  var worker_name = ironio_credentials.worker;

  // Poll IronWorker to check status of worker (queued, running, complete, error)
  var checkOnTask = function(taskId, callback) {
    // Check status
    project.tasks.info(taskId, function(err, res) {
      // Check for error
      if(err) {
        callback(new Error(err));
      } else {

        // No error, check for status in response
        if(res.status == 'complete') {

          // Task complete, get output
          project.tasks.log(taskId, function(err, res) {
            // Check for error in getting log
            if(err) {
              // Error getting log output, send error to callback
              callback(new Error(err));
            } else {
              // Success, send response back to callback
              callback(null, res);
            }
          });

        } else if(res.status == 'queued' || res.status == 'running') {
          // Task has not completed. Wait .3 seconds, and check on it again
          setTimeout(function() {
            // Run checkOnTask function again
            checkOnTask(taskId, callback);
          }, 300);
        } else {
          // Error status, send error back to callback
          callback(new Error('Task did not complete'));
        }
      }
    });
  }

  this.run = function(payload, callback, overrideWorkerName) {
    // Queue task
    if(overrideWorkerName !== undefined) {
      worker_name = overrideWorkerName;
    }
    if(typeof worker_name !== 'string') {
      return callback(new Error('worker_name not given'));
    }

    project.tasks.queue({ code_name: worker_name, payload: payload }, function(err, res) {
      // Check for error in adding to queue
      if(err) {
        // Error occurred, notify callback
        callback(err);
      } else {
        // Task queued successfully, determine taskId
        var taskId = res.tasks !== undefined && res.tasks[0] !== undefined && res.tasks[0].id !== undefined ? res.tasks[0].id : undefined;

        // See if taskId was in response
        if(taskId === undefined) {
          // taskId invalid, send error to callback
          callback(new Error('IronWorker: no task ID in queue response'));
        } else {
          // taskId is found, begin polling the status of the task to see if it has completed running
          checkOnTask(taskId, callback);
        }
      }
    });
  }
};

var LoginWrapper = function(info) {
  var errorMessage = 'iron-worker-connector requires usage: require("iron-worker-connector")({auth:"your_token", "project": "your_project", "worker": "worker_name"})';
  if(typeof info != 'object' || info.auth === undefined || info.project === undefined) {
    throw new Error(errorMessage);
  }

  return new IronWorkerConnector(info);
}

module.exports = LoginWrapper;
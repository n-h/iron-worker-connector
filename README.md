iron-worker-connector
=====================

Wrapper to connect to IronWorker

####USAGE:

```
var IronWorkerConnector = require('iron-worker-connector')({auth:'your_auth_token', project: 'your_project', 'worker': 'worker_name'});

var payload = JSON.stringify([{test:'hi'},{test:'there'}]);

IronWorkerConnector.run(payload, function(err, results) {
	if(err)	{
		console.log('Error', err);
	} else {
		console.log('Results', results);
	}
});
```
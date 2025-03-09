const express = require("express");
const cors = require('cors');
const app = express();
const port = 80;
var exec = require('child_process').exec;

app.use(cors());
app.use(express.json());

app.get("/api/test", function (req, res) {

	res.send("4610 Schenanigans!!!!");

});

app.post("/api/bruh", function (req, res) {
	

	console.log(req.body);	

	const command = "powershell C:\\4610\\devops_backend\\devops\\push.ps1"
	exec(command, (err,output) => {

		if (err) {
			console.error("Brotha failed: ", err);
			return;
		}

		console.log("Brotha said: ", output);

		
	});
	
	res.status(200).send('Success');

	return; 
});


app.listen(port, '0.0.0.0', function() {});
console.log("Listening on ", port);

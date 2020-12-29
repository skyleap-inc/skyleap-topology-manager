const express = require('express');
const app = express();

app.use(express.static('public'));
app.use('/public', express.static('public'));

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.listen(80, function () {
  console.log('Topology app listening on port 80.');
})
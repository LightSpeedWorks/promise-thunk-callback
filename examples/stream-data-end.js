const fs = require('fs');
const readableStream = fs.createReadStream(__filename);
readableStream.on('data', function(data) {
	console.log('data:', data.toString().substr(0, 100)
		.replace(/\r/g, '\\r')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
	);
});
readableStream.on('end', function() {
	console.log('end');
});
// readableStream.read([size])
// http://qiita.com/takaaki7/items/fbc33dff1e17fe6a3d38

// w.write(chunk[,encoding][,callback])
// w.end([chunk][,encoding][,callback])
// x.pipe(w, {end?:true}?) : Writable w
// r.on('data', data => void)
// r.on('error', err => void)
// r.on('end', () => void)
// x.on('close', () => void)

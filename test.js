console.log('process.NODE_ENV ',process.env.NODE_ENV )
console.log('__dirname', __dirname)
console.log('__filename', __filename)
console.log('cwd', process.cwd())
const abPath = 'github/' + __dirname.split('/').pop();
console.log('p', abPath)

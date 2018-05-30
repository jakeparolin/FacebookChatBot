const APP = require('./app')
const PORT = process.env.PORT || 1337

APP.listen(PORT, () => console.log('webhook is listening on port: ' + port));
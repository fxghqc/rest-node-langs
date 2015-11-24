var koa = require('koa');
var cors = require('kcors');
var router = require('koa-router')();
var koaBody = require('koa-body')({multipart:true});

var os = require('os');
var path = require('path');
var fs = require('co-fs');
var parse = require('co-busboy');
var saveTo = require('save-to');

var app = koa();
app.use(cors());

var r = require('rethinkdb');
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;
});

function getLangs(callback) {
  r.db('profiler').table('workspaces').run(connection, function(err, cursor) {
    if (err) throw err;
    cursor.toArray(function(err, result) {
      if (err) throw err;
      callback(/* error: */ null, result);
    });
  });
}

function insertLang(callback) {

}

router
  .get('/', function *(next) {
    this.body = yield { message: 'Hello World!' };
  })
  .get('/workspaces', function *(next) {
    this.body = yield getLangs;
  })
  .post('/workspaces', koaBody, function *(next) {
    var newLang = this.request.body; 
    var result = yield r.db('profiler').table('workspaces').insert(newLang, {returnChanges: true}).run(connection);
    this.body = result.changes[0].new_val;
  })
  .get('/workspaces/:id', function *(next) {
    var id = this.params.id;
    var result = yield r.db('profiler').table('workspaces').get(id).run(connection);
    this.body = result;
  })
  .put('/workspaces/:id', koaBody, function *(next) {
    var lang = this.request.body; 
    var id = this.params.id;
    var result = yield r.db('profiler').table('workspaces').get(id).update(lang, {returnChanges: true}).run(connection);
    console.log(result);
    if (result.unchanged === 1) {
      this.body = lang;
    } else {
      this.body = result.changes[0].new_val;
    }
  })
  .del('/workspaces/:id', function *(next) {
   var id = this.params.id;
   var result = yield r.db('profiler').table('workspaces').get(id).delete().run(connection);
   this.body = '';
  })
  .post('/upload', function *(next) {
    // parse the multipart body
    var parts = parse(this, {
      autoFields: true // saves the fields to parts.field(s)
    });

    // create a temporary folder to store files
    var uid = Math.random().toString(36).slice(2);
    var tmpdir = path.join(os.tmpdir(), uid);
    
    // make the temporary directory
    yield fs.mkdir(tmpdir);

    // list of all the files
    var files = [];
    var file;

    // yield each part as a stream
    var part;
    while ((part = yield parts) || false) {
      // filename for this part
      console.log('save file: ' + part.filename);
      files.push(file = path.join(tmpdir, part.filename));
      // save the file
      yield saveTo(part, file);
    }

    // return all the filenames as an array
    // after all the files have finished downloading
    this.body = files; 
  });

app
  .use(router.routes())
  .use(router.allowedMethods());

app.listen(5000);

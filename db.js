r = require('rethinkdb')
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
  if(err) throw err;
  r.dbCreate('profiler').run(conn, function() {
    r.db('profiler').tableCreate('workspaces').run(conn, function(err, res) {
      if(err) throw err;
      console.log(res);
      r.db('profiler').table('workspaces').insert([
       { name: '工作空间1' },
       { name: '工作空间2' },
       { name: '工作空间3' },
       { name: 'workspaces1' },
       { name: 'workspaces2' },
       { name: 'workspaces3' },
       { name: 'workspaces4' }
     ]).run(conn, function(err, res) {
       if(err) throw err;
       console.log(res);
     });
   });
  } 
)});

module.exports = function(app, urlencodedParser, mongo, session, fs, io){

	app.use(session({secret:'secret'}));

	var url = 'mongodb://varun:password@ds115352.mlab.com:15352/chat';
	var u_name, u_user, u_email, u_pass, u_addr;
	var events = require('events');
	var eventEmitter = new events.EventEmitter();
	eventEmitter.setMaxListeners(200);

	app.get('/',(req,res)=>{

		res.render(__dirname + '/views/home');
		if(!req.session.user_email){

		} else{
			io.on('connection',(socket)=>{
				socket.emit('loggedin');
			});
		}
	});

	app.get('/aboutus',(req,res)=>{
		
		res.render(__dirname + '/views/aboutus');
		if(!req.session.user_email){
			
		} else{
			io.on('connection',(socket)=>{
				socket.emit('loggedin');
			});
		}
	});

	app.get('/logout',(req,res)=>{
		req.session.destroy();
		io.on('connection',(socket)=>{
				socket.emit('loggedout');
			});
		res.redirect('/');
	});

	app.get('/books/:id',(req,res)=>{

		res.render(__dirname + '/views/bookdetail' + req.params.id);
		if(!req.session.user_email){

		} else{
			io.on('connection',(socket)=>{
				socket.emit('loggedin');
			});
		}
	});

	app.get('/download/:id',(req,res)=>{

		res.download(__dirname + '/views/user_downloads/' + req.params.id);
		if(!req.session.user_email){

			} else{
			io.on('connection',(socket)=>{
				socket.emit('loggedin');
			});
		}
	});

	app.get('/download/files',(req,res)=>{

		fs.readdir(__dirname + '/views/user_downloads/files/' + u_user, (err,files)=>{
			fs.createWriteStream(__dirname+'/views/user_downloads/files/' + u_user + '/' +req.query.filename).write(req.query.textnotes);
			res.redirect('/signin');
			io.on('connection',(socket)=>{
				socket.emit('newfile',JSON.stringify(files));
			});
		});
	});

	app.get('/files/:id',(req,res)=>{
		console.log(req.params.id);
		res.download(__dirname + '/views/user_downloads/files/' + u_user + '/' +req.params.id);	
	});

	app.get('/contact',(req,res)=>{

		res.render(__dirname + '/views/contact');
		if(!req.session.user_email){

			} else{
			io.on('connection',(socket)=>{
				socket.emit('loggedin');
			});
		}

		mongo.connect(url, (err,db)=>{
			if(err) throw err;

			db.collection('firstbookquery').insertOne({Name: req.query.name, Email: req.query.email, Message: req.query.mess}, (err,result)=>{
				if(err) throw err;
			});
		})
	});


	app.get('/signup',(req,res)=>{

		res.render(__dirname + '/views/signup');
		if(!req.session.user_email){

			} else{
			res.redirect('/signin');	
		}
	});

	app.post('/reguser', urlencodedParser, (req,res)=>{
		mongo.connect(url, (err,db)=>{
			if(err) {
				throw err;
			}

			db.collection('firstbookusers').find({Email: req.body.email2}).toArray((err,result)=>{
				if(err){
				 	throw err;
				}
				console.log(result);
				if(result.length>0){
						res.redirect('/signup');
				} else {
					db.collection('firstbookusers').insertOne({Name: req.body.name, Username: req.body.username, Email: req.body.email2, Password: req.body.password2, Address: req.body.address},(err,result)=>{
						if(err) throw err;

						console.log('data added');
						fs.mkdir(__dirname + '/views/user_downloads/files/' + u_user,(err)=>{

							res.redirect('/');
						});
					});
				}
			});
		});
	})

	app.get('/signin',(req,res)=>{

		if(!req.session.user_email){
			res.redirect('/');
		} else {
		
			fs.readdir(__dirname + '/views/user_downloads/files/' + u_user, (err,files)=>{
				if(err) throw err;
		
				io.on('connection',(socket)=>{
					socket.emit('newfile',JSON.stringify(files));
				});
				res.render(__dirname + '/views/login',{username:u_user, uemail:u_email});
			});
		}
	});

	app.post('/signin',urlencodedParser,(req,res)=>{

		mongo.connect(url, (err,db)=>{
			if(err) throw err;

			db.collection('firstbookusers').find({Email: req.body.username, Password: req.body.password}).toArray((err,result)=>{
				if(err) throw err;

				if(result.length===0){

						res.redirect('/signin');
				} else if(result.length>0){
						
					req.session.user_email = req.body.username;
					req.session.user_pass = req.body.password;
					u_user=result[0].Username;
					u_email=result[0].Email;
					u_addr=result[0].Address;
					u_name=result[0].Name;
					u_pass=result[0].Password;

					fs.mkdir(__dirname + '/views/user_downloads/files/' + u_user, (err)=>{

						if(err){

							fs.readdir(__dirname + '/views/user_downloads/files/' + u_user, (err,files)=>{
								if(err) throw err;
						
								io.on('connection',(socket)=>{
									socket.emit('newfile',JSON.stringify(files));
								});
								res.render(__dirname + '/views/login',{username:u_user, uemail:u_email});
							});
						} else{
						res.render(__dirname + '/views/login',{username:u_user, uemail:u_email});
						}
					})
				}

			});
		});

		io.on('connection',(socket)=>{

			socket.on('emailchange',(data)=>{
			
				mongo.connect(url, (err,db)=>{
					if(err) throw err;

					db.collection('firstbookusers').updateOne({Email: req.session.user_email}, {Name:u_name, Username:u_user, Email: data, Password:req.session.user_pass, Address:u_addr }, (err,result)=>{
						if(err) throw err;	
					
						req.session.user_email = data;
						u_email = data;
						console.log('updated email');
					});
				});
			});

			socket.on('passchange',(data)=>{
				
				if(req.session.user_pass == data.pass1 && data.pass2 == data.pass3){
				
					mongo.connect(url, (err,db)=>{
						if(err) throw err;

						db.collection('firstbookusers').updateOne({Email: req.session.user_email, Password: data.pass1}, {Name:u_name, Username:u_user, Email: req.session.user_email,Password: data.pass2, Address:u_addr}, (err,result)=>{
							if(err) throw err;

							req.session.user_pass = data.pass2;
							u_pass = data.pass2;
							console.log('updatedpasss');
						});
					});
				} 
			}); 
		});
	});
}
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const app = require('express')()

admin.initializeApp();


const firebase = require('firebase');
//firebase.initializeApp();

//Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const config = {
  apiKey: "AIzaSyA_6SElcQG6yW5QWf3Alf-jd8VJOpZKtWM",
  authDomain: "socialape-7fb71.firebaseapp.com",
  databaseURL: "https://socialape-7fb71.firebaseio.com",
  projectId: "socialape-7fb71",
  storageBucket: "socialape-7fb71.appspot.com",
  messagingSenderId: "940972659583",
  appId: "1:940972659583:web:4e939d6aaa07d14ff5004a",
  measurementId: "G-CHZ8TL9DWG"
};

// Initialize Firebase
firebase.initializeApp(config);

const db = admin.firestore();


app.get('/screams',(req,res)=>{
    db
    .collection('screams')
    .orderBy('createdAt','desc')
    .get()
    .then(
        (data) =>{
            let screams = [];
            data.forEach((doc) =>{
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
            });
           return res.json(screams); 
        })
        .catch((err) => console.log(err));
})



app.post('/scream',(req,res)=>{  
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };
    db
    .collection('screams')
    .add(newScream)
    .then((doc)=>{
        res.json({message:`document ${doc.id} created successfully`})
    })
    .catch((err)=>{
        res.status(500).json({error:'something went wrong'})
        console.log(err)
    })
});

//Sign up rout
app.post('/signup',(req,res)=>{
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
        //ToDo validate data
    };

    let token,userId;

    db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc =>{
       if(doc.exists){
            return res.status(400).json({handle:'this handle is already taken'})
       } else{
           return firebase.auth()
           .createUserWithEmailAndPassword(newUser.email,newUser.password)
       }
    }).then(
       data =>{
           //here we use a token 
           userId = data.user.uid;
           return data.user.getIdToken();
    }).then(
        token =>{
            token = token
            const userCredentials = {
              handle: newUser.handle,
              email: newUser.email,
              createdAt: new Date().toISOString(),
              userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
    }).then(
        () =>{
            return res.status(201).json({token})
        }

    )
    .catch(err=>{
        console.log(err)
        if (err.code ==="auth/email-already-in-use"){
            return res.status(400).json({email:'Email is alreay in use'})
        }else{
            return res.status(500).json({error:err.code})
        }
    })

})

exports.api = functions.https.onRequest(app);

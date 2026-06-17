const express=require('express');
const bodyParser=require('body-parser');
const multer=require('multer');
const fetch=require('node-fetch');
const app=express();
const upload=multer({storage:multer.memoryStorage()});
app.use(bodyParser.json({limit:'5mb'}));
app.use(express.static('public'));
let logs=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));

app.get('/logs',(req,res)=>res.json(logs));

app.post('/send-bulk', upload.none(), async (req,res)=>{
 const {apiKey,amount,reference,callbackUrl,numbers}=req.body;
 const phones=(numbers||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 const results=[];
 for(const phone of phones){
  try{
   const r=await fetch('https://sunpay.app/api/v1/payments/stk-push',{
    method:'POST',
    headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({phoneNumber:phone,amount:Number(amount),externalRef:reference,callbackUrl})
   });
   const text=await r.text();
   const item={phone,status:r.ok?'SUCCESS':'FAILED',httpStatus:r.status,response:text,time:new Date().toISOString()};
   logs.push(item); results.push(item);
  }catch(e){
   const item={phone,status:'FAILED',error:e.message,time:new Date().toISOString()};
   logs.push(item); results.push(item);
  }
  await delay(2000);
 }
 res.json(results);
});

app.listen(process.env.PORT||3000);

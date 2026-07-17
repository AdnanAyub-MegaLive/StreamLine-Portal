const { createHmac, timingSafeEqual } = require("node:crypto");

const secret = () => {
  if (!process.env.AUTH_SECRET) throw new Error("AUTH_SECRET is required for mobile sessions.");
  return process.env.AUTH_SECRET;
};
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const signature = (body) => createHmac("sha256", secret()).update(body).digest("base64url");

function createMobileSessionToken(user) {
  const body=encode({userId:user.publicId,sessionVersion:user.sessionVersion,exp:Math.floor(Date.now()/1000)+60*60*24*30});
  return `${body}.${signature(body)}`;
}

function verifyMobileSessionToken(token) {
  const [body,supplied]=String(token||"").split(".");
  if(!body||!supplied)throw new Error("INVALID_SESSION_TOKEN");
  const expected=signature(body);
  const a=Buffer.from(supplied); const b=Buffer.from(expected);
  if(a.length!==b.length||!timingSafeEqual(a,b))throw new Error("INVALID_SESSION_TOKEN");
  const payload=JSON.parse(Buffer.from(body,"base64url").toString("utf8"));
  if(!payload.userId||!Number.isInteger(payload.sessionVersion)||payload.exp<=Math.floor(Date.now()/1000))throw new Error("EXPIRED_SESSION_TOKEN");
  return payload;
}

module.exports={createMobileSessionToken,verifyMobileSessionToken};

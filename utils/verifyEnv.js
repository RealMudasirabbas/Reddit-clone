function verifyEnv() {
  const envVars = [
    "DATABASE_URL",
    "DIRECT_URL",
    "PORT",
    "JWT_SECRET",
    "RESEND_API_KEY",
    "FRONTEND_URL",
  ];
  const missingVars = [];
  envVars.forEach((val) => {
    if(!process.env[val]){
      missingVars.push(val)
    }
  })
  if (missingVars.length > 0) {
    console.log("missing variables",missingVars)
    process.exit(1);
  }
  return;
}

export default verifyEnv;
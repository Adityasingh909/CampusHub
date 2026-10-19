const bcrypt  = require("bcryptjs")

async function main() {
    const pass = "aditya"

    const hashed  = await bcrypt.hash(pass,10)

    console.log(pass);
    console.log(hashed);
    const c = await bcrypt.compare(pass, hashed);
    if(c){
          console.log("Correct password");
    }
    
}


main().catch(console.error);
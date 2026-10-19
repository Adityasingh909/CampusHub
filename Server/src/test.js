
// const prisma = require("./config/prisma");

// async function main() {
//   const user = await prisma.user.create({
//     data: {
//       name: "Test2",
//       email: "test2@example.com",
//       password: "aaa",
//     },
//   });

//   console.log("Created user:", user);

//   const users = await prisma.user.findMany();
//   console.log("All users:", users);
// }


// main()
//   .catch(console.error)
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

const jwt = require("jsonwebtoken")

// const token = jwt.sign(
//     {
//         userID:4,
//         name:"aditya"
//     },
//     "adityajwt1",
//     {
//         expiresIn:"1h"
//     }
// )
// console.log("token: ",token);

// const decoded = jwt.verify(token,"adityajwt");
// console.log("verified payload: ",decoded);


try {
  const modifiedPayload = {
    userId: 4,
    role: "ADMIN",
  };

  const forgedToken = jwt.sign(
    modifiedPayload,
    "a-different-secret",
    { expiresIn: "1h" }
  );

  jwt.verify(forgedToken, "adityajwt");
} catch (error) {
  console.log("Token rejected:", error.message);
}
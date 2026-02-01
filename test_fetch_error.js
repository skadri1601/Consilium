
async function test() {
  try {
    await fetch("http://localhost:45678"); // Random port
  } catch (error) {
    console.log("Error constructor name:", error.constructor.name);
    console.log("Instance of TypeError:", error instanceof TypeError);
    console.log("Instance of Error:", error instanceof Error);
    console.log("Error message:", error.message);
    if (error.cause) {
      console.log("Error cause:", error.cause);
      console.log("Cause constructor:", error.cause.constructor.name);
    }
  }
}
test();

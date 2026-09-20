import { ApiClient } from "./apiClient.js";
import { usersEndpoints, type IUser } from "./users.js";
import { ApiHttpError, ApiValidationError } from "./errors.js";

const client = new ApiClient({
  baseURL: "https://jsonplaceholder.typicode.com",
  headers: { "X-Client": "hw6-demo" },
});

const users: IUser[] = await client.get(usersEndpoints.list.path, usersEndpoints.list, {
  _limit: 2,
});
console.log("1. OK:", users.map((u) => u.name).join(", "));

await client.get("/users/3", usersEndpoints.byId, { _limit: 1 });
const user = await client.get("/users/3", usersEndpoints.byId);
console.log("2. OK:", user.name, "—", user.company.name);

try {
  await client.get("/users/999", usersEndpoints.byId);
} catch (err) {
  if (err instanceof ApiHttpError) {
    console.log("3. ApiHttpError:", err.status, JSON.stringify(err.details));
  } else {
    throw err;
  }
}

try {
  await client.get(usersEndpoints.list.path, usersEndpoints.list, { _limit: -1 });
} catch (err) {
  if (err instanceof ApiValidationError) {
    console.log(
      "4. ApiValidationError:",
      err.zodError.issues.map((i) => i.message).join("; "),
    );
  } else {
    throw err;
  }
}

const check = users;
console.log("5. EndpointResponse<typeof usersEndpoints.list> is array:", Array.isArray(check));

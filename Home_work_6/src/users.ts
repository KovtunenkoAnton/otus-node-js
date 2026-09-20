import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  phone: z.string(),
  website: z.string(),
  address: z.object({
    street: z.string(),
    suite: z.string(),
    city: z.string(),
    zipcode: z.string(),
    geo: z.object({ lat: z.string(), lng: z.string() }),
  }),
  company: z.object({
    name: z.string(),
    catchPhrase: z.string(),
    bs: z.string(),
  }),
});

export interface IUser extends z.infer<typeof userSchema> {};

export const usersQuerySchema = z.object({
  _limit: z.number().int().positive().optional(),
  _page: z.number().int().positive().optional(),
});

export const usersEndpoints = {
  list: {
    path: "/users",
    querySchema: usersQuerySchema,
    responseSchema: z.array(userSchema),
  },
  byId: {
    path: "/users/:id",
    responseSchema: userSchema,
  },
};

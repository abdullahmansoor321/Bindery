import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "bindery",
  isDev: process.env.NODE_ENV !== "production",

});


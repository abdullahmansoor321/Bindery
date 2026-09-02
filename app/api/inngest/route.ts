import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { embedPageOnSave } from "@/lib/inngest/functions";

export const runtime = "nodejs"; // required — @xenova/transformers needs Node, not Edge

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [embedPageOnSave],
});
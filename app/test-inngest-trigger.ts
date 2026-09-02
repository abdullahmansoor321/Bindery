import { inngest } from "@/lib/inngest/client";

async function main() {
  await inngest.send({
    name: "page/content.saved",
    data: {
      pageId: "test-page-123",
      text: "Environment variables are managed in .env.local",
    },
  });

  console.log("Event sent successfully!");
}

main().catch(console.error);
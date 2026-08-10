"use client";
import { createWorkspace } from "@/app/actions/workspace";

export default function TestPage() {
  return (
    <button onClick={() => createWorkspace("Acme Test").then(console.log)}>
      Create Test Workspace
    </button>
  );
}
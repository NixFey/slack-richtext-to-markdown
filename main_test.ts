import { assertEquals } from "@std/assert";
import { richtextToMarkdown } from "./main.ts";
import input from "./rich_text_sample.json" with {type: "json"};
import { RichTextBlock } from "npm:@slack/types";

Deno.test(function overallTest() {
  const expected = (input as RichTextBlock & {expected_output: string}).expected_output;
  assertEquals(richtextToMarkdown(input as RichTextBlock), expected);
});

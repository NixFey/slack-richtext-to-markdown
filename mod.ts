/**
 * A helper library to convert Slack's proprietary RichText format to normal markdown.
 *
 * @example
 * ```ts
 * import richtextToMarkdown from "@nixfey/slack-richtext-to-markdown";
 *
 * function parseSlackText() {
 *     console.log(richtextToMarkdown({type: "rich_text", elements: []}));
 * }
 * ```
 * @module
 */

import type { RichTextBlock, RichTextBlockElement, RichTextList, RichTextElement, RichTextStyleable, RichTextEmoji, RichTextUserMention, RichTextUsergroupMention } from "npm:@slack/types@^2.0.0";

function backtickSurround(input: string): string {
  return "`" + input + "`";
}

function styleToMarkdown(input: string, style: RichTextStyleable["style"]): string {
  if (!style) return input;

  let output = input;

  if (style.code) output = `\`${output}\``;
  if (style.bold) output = `**${output}**`;
  if (style.italic) output = `*${output}*`;
  if (style.strike) output = `~~${output}~~`;

  return output;
}

function elementToMarkdown(el: RichTextElement): string {
  switch (el.type) {
    case "broadcast":
      return backtickSurround(el.range);
    case "color":
      return backtickSurround("#" + el.value);
    case "channel":
      return backtickSurround(el.channel_id);
    case "date":
      // TODO: Should use the format Slack tells us to use
      return new Intl.DateTimeFormat().format(el.timestamp);
    case "emoji":
      {
        const emoji = el as RichTextEmoji;
        if (emoji.unicode) return String.fromCodePoint(parseInt(emoji.unicode, 16));
        return backtickSurround(`:${emoji.name}:`);
      }
    case "link":
      return styleToMarkdown(`[${el.text}](${el.url})`, el.style);
    case "team":
      return backtickSurround(el.team_id);
    case "text":
      return styleToMarkdown(el.text, el.style);
    case "user":
      return backtickSurround((el as RichTextUserMention).user_id);
    case "usergroup":
      return backtickSurround((el as RichTextUsergroupMention).usergroup_id);
  }
}

function blockToMarkdown(input: RichTextBlockElement): string {
  switch (input.type) {
    case "rich_text_section":
      return input.elements.map(elementToMarkdown).join(" ");
    case "rich_text_list":
      {
        const list = input as RichTextList;
        if (list.style === "bullet") {
          return list.elements.map(el => `${" ".repeat((list.indent ?? 0) * 2)}- ${blockToMarkdown(el)}`).join("\n");
        } else if (list.style === "ordered") {
          return list.elements.map(el => `${" ".repeat((list.indent ?? 0) * 2)}- ${blockToMarkdown(el)}`).join("\n");
        } else {
          throw new Error(`Got unexpected list type ${list.style}`)
        }
      }
    case "rich_text_quote":
      return "> " + input.elements.map(elementToMarkdown).join("")
    case "rich_text_preformatted":
      return "```\n" + input.elements.map(elementToMarkdown).join("") + "\n```";
  }
}

export function richtextToMarkdown(input: RichTextBlock): string {
  if (input.type !== "rich_text") throw new Error("Got unexpected input converting rich text to markdown");

  return input.elements.map(blk => (blk.type === "rich_text_list" && (blk.indent ?? 0) > 0 ? "" : "\n") + blockToMarkdown(blk)).join("\n").trim();
}

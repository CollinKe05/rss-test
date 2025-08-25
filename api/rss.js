// server.js
import express from "express";
import got from "got";
import * as cheerio from "cheerio";

const app = express();

app.get("/rss/scut/ft/jwtz", async (req, res) => {
  const base = "https://www2.scut.edu.cn";
  const listUrl = `${base}/ft/jwtz/list.htm`;
  const html = await got(listUrl).text();
  const $ = cheerio.load(html);

  const items = [];
  $("li").each((_, li) => {
    const $li = $(li);
    const a = $li.find("a").first();
    if (!a.length) return;

    const title = a.text().trim();
    const href = a.attr("href") || "";
    const link = href.startsWith("http") ? href : new URL(href, listUrl).toString();

    // 抓 li 文本中的日期（YYYY-MM-DD）
    const text = $li.text().replace(/\s+/g, " ").trim();
    const m = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    const pubDate = m ? new Date(m[1]).toUTCString() : new Date().toUTCString();

    items.push({ title, link, pubDate });
  });

  const feedTitle = "华南理工大学 未来技术学院 - 教务通知";
  const rssItems = items.slice(0, 20).map(it => `
    <item>
      <title><![CDATA[${it.title}]]></title>
      <link>${it.link}</link>
      <guid>${it.link}</guid>
      <pubDate>${it.pubDate}</pubDate>
    </item>`).join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${feedTitle}</title>
  <link>${listUrl}</link>
  <description>${feedTitle}</description>
  <language>zh-CN</language>
  ${rssItems}
</channel>
</rss>`;

  res.set("Content-Type", "application/rss+xml; charset=utf-8");
  res.send(rss);
});

app.listen(3000, () => console.log("RSS server running at http://localhost:3000/rss/scut/ft/jwtz"));

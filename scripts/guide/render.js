const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [f, out] of [["owner.html", "BossCall_사장님_안내장.pdf"], ["driver.html", "BossCall_기사님_안내장_Indonesia.pdf"]]) {
    await p.goto("file://" + process.cwd() + "/" + f);
    await p.waitForTimeout(300);
    const h = await p.evaluate(() => [document.querySelector(".page").scrollHeight, document.querySelector("main").scrollHeight, document.querySelector("main").clientHeight]);
    console.log(f, "page/main scroll/client", h);
    await p.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true });
    await p.setViewportSize({ width: 794, height: 1123 });
    await p.screenshot({ path: out.replace(".pdf", ".png"), fullPage: false });
  }
  await b.close();
})();

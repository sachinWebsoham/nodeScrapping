// const http = require("http");
// const https = require("https");
// const cheerio = require("cheerio");
// const fetch = require("node-fetch");
// const express = require("express");
import http from "http";
import https from "https";
import cheerio from "cheerio";
import fetch from "node-fetch";
import express from "express";

const app = express();

const crawlbaseToken = "bH4vj0qbYFa0Ccc0cAp54w"; // Replace with your actual token
const auth = `Basic ${Buffer.from(crawlbaseToken).toString("base64")}`;
const proxyUrl = "http://smartproxy.crawlbase.com:8012";

const MAX_REQUESTS_PER_MINUTE = 60; // Adjust as needed
let requestsMade = 0;
let lastRequestTime = 0;

async function fetchDomains() {
  try {
    let domainsArr = [];
    let startBy = -1;

    for (let index = 0; index < 1; index++) {
      await throttleRequests(); // Enforce rate limit

      startBy = startBy + 200;
      const someHost = `https://member.expireddomains.net/domains/combinedexpired/?start=${startBy}&flast90d=1&flimit=200&#listing`;

      const init = {
        method: "GET",
        headers: {
          authority: "member.expireddomains.net",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          cookie:
            "ExpiredDomainssessid=Z9uy5MSzCkaW7nQ-tLyrM5eGpzQA2motIrI9Fp9Jl0s3yJSwHIcPHjHLzkNM5ppqhZLmKYbSQMNgdiSwu7frkKum1MtsSr3qUHTj1SZ8HJErtF4UiEsSgbgFAz2sdKU1",
          referer: "https://member.expireddomains.net/domains/combinedexpired/",
          "sec-ch-ua":
            '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        agent: new https.Agent({
          proxy: proxyUrl,
          auth: auth,
        }),
      };

      const response = await fetch(someHost, init);
      const results = await response.text();
      //   domainsArr.push(results);

      const $ = cheerio.load(results);
      const tr = $(".base1>tbody>tr");
      console.log(tr.length, "tr.length");

      tr.each((index, element) => {
        const creationDate = $(element)
          .find(".field_creationdate a")
          .attr("title");
        const aby = $(element).find(".field_abirth a").attr("title");
        const acr = $(element).find(".field_aentries a").attr("title");

        const DomainDetail = {
          domain_link: $(element).find(".namelinks").text(),
          domain_length: $(element).find(".field_length").text(),
          domain_backlinks: $(element).find(".bllinks").text(),
          domain_pop: $(element).find(".field_domainpop a").text(),
          domain_creationDate: creationDate,
          domain_ABY: aby,
          domain_ACR: acr,
          domain_MMGR: $(element).find(".field_majestic_globalrank a").text(),
          domain_DMOZ: $(element).find(".field_dmoz").text(),
          domain_reg: $(element).find(".field_statustld_registered a").text(),
          domain_status_com: $(element).find(".field_statuscom a span").text(),
          domain_status_net: $(element).find(".field_statusnet a span").text(),
          domain_status_org: $(element).find(".field_statusorg a span").text(),
          domain_status_biz: $(element).find(".field_statusbiz a span").text(),
          domain_status_info: $(element)
            .find(".field_statusinfo a span")
            .text(),
          domain_status_de: $(element).find(".field_statusde a span").text(),
          domain_addDate: $(element).find(".field_adddate").text(),
          domain_related_cnobi: $(element).find(".field_related_cnobi").text(),
          domain_wikipedia_links: $(element)
            .find(".field_wikipedia_links")
            .text(),
          domain_dropped: $(element).find(".field_changes").text(),
          domain_whois_status: $(element).find(".field_whois a").text(),
        };

        // Save the extracted data
        domainsArr.push({ DomainDetail: DomainDetail });
      });
      return domainsArr;
    }

    // console.log(JSON.stringify(domainsArr));
  } catch (e) {
    console.error("Error fetching domains:", e);
  }
}

async function throttleRequests() {
  const currentTime = Date.now();
  const timeSinceLastRequest = currentTime - lastRequestTime;

  if (requestsMade >= MAX_REQUESTS_PER_MINUTE && timeSinceLastRequest < 60000) {
    console.log("Rate limit reached, waiting...");
    await new Promise((resolve) =>
      setTimeout(resolve, 60000 - timeSinceLastRequest)
    );
  }

  requestsMade++;
  lastRequestTime = currentTime;
}

app.get("/", async (req, res) => {
  try {
    fetchDomains()
      .then((result) => {
        console.log(result, "result by then");
        // console.log(domainsArr.length, "..........");
        res.json(result);
      })
      .catch((err) => {
        console.log(err, "error by catch");
        res.json(err.message);
      });
    // res.json(domainsArr); // Send the fetched domains as JSON response
  } catch (e) {
    console.error("Error fetching domains:", e);
    res.status(500).json({ error: "Failed to fetch domains" });
  }
});

app.listen(3500, () => {
  console.log("connected");
});

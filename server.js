import express from "express";
import axios from "axios";
import cheerio from "cheerio";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.get("/:ticker", async (req, res) => {
  const { ticker } = req.params;
  const { key } = req.query;

  if (!ticker || !key) {
    return res.status(400).send({ message: "enter a key and a ticker!" });
  }

  // const { data } = await axios.get(
  //   "https://finance.yahoo.com/quote/MRNA/key-statistics?p=MRNA"
  // );

  // const $ = cheerio.load(data);

  // return res.send($('section[data-test="qsp-statistics"] > div:nth-child(2)').html());

  try {
    const stockInfo = await Promise.all(
      ["key-statistics", "history"].map(async (type) => {
        const url = `https://finance.yahoo.com/quote/${ticker}/${type}?p=${ticker}`;

        const { data } = await axios.get(url);
        const $ = await cheerio.load(data);

        if (type === "history") {
          const prices = $("td:nth-child(6)")
            .get()
            .map((v) => $(v).text());

          return { prices };
        }

        if (type === "key-statistics") {
          const metrics = [
            "Market Cap (intraday)",
            "Trailing P/E",
            "Forward P/E",
            "PEG Ratio (5 yr expected)",
            "Price/Sales (ttm)",
            "Price/Book (mrq)",
            "Enterprise Value/Revenue",
            "Enterprise Value/EBITDA",
            "Shares Outstanding5",
            "Profit Margin",
            "Operating Margin (ttm)",
            "Return on Assets (ttm)",
            "Return on Equity (ttm)",
            "Revenue (ttm)",
            "Revenue Per Share (ttm)",
            "Quarterly Revenue Growth (yoy)",
            "Gross Profit (ttm)",
            "EBITDA",
            "Net Income Avi to Common (ttm)",
            "Quarterly Earnings Growth (yoy)",
            "Total Cash (mrq)",
            "Total Debt (mrq)",
            "Total Debt/Equity (mrq)",
            "Operating Cash Flow (ttm)",
          ];

          const stats = $(
            'section[data-test="qsp-statistics"] > div:nth-child(2) tr'
          )
            .get()
            .map((v) => $(v).text())
            .reduce((acc, curr) => {
              const includedCheck = metrics.reduce((acc, curr2) => {
                if (acc === true) return true;

                return curr.includes(curr2);
              }, false);

              if (includedCheck) {
                const title = metrics.reduce((acc, curr2) => {
                  if (curr.includes(curr2)) {
                    return curr2;
                  } else {
                    return acc;
                  }
                }, "");

                return { ...acc, [title]: curr.replace(title, "") };
              } else {
                return acc;
              }
            }, {});

          return { stats };
        }
      })
    );

    res.send({
      data: stockInfo.reduce((acc, curr) => {
        return { ...acc, [Object.keys(curr)[0]]: Object.values(curr)[0] };
      }, {}),
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server started at: http://localhost:${PORT}`);
});

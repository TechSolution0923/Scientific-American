import puppeteer from "puppeteer";
import {writeFileSync} from "fs";
import {parse} from 'json2csv';

const saveAsCSV = (csvData) => {
    const csv = parse(csvData)
    writeFileSync('result.csv', csv);
}

const getQuotes = async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C://chrome-win/chrome.exe',
        headless: false,
        defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();

    // await page.setDefaultNavigationTimeout(0)
    await page.goto("https://www.scientificamerican.com/section/latest-technology-stories/", { waitUntil: "load", timeout: 0 });

    let results = [];
    let data = [];
    let lastPageNumber = 5;

    for (let index = 0; index < lastPageNumber; index++) {
        results = results.concat(await extractedEvaluateCall(page));
        if (index !== lastPageNumber - 1) {
            await page.click('div.pagination__right a');
            await page.waitForTimeout(5000);
        }
    }

    for (let i = 0; i < results.length; i++) {
        await page.goto(results[i].url, { waitUntil: "load", timeout: 0 });
        const article = await getArticles(page);

        const insertData = {
            date: results[i].date,
            title: results[i].title,
            articles: article.article,
            url: results[i].url
        }
        data.push(insertData)
    }

    // Close the browser
    await browser.close();

    saveAsCSV(data);
};

async function extractedEvaluateCall(page) {
    // Get page data
    const quotes = await page.evaluate(() => {
        const quoteList = document.querySelectorAll("div.section-latest article.listing-wide");

        return Array.from(quoteList).map((quote) => {
            const url = quote.querySelector("a").href;
            const title = quote.querySelector("a div.listing-wide__inner h2.t_listing-title").innerText;
            const date = quote.querySelector("a div.listing-wide__inner div.t_meta").innerText;

            return { url, title, date };
        });
    });

    return quotes;
}

async function getArticles(page) {
    await page.waitForSelector('section.article-grid__main div.article-text')

    let article = '';

    try {
        article = await page.$eval("section.article-grid__main div.article-text", el => el.innerText);
    } catch (e) {

    }

    return { article }
}

// Start the scraping
getQuotes();
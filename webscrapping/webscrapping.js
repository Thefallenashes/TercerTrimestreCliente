const puppeteer = require('puppeteer')

async function example() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://caparazonverde.neocities.org/');
    const title = await page.title();
    console.log('Titulo:', title);

    await browser.close();
};
example();
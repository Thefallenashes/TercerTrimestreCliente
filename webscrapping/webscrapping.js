const puppeteer = require('puppeteer')
/**
async function example() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://caparazonverde.neocities.org/');
    const title = await page.title();
    console.log('Titulo:', title);

    await browser.close();
};
example();

async function example2() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://caparazonverde.neocities.org/');
    const text = await page.evaluate(() => {
        return document.querySelector('h3').innerText;
    });
    console.log(text);

    await browser.close();
};
example2();


async function example3() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    await page.goto('https://caparazonverde.neocities.org/');
    const text = await page.evaluate(() => {
        const element = document.querySelectorAll('h3');
        return Array.from(element).map(el => el.innerText);
    });
    console.log(text);

    await browser.close();
};
example3();



async function alsa() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();

    await page.goto('https://www.alsa.es/');
    const text = await page.evaluate(() => {
        const element = document.querySelectorAll('.contenedor-modulos-informacion ul li p');
        return Array.from(element).map(co=>co.innerText);
    });
    console.log(text);

    await browser.close();
};
alsa();
**/

async function example3() {
    const browser = await puppeteer.launch();
      const page = await browser.newPage();
    await page.goto('https://caparazonverde.neocities.org/');
     await page.click('#login');
     await page.type('#email' , 'diego@unendo.com');
     await page.type('#password', '123456');
    await page.click('#login-button');
    await page.waitForFunction(()=>{
        const el =document.querySelector('#message');
        return el && el.innerText.length>0;
    });
    const message =await page.evaluate(()=>{
        return document.querySelector('#message').innerText;
    })
    console.log(message);
    await browser.close();
    
};
example3();
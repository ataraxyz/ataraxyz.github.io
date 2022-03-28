const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
// (async () => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto('http://127.0.0.1:5501/index.html');
//   await page.screenshot({ path: 'example.png' });

//   await browser.close();
// })();
function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

const parseDataUrl = (dataUrl) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (matches.length !== 3) {
    throw new Error('Could not parse data URL.');
  }
  return { mime: matches[1], buffer: Buffer.from(matches[2], 'base64') };
};

const getDataUrlThroughCanvas = async (selector) => {
  // Create a new image element with unconstrained size.
  console.log( 'getDataUrlThroughCanvas A')
  const canvas = document.querySelector(selector);
  
  // const canvas = document.createElement('canvas');
  // const context = canvas.getContext('2d');
  // canvas.width = image.width;
  // canvas.height = image.height;

  // Ensure the image is loaded.
  // await new Promise((resolve) => {
  //   if (image.complete || (image.width) > 0) resolve();
  //   image.addEventListener('load', () => resolve());
  // });
  console.log( 'getDataUrlThroughCanvas B')
  // context.drawImage(image, 0, 0);
  return canvas.toDataURL();
};

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--window-size=64,64','--disable-gpu'],
    defaultViewport: null
    });
  // const browser = await puppeteer.launch(/* { headless: false, defaultViewport: null } */);
  // try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5501/pup/index.html');
    var dataArray = [];

    page
    .on('console', message =>
      console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
    .on('pageerror', ({ message }) => console.log(message))
    .on('response', response =>
      console.log(`${response.status()} ${response.url()}`))
    .on('requestfailed', request =>
      console.log(`${request.failure().errorText} ${request.url()}`))
    for (let i = 0; i < 1; i++) {
      console.log('Trying to render image ' + i);
    
      await delay(4000);
      // console.log('Trying to render image wait over ' + i);
      // console.log(tokenData.hash)
      // await page.keyboard.press('Control');
      // page.setViewport({ width: 1024, height: 1024 });
      // console.log( 'before delay');
      // await delay( 2000 );
      // console.log( 'after delay');
      //document.querySelector('body > section.section0 > div > p > canvas').toDataURL();
      // const dataUrl = await page.evaluate(() => {
      //     return document.querySelector('').toDataURL();
      //   });
      dataUrl = await page.evaluate(getDataUrlThroughCanvas, 'body > canvas');
      const { buffer } = parseDataUrl(dataUrl);
      console.log(dataUrl)
      dataArray.push(buffer);
      //fs.writeFileSync(`${i}_render.png`, buffer, 'base64');
    }
    console.log( 'Writing now');
    for (let i = 0; i < dataArray.length; i++) {
      fs.writeFileSync(`${i}_render.png`, dataArray[i], 'base64');
      console.log( 'wrote ' + i);
    }
    await browser.close();
    
  // } catch(err) { console.error(err); } finally { await browser.close(); }
})();



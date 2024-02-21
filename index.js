import puppeteer from "puppeteer";
import xlsx from "xlsx";

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // navigation timeout
  page.setDefaultNavigationTimeout(60000);

  await page.goto("https://www.google.com/maps/@48.1390836,17.1036057,93a,35y,2.81h,55.69t/data=!3m1!1e3?entry=ttu");

  // screen size 
  await page.setViewport({ width: 1080, height: 1024 });

  // type in search bar
  await page.type("#searchboxinput", "restaurant+seattle");

  // selector
  const searchResultSelector = ".mL3xi";
  await page.waitForSelector(searchResultSelector);
  await page.click(searchResultSelector);

  await page.waitForSelector(".hfpxzc");
  const places = [];

  for (let i = 0; i < 1; i++) {
    console.log(i);

    const element = await page.evaluateHandle(
      (index) => document.querySelectorAll(".hfpxzc")[index],
      i
    );

    if (element) {
      try {
        await element.click();
        await page.waitForNavigation();
        await page.waitForSelector(".CsEnBe");
        await page.waitForTimeout(1500);

        const placeName = await page.evaluate(
          () => document.querySelectorAll(".DUwDvf")[0].innerText
        );

        const existingPlace = places.find((place) => place.name === placeName);

        if (!existingPlace) {
          const items = await page.evaluate(
            () => document.querySelectorAll(".CsEnBe").length
          );

          const info = {};

          info["Name"] = placeName;

          for (let i = 0; i < items; i++) {
            const innerText = await page.evaluate(
              (index) => document.querySelectorAll(".CsEnBe")[index].innerText,
              i
            );

            const tooltip = await page.evaluate(
              (index) =>
                document.querySelectorAll(".CsEnBe")[index].dataset.tooltip,
              i
            );
            // wait 1 second 
            await page.waitForTimeout(1000);
            if (tooltip == "Copy address") {
              info["Address"] = innerText;
            } else if (tooltip == "Open website") {
              info["Website"] = `https://www.${innerText}`;
            } else if (tooltip == "Copy phone number") {
              info["Phone Number"] = innerText;
            }
          }

          places.push(info);
        }
      } catch (error) {
        console.log(error);
      }

      await page.evaluate(() => {
        const scrollElement = document.querySelectorAll(".ecceSd")[1];
        scrollElement.scrollBy(0, 300);
      });
    } else {
      break;
    }
  }
  console.log(places);
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(places);
  xlsx.utils.book_append_sheet(wb, ws, "Data");
  xlsx.writeFile(wb, "Places.xlsx");

  await browser.close();
})();

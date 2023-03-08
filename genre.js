const cheerio = require("cheerio");
const axios = require("axios");
const j2cp = require("json2csv").Parser;
const fs = require("fs");
const url = "https://www.apartments.com/chicago-il/";
const baseUrl = "https://www.apartments.com/chicago-il/";

const apartment_data = [];

let i = 2;

async function getInfo(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const title = $("h1").text().replace(/\s\s+/g, " ");
    const rooms = $(".pricingGridItem");
    const apartment = { name: title, details: [] };
    rooms.map((index, el) => {
      const price = $(el).find(".rentLabel").text().replace(/\s\s+/g, "");
      const details = $(el)
        .find(".detailsTextWrapper")
        .text()
        .replace(/\s\s+/g, " ");
      if (price && details) {
        apartment.details.push(`${price} --- ${details}`);
      }
    });
    return apartment;
  } catch (error) {
    console.error(error);
  }
}

async function getAppartment(url) {
  const apsData = [];

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const apartments = $(".mortar-wrapper");
    const apUrl = [];
    apartments.each(async (index, el) => {
      const url = $(el).find("article").attr("data-url");
      if (url) {
        apUrl.push(url);
      }
    });

    const apData = await Promise.all(
      apUrl.map(async (url) => {
        return getInfo(url);
      })
    );
    if ($(".next").length > 0 && i < 3) {
      let next_page = baseUrl + `${i++}/`;
      console.log("Next page");
      getAppartment(next_page);
    } else {
      apartment_data.push(...apData);
      console.log(apartment_data);
      const parser = new j2cp();
      const csv = parser.parse(apartment_data);
      fs.writeFileSync("./apartments.csv", csv);
    }
  } catch (error) {
    console.error(error);
  }
}

getAppartment(url);

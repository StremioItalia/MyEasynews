require("dotenv").config();
const express = require("express");
const axios = require("axios")
const app = express();
const fetch = require("node-fetch");
// var ptn = require("parse-torrent-name");
const ptt = require("parse-torrent-title");
const UTILS = require("../utils");

const {
  removeDuplicate,
  containEandS,
  containE_S,
  containsAbsoluteE,
  containsAbsoluteE_,
  getFlagFromName,
  qualities,
  filterBasedOnQuality,
  cleanName,
  getQuality,
} = require("../helper");

let cache = { lastInvalidatedAt: Date.now(), data: {} };
const cacheMaxDuration = 1000 * 60 * 60 * 24 * 1; // 1 giorno


//------------------------------------------------------------------------------------------

app
  .get("/", (req, res) => {
    return res.send("It Works !! 🌍");
  })
  .get("/manifest.json", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "application/json");

    var json = {
      id: "stremio.web.stream",
      version: "1.0.1",
      name: "Easy 2 v1",
      description: "From Easynews",
      logo: "",
      resources: [
        {
          name: "stream",
          types: ["movie", "series", "anime"],
          idPrefixes: ["tt", "kitsu"],
        },
      ],
      types: ["movie", "series"],
      catalogs: [],
    };

    return res.send(json);
  })
  .get("/stream/:type/:id", async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", "application/json");

    try {
      console.log(
        `Cache content: ${cache.data ? Object.keys(cache.data).length : 0}`
      );
    } catch (error) {}

    if (cache.lastInvalidatedAt < Date.now() - cacheMaxDuration) {
      cache.data = {};
      cache.lastInvalidatedAt = Date.now();
    }

    let media = req.params.type;
    let id = req.params.id;
    id = id.replace(".json", "");

    if (id in cache.data) {
      console.log(`Returning ${id} from cache...`);
      return res.send({ streams: [...cache.data[id]] });
    }

    let tmp = [];

    if (id.includes("kitsu")) {
      tmp = await UTILS.getImdbFromKitsu(id);
      if (!tmp) {
        return res.send({ stream: {} });
      }
    } else {
      tmp = id.split(":");
    }

    console.log(tmp);

    let [tt, s, e, abs_season, abs_episode, abs, aliasesString] = tmp;

    let aliases = aliasesString ? `${aliasesString}`.split("||") : [];

    let meta = await UTILS.getMeta2(tt, media);

    console.log({ meta });

    let result = [];
    let promises = [];

    if (media == "movie") {
      let splitName = `${meta.name}`.split(":").at(0);
      let splitName2 = `${meta.name}`.split("-");
      promises = [
        UTILS.fetchEasynews(`${meta?.name} ${meta.year}`),
        UTILS.fetchEasynews(`${splitName} ${+meta.year ?? 0}`),
        UTILS.fetchEasynews(`${splitName2} ${+meta.year ?? 0}`),
      ];
    } else {
      promises = [
        UTILS.fetchEasynews(
          `${meta.name} S${s.padStart(2, "0")}E${e.padStart(2, "0")}`
        ),
      ];

      if (abs) {
        promises = [
          ...promises,
          UTILS.fetchEasynews(`${meta.name} E${abs_episode.padStart(2, "0")}`),
          UTILS.fetchEasynews(`${meta.name} E${abs_episode.padStart(3, "0")}`),
          UTILS.fetchEasynews(`${meta.name} ${abs_episode.padStart(2, "0")}`),
          UTILS.fetchEasynews(`${meta.name} ${abs_episode.padStart(3, "0")}`),
          UTILS.fetchEasynews(
            `${meta.name} S${s.padStart(2, "0")}E${abs_episode.padStart(
              2,
              "0"
            )}`
          ),
        ];
      }
    }
    result = await Promise.all(promises);

    result = result.reduce((acc, curr, index) => {
      if (index === 0) {
        return [...curr];
      }
      return [...acc, ...(curr || [])];
    }, []);

    result = removeDuplicate(
      result.filter((el) => {
        return (
          !!el &&
          !!el["3"] &&
          !el["5"]?.includes("sample") &&
          !el["virus"] &&
          !el["passwd"]
        );
      }),
      "4"
    );

    console.log({ Results: result.length });

    aliases = [meta?.name, ...aliases];

    result = result
      .filter((el) => {
        const pttTitle = `${ptt.parse(el["10"]).title}`.toLowerCase();
        for (let alias of [...aliases]) {
          alias = `${alias}`.toLowerCase();
          if (!alias) return false;
          if (media == "movie") {
            if (
              cleanName(pttTitle).includes(cleanName(alias)) ||
              cleanName(alias).includes(cleanName(pttTitle))
            ) {
              return true;
            }
          } else if (media == "series") {
            if (cleanName(pttTitle) == cleanName(alias)) {
              return true;
            }
          }
        }
        return false;
      })
      .filter((el) => {
        if (media == "movie") return true;
        let lower = `${el["10"]}`.toLowerCase();

        return (
          containEandS(lower, s, e, abs, abs_season, abs_episode) ||
          containE_S(lower, s, e, abs, abs_season, abs_episode) ||
          (s == 1 &&
            !lower.match(/s\d+/gm) &&
            (containsAbsoluteE(lower, s, e, true, s, e) ||
              containsAbsoluteE_(lower, s, e, true, s, e))) ||
          (!!abs &&
            !lower.match(/s\d+/gm) &&
            (((containsAbsoluteE(lower, s, e, true, abs_season, abs_episode) ||
              containsAbsoluteE_(lower, s, e, true, abs_season, abs_episode)) &&
              !(lower.includes("season") || lower.match(/s\d+/gm))) ||
              containEandS(
                lower,
                s,
                abs_episode,
                true,
                abs_season,
                abs_episode
              ) ||
              containE_S(lower, s, abs_episode, true, abs_season, abs_episode)))
        );
      });

    // Filtra i risultati per mantenere solo i contenuti in italiano
    let streams = result
      .map((el) => {
        let subs = getFlagFromName(el["10"], el["slangs"] ?? []);
        let audios = getFlagFromName(el["10"], el["alangs"] ?? []);

        // Verifica se l'elemento è in italiano
        const isItalian =
          audios.includes("🇮🇹") ||
          subs.includes("🇮🇹") ||
          el["10"].toLowerCase().includes("ita") ||
          el["10"].toLowerCase().includes("italian");

        if (!isItalian) {
          return null; // Esclude i contenuti non italiani
        }

        const name =
          `[${result.length}]` +
          "Easy 2 " +
          getQuality(el["10"]) +
          ` | ${el["5"]} `;
        const title = `${el["10"]}\n${el["4"]} ${audios ? "🗣️" + audios : ""} ${
          subs ? " \n 💬: " + subs : ""
        }`;
        let bingeGroup = `Easy 2|${
          el["alangs"]
            ? el["alangs"].includes("ita")
              ? "ita"
              : el["alangs"].includes("eng")
              ? "eng"
              : "all"
            : "none"
        }|${getQuality(el["10"])?.trim() || "none"}`;
        return {
          title,
          url: el?.url,
          name,
          toTheTop:
            el["alangs"]?.includes("ita") ||
            el["slangs"]?.includes("eng") ||
            `${el["10"]}`.toLowerCase().includes("multi"),
          type: media,
          behaviorHints: {
            notWebReady: true,
            bingeGroup,
            proxyHeaders: {
              request: {
                Authorization: UTILS.defaultAuthorization,
                "User-Agent": "Stremio",
              },
            },
          },
        };
      })
      .filter(Boolean); // Rimuove gli elementi null

    streams = [
      ...filterBasedOnQuality(streams, qualities["4k"]),
      ...filterBasedOnQuality(streams, qualities.fhd),
      ...filterBasedOnQuality(streams, qualities.hd),
      ...filterBasedOnQuality(streams, qualities.sd),
      ...filterBasedOnQuality(streams, qualities.unknown),
    ];

    console.log({ final: streams.length });

    if (streams.length) {
      cache.data[id] = streams;
    }

    return res.send({
      streams: [...streams],
    });
  })
  .listen(process.env.PORT || 3000, () => {
    console.log(`working on ${process.env.PORT || 3000}`);
  });

module.exports = app;

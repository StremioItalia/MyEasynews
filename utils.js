const { sanitirizeName, parseToStreamUrl } = require("./helper");
const fetch = require("node-fetch");

const getAuthorization = () => {
  if (!process.env.EASY_USERNAME) return null;
  if (!process.env.EASY_PASSWORD) return null;
  return (
    "Basic " + btoa(`${process.env.EASY_USERNAME}:${process.env.EASY_PASSWORD}`)
  );
};

let isRedirect = async (url) => {
  try {
    const controller = new AbortController();
    // 5 second timeout:
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      redirect: "manual",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 301 || response.status === 302) {
      const locationURL = new URL(
        response.headers.get("location"),
        response.url
      );
      if (locationURL.href.startsWith("http")) {
        await isRedirect(locationURL);
      } else {
        return locationURL.href;
      }
    } else if (response.status >= 200 && response.status < 300) {
      return response.url;
    } else {
      // return response.url;
      return null;
    }
  } catch (error) {
    return null;
  }
};

let defaultAuthorization =

  getAuthorization() || "Basic dXNlcm5hbWU6cGFzc3dvcmQ=";

let fetchEasynews = async (query) => {
  query = sanitirizeName(query);
  console.log({ query });
  let url = `https://members.easynews.com/2.0/search/solr-search/?fly=2&gps=${query}&pby=9999&pno=1&s1=nsubject&s1d=%2B&s2=nrfile&s2d=%2B&s3=dsize&s3d=%2B&sS=0&d1t&d2t&b1t&b2t&px1t&px2t&fps1t&fps2t&bps1t&bps2t&hz1t&hz2t&rn1t&rn2t&grpF[]&st=adv&safeO=0&sb=1&fex=mkv mp4 ts avi flv`;

  https: return await fetch(url, {
    headers: {
      accept: "*/*",
      Authorization: defaultAuthorization,
    },
    referrerPolicy: "no-referrer",
    method: "GET",
  })
    .then((res) => res.json())
    .then(async (results) => {
      console.log({ Initial: "data" in results ? results["data"].length : 0 });
      return "data" in results
        ? results["data"].map((el, order) => {
            const baseUrl = `${results["downURL"]}/${results["dlFarm"]}/${results["dlPort"]}`;
            return {
              ...el,
              url: parseToStreamUrl(baseUrl, {
                ...el,
                sid: results["sid"] + ":" + order,
              }),
            };
          })
        : [];
    })
    .catch((err) => {
      console.log({ err });
      return [];
    });
};

function getMeta2(id, type) {
  var [tt, s, e] = id.split(":");

  const api1 = `https://v2.sg.media-imdb.com/suggestion/t/${tt}.json`;
  const api2 = `https://v3-cinemeta.strem.io/meta/${type}/${tt}.json`;

  return fetch(api1)
    .then((res) => res.json())
    .then((json) => {
      let { d } = json;
      return d ? d[(d.length ?? 1) - 1] : {};
    })
    .then(({ l, y }) => ({ name: l, year: y }))
    .catch((err) =>
      fetch(api2)
        .then((res) => res.json())
        .then((json) => ({
          name: json.meta["name"],
          year: json.meta["releaseInfo"]?.substring(0, 4) ?? "",
        }))
    );
}

function getMeta(id, type) {
  var [tt, s, e] = id.split(":");

  const api1 = `https://v2.sg.media-imdb.com/suggestion/t/${tt}.json`;
  const api2 = `https://v3-cinemeta.strem.io/meta/${type}/${tt}.json`;

  return fetch(api2)
    .then((res) => res.json())
    .then((json) => ({
      name: json.meta["name"],
      year: json.meta["releaseInfo"]?.substring(0, 4) ?? "",
    }))
    .catch((err) =>
      fetch(api1)
        .then((res) => res.json())
        .then((json) => {
          return json.d[0];
        })
        .then(({ l, y }) => ({ name: l, year: y }))
    );
}

async function getImdbFromKitsu(id) {
  var [kitsu, _id, e] = id.split(":");

  return fetch(`https://anime-kitsu.strem.fun/meta/anime/${kitsu}:${_id}.json`)
    .then((_res) => _res.json())
    .then((json) => {
      return json["meta"];
    })
    .then((json) => {
      try {
        let imdb = json["imdb_id"];
        let meta = json["videos"].find((el) => el.id == id);
        const aliases = (json["aliases"] ?? []).join("||");
        return [
          imdb,
          (meta["imdbSeason"] ?? 1).toString(),
          (meta["imdbEpisode"] ?? 1).toString(),
          (meta["season"] ?? 1).toString(),
          (meta["imdbSeason"] ?? 1).toString() == 1
            ? (meta["imdbEpisode"] ?? 1).toString()
            : (meta["episode"] ?? 1).toString(),
          meta["imdbEpisode"] != meta["episode"] || meta["imdbSeason"] == 1,
          aliases,
        ];
      } catch (error) {
        return null;
      }
    })
    .catch((err) => null);
}

module.exports = {
  getAuthorization,
  isRedirect,
  fetchEasynews,
  getMeta2,
  getMeta,
  getImdbFromKitsu,
  defaultAuthorization,
};

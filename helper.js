const VIDEO_EXTENSIONS = [
  "3g2",
  "3gp",
  "avi",
  "flv",
  "mkv",
  "mk3d",
  "mov",
  "mp2",
  "mp4",
  "m4v",
  "mpe",
  "mpeg",
  "mpg",
  "mpv",
  "webm",
  "wmv",
  "ogm",
  "ts",
  "m2ts",
];
const SUBTITLE_EXTENSIONS = [
  "aqt",
  "gsub",
  "jss",
  "sub",
  "ttxt",
  "pjs",
  "psb",
  "rt",
  "smi",
  "slt",
  "ssf",
  "srt",
  "ssa",
  "ass",
  "usf",
  "idx",
  "vtt",
];

const vf = ["vf", "it", "italian", "ita"]; // "vf", "vff", "french", "frn"];
const multi = ["multi"];
const vostfr = ["vostfr", "english", "eng"];

const qualities = {
  "4k": "🌟4k",
  fhd: "🎥FHD",
  hd: "📺HD",
  sd: "📱SD",
  unknown: "none",
};

let containEandS = (name = "", s, e, abs, abs_season, abs_episode) =>
  //SxxExx ./ /~/-
  //SxExx
  //SxExx
  //axb
  //Sxx - Exx
  //Sxx.Exx
  //Season xx Exx
  //SasEae selon abs
  //SasEaex  selon abs
  //SasEaexx  selon abs
  //SxxEaexx selon abs
  //SxxEaexxx  selon abs
  name?.includes(`s${s?.padStart(2, "0")}e${e?.padStart(2, "0")} `) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e?.padStart(2, "0")}.`) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e?.padStart(2, "0")}-`) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")} `) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")}.`) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")}-`) ||
  name?.includes(`${s}x${e}`) ||
  name?.includes(`s${s?.padStart(2, "0")} - e${e?.padStart(2, "0")}`) ||
  name?.includes(`s${s?.padStart(2, "0")}.e${e?.padStart(2, "0")}`) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")} `) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")}.`) ||
  name?.includes(`s${s}e${e?.padStart(2, "0")}-`) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e} `) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e}.`) ||
  name?.includes(`s${s?.padStart(2, "0")}e${e}-`) ||
  name?.includes(`season ${s} e${e}`) ||
  (!!abs &&
    (name?.includes(
      `s${abs_season?.padStart(2, "0")}e${abs_episode?.padStart(2, "0")}`
    ) ||
      name?.includes(
        `s${s?.padStart(2, "0")}e${abs_episode?.padStart(2, "0")}`
      ) ||
      name?.includes(
        `s${s?.padStart(2, "0")}e${abs_episode?.padStart(3, "0")}`
      ) ||
      name?.includes(
        `s${abs_season?.padStart(2, "0")}e${abs_episode?.padStart(3, "0")}`
      ) ||
      name?.includes(
        `s${abs_season?.padStart(2, "0")}e${abs_episode?.padStart(4, "0")}`
      )));

let containE_S = (name = "", s, e, abs, abs_season, abs_episode) =>
  //Sxx - xx
  //Sx - xx
  //Sx - x
  //Season x - x
  //Season x - xx
  name?.includes(`s${s?.padStart(2, "0")} - ${e?.padStart(2, "0")}`) ||
  name?.includes(`s${s} - ${e?.padStart(2, "0")}`) ||
  // name?.includes(`s${s} - ${e}`) ||
  // name?.includes(`season ${s} - ${e}`) ||
  name?.includes(`season ${s} - ${e?.padStart(2, "0")}`) ||
  name?.includes(`season ${s} - ${e?.padStart(2, "0")}`);

let containsAbsoluteE = (name = "", s, e, abs, abs_season, abs_episode) =>
  //- xx
  //- xxx
  //- xxxx
  //-exxxx
  //- 0x
  name?.includes(` ${abs_episode?.padStart(2, "0")} `) ||
  name?.includes(`e${abs_episode?.padStart(2, "0")} `) ||
  name?.includes(` ${abs_episode?.padStart(3, "0")} `) ||
  name?.includes(`e${abs_episode?.padStart(3, "0")} `) ||
  name?.includes(` 0${abs_episode} `) ||
  name?.includes(`e0${abs_episode} `) ||
  name?.includes(`e${abs_episode?.padStart(4, "0")} `) ||
  name?.includes(` ${abs_episode?.padStart(4, "0")} `);

let containsAbsoluteE_ = (name = "", s, e, abs, abs_season, abs_episode) => {
  // xx.
  // xxx.
  // xxxx.
  // 0x.

  return (
    name?.includes(` ${abs_episode?.padStart(2, "0")}.`) ||
    name?.includes(`e${abs_episode?.padStart(2, "0")}.`) ||
    name?.includes(` ${abs_episode?.padStart(3, "0")}.`) ||
    name?.includes(`e${abs_episode?.padStart(3, "0")}.`) ||
    name?.includes(` 0${abs_episode}.`) ||
    name?.includes(`e0${abs_episode}.`) ||
    name?.includes(` ${abs_episode?.padStart(4, "0")}.`) ||
    name?.includes(`e${abs_episode?.padStart(4, "0")}.`)
  );
};

let removeDuplicate = (data = [], key = "name") => {
  let response = [];
  data.forEach((one, i) => {
    let index_ = response.findIndex((el) => el[key] == one[key]);
    index_ == -1 ? response.push(one) : null;
  });
  return response;
};

const parseToStreamUrl = (baseURL, data) => {
  return encodeURI(
    `${baseURL}/${data["0"]}${data["11"]}/${data["10"]}${data["11"]}?sig=${data["sig"]}` +
      ("sid" in data ? `&sid=${data["sid"]}` : "")
  );
};

let cleanName = (name = "") => {
  // the, and, of, in, to, it, is, for, that, on, at, with
  return sanitirizeName(name)
    .toLowerCase()
    .replace(/\s+the\s+/g, " ")
    .replace(/\s+and\s+/g, " ")
    .replace(/\s+of\s+/g, " ")
    .replace(/\s+in\s+/g, " ")
    .replace(/\s+to\s+/g, " ")
    .replace(/\s+it\s+/g, " ")
    .replace(/\s+is\s+/g, " ")
    .replace(/\s+for\s+/g, " ")
    .replace(/\s+that\s+/g, " ")
    .replace(/\s+on\s+/g, " ")
    .replace(/\s+at\s+/g, " ")
    .replace(/\s+with\s+/g, " ")
    .replace(/\s+a\s+/g, " ")
    .replace(/\s+an\s+/g, " ")
    .trim();
};

let sanitirizeName = (name = "") => {
  // the, and, of, in, to, it, is, for, that, on, at, with
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
};

const isSomeContent = (file_name = "", langKeywordsArray = []) => {
  file_name = file_name.toLowerCase();
  return langKeywordsArray.some((word) => file_name.includes(word));
};

const isVfContent = (file_name) => isSomeContent(file_name, vf);
const isMultiContent = (file_name) => isSomeContent(file_name, multi);
const isVostfrContent = (file_name) => isSomeContent(file_name, vostfr);

const bringItaVideoToTheTopOfList = (streams = []) => {
  streams.sort((a, b) => {
    let a_lower = a.title.toLowerCase();
    let b_lower = b.title.toLowerCase();

    if (a?.toTheTop) return -1;
    if (b?.toTheTop) return 1;
    return isVfContent(a_lower) ||
      isVostfrContent(a_lower) ||
      isMultiContent(a_lower)
      ? -1
      : isVfContent(b_lower) ||
        isVostfrContent(b_lower) ||
        isMultiContent(a_lower)
      ? 1
      : 0;
  });
  return streams;
};

const getFlagFromLocal = (local = "") => {
  local = local.toLowerCase();
  if (!local) return "";
  switch (local) {
    case "ita":
      return " 🇮🇹";
    case "fre":
      return " 🇫🇷";
    case "jpn":
      return " 🇯🇵";
    case "kor":
      return " 🇰🇷";
    case "spa":
      return " 🇪🇸";
    case "pol":
      return " 🇵🇱";
    case "ger":
      return " 🇩🇪";
    case "rus":
      return " 🇷🇺";
    case "chi":
      return " 🇨🇳";
    case "eng":
      return " 🇬🇧";
    case "por":
      return " 🇵🇹";
    case "cze":
      return " 🇨🇿";
    case "dan":
      return " 🇩🇰";
    case "dut":
      return " 🇳🇱";
    case "fin":
      return " 🇫🇮";
    case "gre":
      return " 🇬🇷";
    case "hin":
      return " 🇮🇳";
    case "ind":
      return " 🇮🇩";
    case "rum":
      return " 🇷🇴";
    case "hin":
      return " 🇮🇳";
    case "tha":
      return " 🇹🇭";
    case "tur":
      return " 🇹🇷";
    case "vie":
      return " 🇻🇳";
    case "swe":
      return " 🇨🇭";
    case "nob":
      return " 🇳🇴";
    case "ara":
      return " 🇦🇪";
    case "mal":
      return " 🇲🇾";
    default:
      return ` [${local}]`.toUpperCase();
  }
};

const getFlagFromName = (file_name, audios = []) => {
  if (audios && audios.length) {
    let flags = "";
    audios.forEach((audio) => {
      flags += getFlagFromLocal(audio);
    });
    return flags.trim();
  }

  switch (true) {
    case isVfContent(file_name):
      return "| 🇮🇹";
    case isMultiContent(file_name):
      return "| 🌐";
    case isVostfrContent(file_name):
      return "| 🇬🇧";
    default:
      return "| 🏴󠁰󠁴󠀰󠀶󠁿";
  }
};

const filterBasedOnQuality = (streams = [], quality = "", audios = []) => {
  if (!quality) return [];
  if (!Object.values(qualities).includes(quality)) return [];

  if (quality == qualities.unknown) {
    streams = streams.filter((el) => {
      const l = `${el?.name}`;
      return (
        !l.includes(qualities["4k"]) &&
        !l.includes(qualities.fhd) &&
        !l.includes(qualities.hd) &&
        !l.includes(qualities.sd)
      );
    });
  } else {
    streams = streams.filter((el) => el.name.includes(quality));
  }
  return bringItaVideoToTheTopOfList(streams);
};

let isSuitable = (resultname = "", name = "") => {
  let nameArray = name.split(" ");

  let check = true;
  nameArray.forEach((word) => {
    if (
      word.length >= 3 &&
      !["the", "a", "an", "to", "too"].includes(word.toLowerCase())
    ) {
      check = check && resultname?.toLowerCase().includes(word?.toLowerCase());
      if (!check) return check;
    }
  });
  return check;
};

function getQuality(name) {
  if (!name) {
    return name;
  }
  name = name.toLowerCase();

  if (["2160", "4k", "uhd"].filter((x) => name.includes(x)).length > 0)
    return "🌟4k";
  if (["1080", "fhd"].filter((x) => name.includes(x)).length > 0)
    return " 🎥FHD";
  if (["720", "hd"].filter((x) => name.includes(x)).length > 0) return "📺HD";
  if (["480p", "380p", "sd"].filter((x) => name.includes(x)).length > 0)
    return "📱SD";
  return "";
}

// ----------------------------------------------

let isVideo = (element) => {
  return (
    element["name"]?.toLowerCase()?.includes(`.mkv`) ||
    element["name"]?.toLowerCase()?.includes(`.mp4`) ||
    element["name"]?.toLowerCase()?.includes(`.avi`) ||
    element["name"]?.toLowerCase()?.includes(`.m3u`) ||
    element["name"]?.toLowerCase()?.includes(`.m3u8`) ||
    element["name"]?.toLowerCase()?.includes(`.ts`) ||
    element["name"]?.toLowerCase()?.includes(`.flv`)
  );
};

const getProxyUrl = (url = "") => {
  if (!url) return url;

 // let pUrl = `https://cdpproxy.stuff2-stuff216.workers.dev?url=${encodeURIComponent(url)}`;
      return pUrl;
  };


module.exports = {
  containEandS,
  containE_S,
  containsAbsoluteE,
  containsAbsoluteE_,
  VIDEO_EXTENSIONS,
  SUBTITLE_EXTENSIONS,
  removeDuplicate,
  parseToStreamUrl,
  cleanName,
  bringItaVideoToTheTopOfList,
  getFlagFromName,
  qualities,
  filterBasedOnQuality,
  sanitirizeName,
  isVideo,
  isSuitable,
  getQuality,
  // getProxyUrl,
};

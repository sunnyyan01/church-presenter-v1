import { JSDOM } from "jsdom";
import { getAsync, waitForResp } from "./common.js";

class PassageNotFoundError extends Error {
    constructor(...params) {
        super(...params);

        this.name = "PassageNotFoundError";
        this.message = "Couldn't find requested passage";
    }
}

async function bibleGatewayLookup(loc, version) {
    let res = await getAsync(`https://www.biblegateway.com/passage/?search=${loc}&version=${version}&interface=print`)
        .catch(console.error);
    if (res.statusCode !== 200) {
        throw Error(`Error ${res.statusCode} from Bible Gateway`);
    }
    let data = await waitForResp(res);
    let dom = new JSDOM(data);
    let div = dom.window.document.querySelector("div.passage-content");
    if (!div) {
        throw new PassageNotFoundError();
    }
    let text = "";
    for (let span of div.getElementsByTagName("span")) {
        // Section title
        if (span.parentNode.tagName === "H3") continue;

        if (span.classList.contains("text")) {
            for (let el of span.childNodes) {
                console.log(el.textContent);
                if (el.classList && el.classList.contains("crossreference")) continue;
                text += el.textContent;
            }
            text += "\n";
        }
    }
    return text;
}

function mergeVersions(versionA, versionB) {
    console.log("Merging");
    versionA = versionA.split("\n");
    versionB = versionB.split("\n");
    let result = [];
    while (versionA.length && versionB.length) {
        if (versionA[0] < versionB[0])
            result.push(versionA.shift());
        else
            result.push(versionB.shift());
    }
    result.push(...(versionA.length ? versionA : versionB));
    return result.join("\n");
}

export async function bibleLookup(req, res) {
    // let [book, loc] = location.match(/(.+?)([0-9:-]+)/)
    // book = normaliseBook(book)

    let {loc} = req.query;
    let versionStr = req.query.version || "CUVMPS";
    let versions = versionStr.split(",");

    try {
        let results = await Promise.all(
            versions.map(version => bibleGatewayLookup(loc, version))
        )

        let result = (
            versions.length === 2
            ? mergeVersions(...results)
            : results.join("\n")
        );
        
        res.type("text/plain");
        res.send(result);
    } catch (e) {
        res.status(e instanceof PassageNotFoundError ? 404 : 500);
        res.send(e.message);
    }
}
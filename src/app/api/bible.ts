interface BibleLookupResult {
    loc: string;
    text: string;
}

export async function bibleLookup(loc: string, version: string): Promise<Array<BibleLookupResult>> {
    let url = "https://churchpresenterapi.azurewebsites.net/api/bible-lookup";
    let search = new URLSearchParams({loc, version, format: "json"});
    let resp = await fetch(url + "?" + search.toString());
    if (!resp.ok) throw new Error(await resp.text());
    return await resp.json();
}
export async function bibleLookup(loc: string, version: string) {
    let url = (
        true // sessionStorage.getItem("serverlessMode") === "true"
        ? "https://churchpresenterapi.azurewebsites.net/api/bible-lookup"
        : "/api/bible-lookup"
    )
    let search = new URLSearchParams({loc, version});
    let resp = await fetch(url + "?" + search.toString());
    if (!resp.ok) throw new Error();
    return await resp.text();
}
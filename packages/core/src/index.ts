// Links

function match(url: string) {
    //
}

export function links(url: string): string[] {
    /* 
        Find apple id in URL and episode id
        Use ids to create new links
        Return new links
    
    */

    return [""];
}

// import {
//     Entity,
//     ISearchOptions,
//     ItunesSearchResult,
//     ItunesLookupType
// } from "./interfaces";

// export default core;

// function apple() {
//     async function client(params: ISearchOptions) {
//         try {
//             const { data } = await axios.request<ItunesSearchResult>({
//                 url: "https://itunes.apple.com/search",
//                 params: {
//                     country: "US",
//                     media: "podcast",
//                     language: "en_us",
//                     explicit: true,
//                     ...params
//                 },
//                 headers: {
//                     Accept: "application/json"
//                 }
//             });
//             return data;
//         } catch (e) {
//             if (axios.isAxiosError(e)) {
//                 console.log("error message: ", e.message);
//                 return e.message;
//             } else {
//                 console.log("unexpected error: ", e);
//                 return "An unexpected error occurred";
//             }
//         }
//     }

//     async function search(term: string) {
//         const response = await client({
//             term: term,
//             media: "podcast",
//             entity: "podcast",
//             limit: 5
//         });

//         return "";
//     }
//     return {
//         search: search,
//         lookup() {}
//     };
// }

// function core() {}

/* 
    Search Apple iTunes API for a show
    Rate Limit:  20 calls per minute 
    Docs: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html#//apple_ref/doc/uid/TP40017632-CH5-SW2
*/
// interface IApplePodcastEntity {
//   titleTerm: string;
//   languageTerm: string;
//   authorTerm: string;
//   genreIndex: string;
//   artistTerm: string;
//   ratingIndex: string;
//   keywordsTerm: string;
//   descriptionTerm: string;
// }
// async function searchPodcasts({ term: string }): Promise<ItunesSearchResult[]> {
//     try {
//         const baseURL = "https://itunes.apple.com/";
//         const media = "podcast";
//         const entity = ""; // podcastAuthor, podcast
//         const attribute = ""; // titleTerm, languageTerm, authorTerm, genreIndex, artistTerm, ratingIndex, keywordsTerm, descriptionTerm
//         const country = "US"; //https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
//         const lang = "en_us";
//         const limit = "200"; //1-200
//         const explicit = true;

//         // const params: ISearchOptions = {};

//         return [];
//     } catch (error) {
//         throw error;
//     }
// }
// async function lookPodcasts({
//     identifier: ItunesLookupType,
//     value: string
// }): Promise<ItunesSearchResult[]> {
//     const baseURL = "https://itunes.apple.com/lookup";

//     try {
//         return [];
//     } catch (error) {
//         throw error;
//     }
// }

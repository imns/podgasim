"use strict";

import {
  ItunesSearchResult,
  ISearchOptions,
  ItunesLookupType,
} from "./interfaces";

export default core;

function core() {}

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
async function searchPodcasts({ term: string }): Promise<ItunesSearchResult[]> {
  try {
    const baseURL = "https://itunes.apple.com/";
    const media = "podcast";
    const entity = ""; // podcastAuthor, podcast
    const attribute = ""; // titleTerm, languageTerm, authorTerm, genreIndex, artistTerm, ratingIndex, keywordsTerm, descriptionTerm
    const country = "US"; //https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
    const lang = "en_us";
    const limit = "200"; //1-200
    const explicit = true;

    // const params: ISearchOptions = {};

    return [];
  } catch (error) {
    throw error;
  }
}
async function lookPodcasts({
  identifier: ItunesLookupType,
  value: string,
}): Promise<ItunesSearchResult[]> {
  const baseURL = "https://itunes.apple.com/lookup";

  try {
    return [];
  } catch (error) {
    throw error;
  }
}

/* 
    APPLE / ITUNES
*/

export enum ItunesWrapperType {
  Track = "track",
  Collection = "collection",
  Artist = "artist",
}

export enum ItunesExplicitnes {
  Explicit = "explicit",
  Cleaned = "cleaned ",
  NotExplicit = "notExplicit",
}

export interface ItunesSearchResult {
  wrapperType: ItunesWrapperType;
  kind: string;

  collectionId: number;
  trackId: number;

  artistName?: string;
  collectionName?: string;
  trackName?: string;
  collectionCensoredName?: string;
  trackCensoredName?: string;
  collectionViewUrl?: string;
  feedUrl?: string;
  trackViewUrl?: string;
  artworkUrl30?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  collectionPrice?: number;
  trackPrice?: number;
  trackRentalPrice?: number;
  collectionHdPrice?: number;
  trackHdPrice?: number;
  trackHdRentalPrice?: number;
  releaseDate?: string;
  collectionExplicitness?: ItunesExplicitnes;
  trackExplicitness?: ItunesExplicitnes;
  trackCount?: string;
  country?: string;
  currency?: string;
  primaryGenreName?: string;
  contentAdvisoryRating?: string;
  genreIds?: string[];
  genres?: string[];
}

export enum ItunesEntityPodcast {
  PodcastAuthor = "podcastAuthor",
  Podcast = "podcast",
}

export enum ItunesAttributePodcast {
  TitleTerm = "titleTerm",
  LanguageTerm = "languageTerm",
  AuthorTerm = "authorTerm",
  GenreIndex = "genreIndex",
  ArtistTerm = "artistTerm",
  RatingIndex = "ratingIndex",
  KeywordsTerm = "keywordsTerm",
  DescriptionTerm = "descriptionTerm",
}

export interface ISearchOptions {
  // A query to search for.
  term: string;

  //https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
  country?: "US";

  // The type of media to search for, the default is 'all'
  media: "podcast";

  // The type of results wanted,
  entity: ItunesEntityPodcast;

  attribute: ItunesAttributePodcast;

  // Maximum number of results to return.
  limit?: number;

  // Language to return the results in. (default is "en_us")
  lang?: "en_us";

  explicit: true;
}

export enum ItunesLookupType {
  ID = "id",
  AMGARTISTID = "amgArtistId",
  AMGALBUMID = "amgAlbumId",
  AMGVIDEOID = "amgVideoId",
  UPC = "upc",
  ISBN = "isbn",
}
